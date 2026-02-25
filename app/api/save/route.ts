import { NextResponse } from "next/server";
import { saveWeekData } from "@/lib/sheets";

export async function POST(request: Request) {
  const body = await request.json();
  const { week, data, unchecks, force } = body;
  if (!week || !data) return NextResponse.json({ error: "Missing week or data" }, { status: 400 });

  try {
    await saveWeekData(week, data, unchecks, force);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/save] error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
