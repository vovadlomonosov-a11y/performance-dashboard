import { NextResponse } from "next/server";
import { google } from "googleapis";
import { JWT, OAuth2Client } from "google-auth-library";

function getAuth(): JWT | OAuth2Client {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new JWT({ email: key.client_email, key: key.private_key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  }
  throw new Error("No Google auth configured");
}

// Convert ISO week string "YYYY-WNN" to "YYYY-MM" using the week's Thursday date
// (ISO 8601 rule: the week belongs to the year containing its Thursday)
function weekToMonth(weekStr: string): string | null {
  const m = weekStr.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return null;
  const year = parseInt(m[1]), week = parseInt(m[2]);
  // Find Jan 4 of the year (always in week 1) then step to the given week's Monday
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1..Sun=7
  const weekOneMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  const monday = new Date(weekOneMonday.getTime() + (week - 1) * 7 * 86400000);
  // Use Thursday of that week for month assignment
  const thursday = new Date(monday.getTime() + 3 * 86400000);
  return `${thursday.getFullYear()}-${String(thursday.getMonth() + 1).padStart(2, "0")}`;
}

// History sheet columns (after Saturday was added):
// A=Week, B=MemberId, C=Role, D=Mon%, E=Tue%, F=Wed%, G=Thu%, H=Fri%, I=Sat%, J=WeekScore, K=Timestamp
const DAY_COLS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID!.trim(),
      range: "History!A:K",
    });

    const rows = (res.data.values || []).filter(
      (r) => r[0] && /^\d{4}-W\d+$/.test(r[0]) // skip header / empty
    );

    // monthlyData[month][memberId] = { scores, dayPcts, weeks }
    const monthlyData: Record<string, Record<string, { scores: number[]; dayPcts: number[][]; weeks: string[] }>> = {};

    for (const row of rows) {
      const [week, memberId, , ...rest] = row;
      // rest[0..5] = day pcts, rest[6] = weekScore
      const dayPcts = DAY_COLS.map((_, i) => Number(rest[i]) || 0);
      const weekScore = Number(rest[6]) || 0;

      const month = weekToMonth(week);
      if (!month || !memberId) continue;

      if (!monthlyData[month]) monthlyData[month] = {};
      if (!monthlyData[month][memberId]) monthlyData[month][memberId] = { scores: [], dayPcts: [], weeks: [] };

      monthlyData[month][memberId].scores.push(weekScore);
      monthlyData[month][memberId].dayPcts.push(dayPcts);
      monthlyData[month][memberId].weeks.push(week);
    }

    // Compute averages per member per month
    const result: Record<string, Record<string, { avg: number; best: number; weeks: number; weekList: string[] }>> = {};
    for (const [month, members] of Object.entries(monthlyData)) {
      result[month] = {};
      for (const [memberId, d] of Object.entries(members)) {
        const avg = d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0;
        const best = d.scores.length ? Math.max(...d.scores) : 0;
        result[month][memberId] = { avg, best, weeks: d.scores.length, weekList: d.weeks };
      }
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    console.error("[/api/monthly] error:", e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
