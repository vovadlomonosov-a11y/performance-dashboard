import { NextResponse } from "next/server";
import { saveWeekData, saveStreaks, appendHistory } from "@/lib/sheets";

export async function POST(request: Request) {
  const body = await request.json();
  const { week, data, streaks } = body;
  if (!week || !data) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  try {
    await saveWeekData(week, data);
    if (streaks && Object.keys(streaks).length > 0) {
      await saveStreaks(streaks);
    }
    await appendHistory(week, data, streaks || {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/finalize] error:", error);
    return NextResponse.json({ error: "Failed to finalize week" }, { status: 500 });
  }
}
