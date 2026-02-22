import { google } from "googleapis";
import { JWT, OAuth2Client } from "google-auth-library";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

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

// ─── Save ──────────────────────────────────────────────────────────────────

export async function saveWeekData(week: string, data: Record<string, unknown>): Promise<void> {
  const sheets = getSheets();
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "WeeklyData!A:A",
  });

  const rows = res.data.values || [];
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === week) { rowIndex = i + 1; break; }
  }

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

const TEAM_IDS = ["scott", "emily", "anthony", "nick"];
const TEAM_ROLES: Record<string, string> = {
  scott: "Sales",
  emily: "VIP Experience & Ops",
  anthony: "Window Tinter",
  nick: "Detailer",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
    const dayPcts = Array.from({ length: 5 }, (_, di) => {
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
  for (let di = 0; di < 5; di++) {
    const sl = salesLogs[`scott_${di}`] || {};
    if (sl.jobsClosed || sl.revenue) {
      salesRows.push([week, DAYS[di], sl.jobsClosed || 0, sl.revenue || 0, sl.upsells || 0, sl.upsellRevenue || 0]);
    }
  }

  // ── Tint history ───────────────────────────────────────────────────────
  const tintLogs = (data.tintLogs as Record<string, { jobs?: Record<string, unknown>[] }>) || {};
  const tintRows: unknown[][] = [];
  for (let di = 0; di < 5; di++) {
    for (const job of tintLogs[`anthony_${di}`]?.jobs || []) {
      tintRows.push([week, DAYS[di], job.vehicle || "", job.services || "", job.reduction || "", job.split || false, job.splitWith || ""]);
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
    writeIfNeeded("TintHistory!A:G", tintRows),
  ]);
}
