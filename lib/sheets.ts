import { google } from "googleapis";
import { JWT, OAuth2Client } from "google-auth-library";

const SPREADSHEET_ID = (process.env.SPREADSHEET_ID || "").trim();

function getAuth(): JWT | OAuth2Client {
  // Option A: Service account (recommended for production)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  // Option B: OAuth refresh token (from setup_sheets.py output)
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return client;
  }

  throw new Error(
    "No Google auth configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_REFRESH_TOKEN in env vars."
  );
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

// ─── Load ──────────────────────────────────────────────────────────────────

export async function loadWeekData(week: string): Promise<{
  weekData: Record<string, unknown> | null;
  streaks: Record<string, unknown>;
}> {
  const sheets = getSheets();

  const [weekRes, streakRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "WeeklyData!A:C" }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Streaks!A:D" }),
  ]);

  // Parse week data
  let weekData: Record<string, unknown> | null = null;
  const weekRows = weekRes.data.values || [];
  for (let i = 1; i < weekRows.length; i++) {
    if (weekRows[i][0] === week) {
      try { weekData = JSON.parse(weekRows[i][2]); } catch {}
      break;
    }
  }

  // Parse streaks
  const streaks: Record<string, unknown> = {};
  const streakRows = streakRes.data.values || [];
  for (let i = 1; i < streakRows.length; i++) {
    const [member, weeks90, weeks95, histJson] = streakRows[i];
    if (!member) continue;
    try {
      streaks[member] = {
        weeks90: Number(weeks90) || 0,
        weeks95: Number(weeks95) || 0,
        history: JSON.parse(histJson || "[]"),
      };
    } catch {}
  }

  return { weekData, streaks };
}

// ─── Merge helpers ────────────────────────────────────────────────────────

/**
 * Deep-merge incoming save data into existing stored data so concurrent
 * users don't overwrite each other. Strategy per field:
 *
 *  wd (checklist items):
 *    Merge at member → day → item level.  For each item, true wins over
 *    false (once checked it stays checked — the only way to uncheck is via
 *    the explicit "uncheck" path which sends the single-item toggle).
 *
 *  sub (submissions):
 *    Union merge — once true, never reverts.
 *
 *  wF (week finalized):
 *    Sticky true — once finalized, stays finalized.
 *
 *  notWorked:
 *    OR merge — if either side marks a day as not-worked, keep it.
 *
 *  All keyed logs (salesLogs, tintLogs, carLogs, outLogs, wrapLogs,
 *  notes, ownerTasks, clockLogs):
 *    Merge at the top-level key (e.g. "scott_0"). Each key belongs to one
 *    member's one day, so the incoming version wins for that key. Existing
 *    keys NOT present in incoming are preserved.
 */
function mergeWeekData(
  existing: Record<string, any> | null,
  incoming: Record<string, any>,
): Record<string, any> {
  if (!existing) return incoming;

  const merged: Record<string, any> = { ...existing };

  // ── wd: checklist items (true wins) ──────────────────────────────────
  if (incoming.wd) {
    const eWd = existing.wd || {};
    const iWd = incoming.wd;
    const mWd: Record<string, any> = { ...eWd };
    for (const mid of Object.keys(iWd)) {
      mWd[mid] = { ...(eWd[mid] || {}) };
      for (const di of Object.keys(iWd[mid] || {})) {
        const eDayItems = (eWd[mid] || {})[di] || {};
        const iDayItems = iWd[mid][di] || {};
        mWd[mid][di] = { ...eDayItems };
        for (const itemId of Object.keys(iDayItems)) {
          // true wins: once checked, stays checked
          mWd[mid][di][itemId] = eDayItems[itemId] || iDayItems[itemId];
        }
      }
    }
    merged.wd = mWd;
  }

  // ── sub: submissions (once true, never reverts) ──────────────────────
  if (incoming.sub !== undefined) {
    const eSub = existing.sub || {};
    const iSub = incoming.sub || {};
    merged.sub = { ...eSub };
    for (const key of Object.keys(iSub)) {
      if (iSub[key]) merged.sub[key] = true;
    }
    // Preserve any existing true values not in incoming
    for (const key of Object.keys(eSub)) {
      if (eSub[key]) merged.sub[key] = true;
    }
  }

  // ── wF: sticky true ─────────────────────────────────────────────────
  merged.wF = existing.wF || incoming.wF || false;

  // ── notWorked: OR merge ─────────────────────────────────────────────
  if (incoming.notWorked !== undefined) {
    const eNW = existing.notWorked || {};
    const iNW = incoming.notWorked || {};
    merged.notWorked = { ...eNW };
    for (const key of Object.keys(iNW)) {
      merged.notWorked[key] = eNW[key] || iNW[key];
    }
  }

  // ── Keyed logs: merge at top-level key, incoming wins per key ───────
  for (const field of ["salesLogs", "tintLogs", "carLogs", "outLogs", "wrapLogs", "notes", "ownerTasks", "clockLogs"] as const) {
    if (incoming[field] !== undefined) {
      const eField = existing[field] || {};
      const iField = incoming[field] || {};
      merged[field] = { ...eField };
      for (const key of Object.keys(iField)) {
        // Only overwrite if incoming has actual content for this key
        const iVal = iField[key];
        const hasContent =
          iVal && (typeof iVal !== "object" || Object.keys(iVal).length > 0);
        if (hasContent) {
          merged[field][key] = iVal;
        }
      }
    }
  }

  return merged;
}

// ─── Save ──────────────────────────────────────────────────────────────────

export async function saveWeekData(
  week: string,
  data: Record<string, unknown>,
  unchecks?: { member: string; day: number; item: string }[],
  force?: boolean,
): Promise<void> {
  const sheets = getSheets();
  const timestamp = new Date().toISOString();

  // Load existing data so we can merge instead of overwrite
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "WeeklyData!A:C",
  });

  const rows = res.data.values || [];
  let rowIndex = -1;
  let existingData: Record<string, any> | null = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === week) {
      rowIndex = i + 1;
      try { existingData = JSON.parse(rows[i][2]); } catch {}
      break;
    }
  }

  // force=true skips merge (used by reset)
  const merged = force ? (data as Record<string, any>) : mergeWeekData(existingData, data as Record<string, any>);

  // Apply explicit unchecks AFTER the merge (overrides the true-wins rule)
  if (!force && unchecks && merged.wd) {
    for (const { member, day, item } of unchecks) {
      if (merged.wd[member]?.[day]) {
        merged.wd[member][day][item] = false;
      }
    }
  }

  const dataJson = JSON.stringify(merged);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "WeeklyData!A:C",
      valueInputOption: "RAW",
      requestBody: { values: [[week, timestamp, dataJson]] },
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `WeeklyData!A${rowIndex}:C${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[week, timestamp, dataJson]] },
    });
  }
}

// ─── Streaks ───────────────────────────────────────────────────────────────

export async function saveStreaks(
  streaks: Record<string, { weeks90: number; weeks95: number; history: unknown[] }>
): Promise<void> {
  const sheets = getSheets();
  const values = Object.entries(streaks).map(([member, s]) => [
    member, s.weeks90, s.weeks95, JSON.stringify(s.history || []),
  ]);
  if (values.length === 0) return;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Streaks!A2:D200",
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Streaks!A2",
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// ─── Finalize (history rows) ───────────────────────────────────────────────

const TEAM_IDS = ["scott", "emily", "anthony", "nick", "inna"];
const TEAM_ROLES: Record<string, string> = {
  scott: "Sales",
  emily: "VIP Experience & Ops",
  anthony: "Window Tinter",
  nick: "Detailer",
  inna: "Window Tinter",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function appendHistory(
  week: string,
  data: Record<string, unknown>,
  streaks: Record<string, { weeks90: number; weeks95: number; history: { week: string; score: number }[] }>
): Promise<void> {
  const sheets = getSheets();
  const now = new Date().toISOString();
  const wd = (data.wd as Record<string, Record<number, Record<string, boolean>>>) || {};

  // ── History rows (per member) ──────────────────────────────────────────
  const historyRows: unknown[][] = [];
  for (const memberId of TEAM_IDS) {
    const memberStreaks = streaks[memberId] || { weeks90: 0, weeks95: 0, history: [] };
    const lastEntry = memberStreaks.history.find((h) => h.week === week);
    const weekScore = lastEntry?.score ?? 0;

    const memberWd = wd[memberId] || {};
    const dayPcts = Array.from({ length: 6 }, (_, di) => {
      const dayData = memberWd[di] || {};
      const items = Object.values(dayData);
      if (items.length === 0) return 0;
      return Math.round((items.filter(Boolean).length / items.length) * 100);
    });

    historyRows.push([week, memberId, TEAM_ROLES[memberId], ...dayPcts, weekScore, now]);
  }

  // ── Sales history ──────────────────────────────────────────────────────
  const salesLogs = (data.salesLogs as Record<string, Record<string, unknown>>) || {};
  const salesRows: unknown[][] = [];
  for (let di = 0; di < 6; di++) {
    const sl = salesLogs[`scott_${di}`] || {};
    if (sl.jobsClosed || sl.revenue) {
      salesRows.push([week, DAYS[di], sl.jobsClosed || 0, sl.revenue || 0, sl.upsells || 0, sl.upsellRevenue || 0]);
    }
  }

  // ── Tint history ───────────────────────────────────────────────────────
  const tintLogs = (data.tintLogs as Record<string, { jobs?: Record<string, unknown>[] }>) || {};
  const tintRows: unknown[][] = [];
  for (const tinterId of ["anthony", "inna"]) {
    for (let di = 0; di < 6; di++) {
      for (const job of tintLogs[`${tinterId}_${di}`]?.jobs || []) {
        tintRows.push([week, tinterId, DAYS[di], job.vehicle || "", job.services || "", job.reduction || "", job.split || false, job.splitWith || ""]);
      }
    }
  }

  // ── Batch write ────────────────────────────────────────────────────────
  const writeIfNeeded = async (range: string, rows: unknown[][]) => {
    if (rows.length === 0) return;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });
  };

  await Promise.all([
    writeIfNeeded("History!A:J", historyRows),
    writeIfNeeded("SalesHistory!A:F", salesRows),
    writeIfNeeded("TintHistory!A:H", tintRows),
  ]);
}
