import { NextResponse } from "next/server";

const TEAM_NAMES: Record<string, string> = {
  scott: "Scott",
  emily: "Emily",
  anthony: "Anthony",
  nick: "Nick",
  inna: "Inna",
};

const MEMBER_PHONES: Record<string, string | undefined> = {
  scott: process.env.SCOTT_PHONE?.trim(),
  emily: process.env.EMILY_PHONE?.trim(),
  anthony: process.env.ANTHONY_PHONE?.trim(),
  nick: process.env.NICK_PHONE?.trim(),
  inna: process.env.INNA_PHONE?.trim(),
};

const GHL_BASE = "https://services.leadconnectorhq.com";

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY?.trim()}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

async function sendSms(phone: string, name: string, message: string): Promise<void> {
  const headers = ghlHeaders();
  const locationId = process.env.GHL_LOCATION_ID!.trim();

  // Step 1: search conversations to get contactId (no Contacts API scope needed)
  console.log(`[notify] searching conversation for ${phone}`);
  const searchRes = await fetch(
    `${GHL_BASE}/conversations/search?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(phone)}&limit=1`,
    { headers }
  );
  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`GHL conversation search failed (${searchRes.status}): ${err}`);
  }
  const searchData = await searchRes.json();
  const conversation = searchData.conversations?.[0];
  if (!conversation?.contactId) {
    throw new Error(`No GHL conversation found for ${phone} — contact not in GHL`);
  }
  console.log(`[notify] found contactId=${conversation.contactId} for ${name}`);

  // Step 2: send SMS via conversations/messages
  const body: Record<string, string> = { type: "SMS", contactId: conversation.contactId, message };
  if (process.env.GHL_FROM_NUMBER) body.fromNumber = process.env.GHL_FROM_NUMBER.trim();

  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL SMS failed (${res.status}): ${text}`);
  }
  console.log(`[notify] SMS sent OK to ${name} (${phone})`);
}

export async function POST(req: Request) {
  try {
    const hasGhl = !!process.env.GHL_API_KEY?.trim() && !!process.env.GHL_LOCATION_ID?.trim();
    if (!hasGhl) {
      console.warn("[notify] GHL not configured — skipping");
      return NextResponse.json({ ok: true, skipped: "no_ghl_configured" });
    }

    const { type, memberId, task, day, phone: testPhone } = await req.json();
    console.log(`[notify] received type=${type} memberId=${memberId ?? "n/a"}`);

    if (type === "test" || type === "debug_test") {
      if (!testPhone) return NextResponse.json({ ok: false, error: "missing phone" }, { status: 400 });
      await sendSms(testPhone, "Test", "Performance Dashboard SMS test - notifications are working!");
      return NextResponse.json({ ok: true });
    }

    if (type === "task_assigned") {
      const phone = MEMBER_PHONES[memberId];
      const name = TEAM_NAMES[memberId] || memberId;
      if (!phone) {
        console.warn(`[notify] no phone configured for memberId=${memberId}`);
        return NextResponse.json({ ok: true, skipped: "no_phone_for_member" });
      }
      await sendSms(
        phone,
        name,
        `Hi ${name} - you have a new task assigned for ${day}:\n\n"${task}"\n\nLog into the dashboard to complete it.`
      );

    } else if (type === "daily_reminder") {
      const recipients = Object.entries(MEMBER_PHONES).filter(([, p]) => !!p) as [string, string][];
      console.log(`[notify] sending daily reminder to ${recipients.length} recipients`);
      await Promise.all(
        recipients.map(([id, phone]) =>
          sendSms(phone, TEAM_NAMES[id] || id, `Hi ${TEAM_NAMES[id] || id} - daily reminder to complete and submit your performance checklist before end of day.`)
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[notify] error:", e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
