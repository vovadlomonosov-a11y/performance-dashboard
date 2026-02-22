import { NextResponse } from "next/server";
import { loadWeekData } from "@/lib/sheets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");
  if (!week) return NextResponse.json({ error: "Missing week" }, { status: 400 });

  try {
    const data = await loadWeekData(week);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/load] error:", error);
    console.error("[/api/load] error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
