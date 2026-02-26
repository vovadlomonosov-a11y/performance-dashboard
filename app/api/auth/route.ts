import { NextResponse } from "next/server";

const PINS: Record<string, string | undefined> = {
  owner: process.env.OWNER_PIN,
  scott: process.env.SCOTT_PIN,
  emily: process.env.EMILY_PIN,
  anthony: process.env.ANTHONY_PIN,
  nick: process.env.NICK_PIN,
  inna: process.env.INNA_PIN,
};

export async function POST(request: Request) {
  const { pin } = await request.json();
  if (!pin) return NextResponse.json({ error: "Missing PIN" }, { status: 400 });

  const trimmed = pin.trim();

  for (const [role, storedPin] of Object.entries(PINS)) {
    if (storedPin && storedPin.trim() === trimmed) {
      return NextResponse.json({ role });
    }
  }

  return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
}
