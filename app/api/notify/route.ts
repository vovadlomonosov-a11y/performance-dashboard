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

  console.log(`[notify] searching contact phone=${phone}`);
  const searchRes = await fetch(
    `${GHL_BASE}/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(phone)}&limit=1`,
    { headers }
  );
  if (!searchRes.ok) {
    const err = await searchRes.text();
    console.error(`[notify] contact search failed (${searchRes.status}):`, err);
    throw new Error(`GHL contact search failed (${searchRes.status}): ${err}`);
  }
  const searchData = await searchRes.json();
  if (searchData.contacts?.length > 0) {
    console.log(`[notify] found existing contact: ${searchData.contacts[0].id}`);
    return searchData.contacts[0].id;
  }

  console.log(`[notify] creating new contact for ${name}`);
  const createRes = await fetch(`${GHL_BASE}/contacts/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ locationId, phone, firstName: name }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    console.error(`[notify] contact create failed (${createRes.status}):`, err);
    throw new Error(`GHL contact create failed (${createRes.status}): ${err}`);
  }
  const createData = await createRes.json();
  const contactId = createData.contact?.id;
  if (!contactId) {
    console.error(`[notify] contact create response missing id:`, JSON.stringify(createData));
    throw new Error("GHL contact create returned no id");
  }
  console.log(`[notify] created contact: ${contactId}`);
  return contactId;
}

async function sendSms(phone: string, name: string, message: string): Promise<void> {
  const headers = ghlHeaders();
  const contactId = await getOrCreateContact(phone, name);

  const body: Record<string, string> = { type: "SMS", contactId, message };
  if (process.env.GHL_FROM_NUMBER) body.fromNumber = process.env.GHL_FROM_NUMBER.trim();

  console.log(`[notify] sending SMS to contactId=${contactId} fromNumber=${body.fromNumber ?? "not set"}`);
  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[notify] SMS send failed (${res.status}):`, text);
    throw new Error(`GHL SMS failed (${res.status}): ${text}`);
  }
  console.log(`[notify] SMS sent OK to ${name}`);
}

export async function POST(req: Request) {
  try {
    const hasGhl = !!process.env.GHL_API_KEY?.trim() && !!process.env.GHL_LOCATION_ID?.trim();
    if (!hasGhl) {
      console.warn("[notify] GHL not configured — skipping");
      return NextResponse.json({ ok: true, skipped: "no_ghl_configured" });
    }

    const { type, memberId, task, day, phone: testPhone } = await req.json();
    console.log(`[notify] received type=${type} memberId=${memberId}`);

    if (type === "test" || type === "debug_test") {
      if (!testPhone) return NextResponse.json({ ok: false, error: "missing phone" }, { status: 400 });
      const locationId = process.env.GHL_LOCATION_ID!.trim();
      const headers = ghlHeaders();

      // Send directly with toNumber (no contact lookup)
      const smsBody: Record<string, string> = { type: "SMS", toNumber: testPhone, message: "✅ Performance Dashboard SMS test — notifications are working!", locationId };
      if (process.env.GHL_FROM_NUMBER) smsBody.fromNumber = process.env.GHL_FROM_NUMBER.trim();
      const s = await fetch(`${GHL_BASE}/conversations/messages`, { method: "POST", headers, body: JSON.stringify(smsBody) });
      const sbody = await s.text();

      return NextResponse.json({ ok: s.ok, status: s.status, fromNumber: smsBody.fromNumber ?? null, response: sbody });
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
        `Hi ${name} — you have a new task assigned for ${day}:\n\n"${task}"\n\nLog into the dashboard to complete it.`
      );

    } else if (type === "daily_reminder") {
      const recipients = Object.entries(MEMBER_PHONES).filter(
        ([, p]) => !!p
      ) as [string, string][];

      console.log(`[notify] sending daily reminder to ${recipients.length} recipients`);
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
    console.error("[notify] error:", e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
