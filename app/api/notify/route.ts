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

// Find the GHL conversation for a phone number, then send an outbound SMS.
// This avoids the Contacts API entirely (which requires a different scope).
async function sendSms(phone: string, name: string, message: string): Promise<void> {
  const headers = ghlHeaders();
  const locationId = process.env.GHL_LOCATION_ID!.trim();

  // Step 1: find existing conversation by phone number
  console.log(`[notify] searching conversation for ${phone}`);
  const searchRes = await fetch(
    `${GHL_BASE}/conversations/search?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(phone)}&limit=1`,
    { headers }
  );
  if (!searchRes.ok) {
    const err = await searchRes.text();
    console.error(`[notify] conversation search failed (${searchRes.status}):`, err);
    throw new Error(`GHL conversation search failed (${searchRes.status}): ${err}`);
  }
  const searchData = await searchRes.json();
  const conversation = searchData.conversations?.[0];

  if (!conversation) {
    console.warn(`[notify] no conversation found for ${phone} — contact may not exist in GHL`);
    throw new Error(`No GHL conversation found for ${phone}`);
  }

  console.log(`[notify] found conversationId=${conversation.id} for ${name}`);

  // Step 2: send outbound SMS via conversation
  const body: Record<string, string> = {
    conversationId: conversation.id,
    type: "SMS",
    message,
  };
  if (process.env.GHL_FROM_NUMBER) body.fromNumber = process.env.GHL_FROM_NUMBER.trim();

  console.log(`[notify] sending outbound SMS fromNumber=${body.fromNumber ?? "not set"}`);
  const res = await fetch(`${GHL_BASE}/conversations/messages/outbound`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[notify] outbound message failed (${res.status}):`, text);
    throw new Error(`GHL outbound message failed (${res.status}): ${text}`);
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

    const { type, memberId, task, day, phone: testPhone, providerId: reqProviderId } = await req.json();
    console.log(`[notify] received type=${type} memberId=${memberId ?? "n/a"}`);

    if (type === "test" || type === "debug_test") {
      if (!testPhone) return NextResponse.json({ ok: false, error: "missing phone" }, { status: 400 });
      const locationId = process.env.GHL_LOCATION_ID!.trim();
      const headers = ghlHeaders();

      // Step 1: find conversation
      const sRes = await fetch(
        `${GHL_BASE}/conversations/search?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(testPhone)}&limit=1`,
        { headers }
      );
      const sBody = await sRes.text();
      let convId: string | null = null;
      try { convId = JSON.parse(sBody).conversations?.[0]?.id ?? null; } catch {}
      if (!convId) return NextResponse.json({ ok: false, step: "search", status: sRes.status, response: sBody });

      // Step 2: get conversationProviderId from messages
      const msgRes = await fetch(`${GHL_BASE}/conversations/${convId}/messages?limit=5`, { headers });
      const msgBody = await msgRes.text();
      let providerId: string | null = null;
      try {
        const msgs = JSON.parse(msgBody).messages?.messages ?? JSON.parse(msgBody).messages ?? [];
        for (const m of msgs) { if (m.conversationProviderId) { providerId = m.conversationProviderId; break; } }
      } catch {}

      // Step 3: get contactId from the conversation and send via messages endpoint
      let contactId: string | null = null;
      try { contactId = JSON.parse(sBody).conversations?.[0]?.contactId ?? null; } catch {}

      const sendBody: Record<string, unknown> = { type: "SMS", message: "Performance Dashboard SMS test - notifications are working!" };
      if (contactId) sendBody.contactId = contactId;
      if (process.env.GHL_FROM_NUMBER) sendBody.fromNumber = process.env.GHL_FROM_NUMBER.trim();
      const mRes = await fetch(`${GHL_BASE}/conversations/messages`, {
        method: "POST", headers, body: JSON.stringify(sendBody),
      });
      const mBody = await mRes.text();

      return NextResponse.json({ ok: mRes.ok, status: mRes.status, conversationId: convId, contactId, fromNumber: (sendBody.fromNumber ?? null), response: mBody });
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
