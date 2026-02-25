import { NextResponse } from "next/server";

const TEAM_NAMES: Record<string, string> = {
  scott: "Scott",
  emily: "Emily",
  anthony: "Anthony",
  nick: "Nick",
  inna: "Inna",
};

const MEMBER_PHONES: Record<string, string | undefined> = {
  scott: process.env.SCOTT_PHONE,
  emily: process.env.EMILY_PHONE,
  anthony: process.env.ANTHONY_PHONE,
  nick: process.env.NICK_PHONE,
  inna: process.env.INNA_PHONE,
};

const GHL_BASE = "https://services.leadconnectorhq.com";

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY?.trim()}`,
    Version: "2021-04-15",
    "Content-Type": "application/json",
  };
}

async function getOrCreateContact(phone: string, name: string): Promise<string> {
  const headers = ghlHeaders();
  const locationId = process.env.GHL_LOCATION_ID!.trim();

  // Search for existing contact by phone
  const searchRes = await fetch(
    `${GHL_BASE}/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(phone)}&limit=1`,
    { headers }
  );
  const searchData = await searchRes.json();
  if (searchData.contacts?.length > 0) return searchData.contacts[0].id;

  // Create contact if not found
  const createRes = await fetch(`${GHL_BASE}/contacts/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ locationId, phone, firstName: name }),
  });
  const createData = await createRes.json();
  return createData.contact.id;
}

async function sendSms(phone: string, name: string, message: string): Promise<void> {
  const headers = ghlHeaders();
  const contactId = await getOrCreateContact(phone, name);

  const body: Record<string, string> = { type: "SMS", contactId, message };
  if (process.env.GHL_FROM_NUMBER) body.fromNumber = process.env.GHL_FROM_NUMBER;

  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL SMS failed (${res.status}): ${text}`);
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.GHL_API_KEY?.trim() || !process.env.GHL_LOCATION_ID?.trim()) {
      return NextResponse.json({ ok: true, skipped: "no_ghl_configured" });
    }

    const { type, memberId, task, day } = await req.json();

    if (type === "task_assigned") {
      const phone = MEMBER_PHONES[memberId];
      const name = TEAM_NAMES[memberId] || memberId;
      if (!phone) return NextResponse.json({ ok: true, skipped: "no_phone_for_member" });

      await sendSms(
        phone,
        name,
        `Hi ${name} — you have a new task assigned for ${day}:\n\n"${task}"\n\nLog into the dashboard to complete it.`
      );

    } else if (type === "daily_reminder") {
      const recipients = Object.entries(MEMBER_PHONES).filter(
        ([, p]) => !!p
      ) as [string, string][];

      await Promise.all(
        recipients.map(([id, phone]) =>
          sendSms(
            phone,
            TEAM_NAMES[id] || id,
            `Hi ${TEAM_NAMES[id] || id} — daily reminder to complete and submit your performance checklist before end of day.`
          )
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("GHL notify error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
