import { NextResponse } from "next/server";

const TEAM_NAMES: Record<string, string> = {
  scott: "Scott",
  emily: "Emily",
  anthony: "Sergio",
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

async function findContact(phone: string, name: string, headers: Record<string, string>, locationId: string): Promise<string | null> {
  // Try 1: search conversations for existing contact
  console.log(`[notify] searching conversation for ${phone}`);
  const searchRes = await fetch(
    `${GHL_BASE}/conversations/search?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(phone)}&limit=1`,
    { headers }
  );
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    const conversation = searchData.conversations?.[0];
    if (conversation?.contactId) {
      console.log(`[notify] found contactId=${conversation.contactId} via conversation search`);
      return conversation.contactId;
    }
  }

  // Try 2: search contacts directly
  console.log(`[notify] no conversation found, searching contacts for ${phone}`);
  const contactSearchRes = await fetch(
    `${GHL_BASE}/contacts/search/duplicate?locationId=${encodeURIComponent(locationId)}&number=${encodeURIComponent(phone)}`,
    { headers }
  );
  if (contactSearchRes.ok) {
    const contactData = await contactSearchRes.json();
    const contact = contactData.contact;
    if (contact?.id) {
      console.log(`[notify] found contactId=${contact.id} via contact search`);
      return contact.id;
    }
  }

  console.warn(`[notify] ${name} (${phone}) not found in GHL — add them as a contact in GoHighLevel`);
  return null;
}

async function sendSms(phone: string, name: string, message: string): Promise<any> {
  const headers = ghlHeaders();
  const locationId = process.env.GHL_LOCATION_ID!.trim();

  const contactId = await findContact(phone, name, headers, locationId);
  if (!contactId) {
    throw new Error(`${name} (${phone}) is not a contact in GoHighLevel — please add them in GHL first`);
  }
  console.log(`[notify] using contactId=${contactId} for ${name}`);

  // Step 2: send SMS via conversations/messages
  const body: Record<string, string> = { type: "SMS", contactId, message };
  if (process.env.GHL_FROM_NUMBER) body.fromNumber = process.env.GHL_FROM_NUMBER.trim();

  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`GHL SMS failed (${res.status}): ${JSON.stringify(resData)}`);
  }
  console.log(`[notify] SMS sent OK to ${name} (${phone}), response:`, JSON.stringify(resData));
  return resData;
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

    if (type === "diagnose") {
      const headers = ghlHeaders();
      const locationId = process.env.GHL_LOCATION_ID!.trim();
      const fromNumber = process.env.GHL_FROM_NUMBER?.trim() || "(not set)";
      const phones: Record<string, string> = {};
      for (const [id, ph] of Object.entries(MEMBER_PHONES)) {
        phones[id] = ph || "(not set)";
      }
      // Check a recent conversation message status
      const results: any = { locationId, fromNumber, phones, conversations: {} };
      for (const [id, ph] of Object.entries(MEMBER_PHONES)) {
        if (!ph) { results.conversations[id] = "no phone"; continue; }
        try {
          const sRes = await fetch(
            `${GHL_BASE}/conversations/search?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(ph)}&limit=1`,
            { headers }
          );
          if (sRes.ok) {
            const sData = await sRes.json();
            const conv = sData.conversations?.[0];
            if (conv) {
              // Get last message from this conversation
              const mRes = await fetch(
                `${GHL_BASE}/conversations/${conv.id}/messages?limit=3`,
                { headers }
              );
              const mData = mRes.ok ? await mRes.json() : null;
              const rawMsgs = Array.isArray(mData?.messages) ? mData.messages :
                (mData?.messages?.messages ? mData.messages.messages : []);
              const lastMsgs = rawMsgs.slice(0, 3).map((m: any) => ({
                body: (m.body || "").substring(0, 80),
                status: m.status,
                direction: m.direction,
                type: m.type,
                date: m.dateAdded,
              }));
              results.conversations[id] = { contactId: conv.contactId, convId: conv.id, lastMessages: lastMsgs, rawShape: mData ? Object.keys(mData) : null };
            } else {
              results.conversations[id] = "no conversation found";
            }
          } else {
            results.conversations[id] = `search failed (${sRes.status})`;
          }
        } catch (e: any) {
          results.conversations[id] = `error: ${e.message}`;
        }
      }
      return NextResponse.json({ ok: true, diagnostics: results });
    }

    if (type === "task_assigned") {
      const phone = MEMBER_PHONES[memberId];
      const name = TEAM_NAMES[memberId] || memberId;
      if (!phone) {
        console.warn(`[notify] no phone configured for memberId=${memberId}`);
        return NextResponse.json({ ok: true, skipped: "no_phone_for_member" });
      }
      const smsResult = await sendSms(
        phone,
        name,
        `Hi ${name} - you have a new task assigned for ${day}:\n\n"${task}"\n\nLog into the dashboard to complete it.`
      );
      return NextResponse.json({ ok: true, smsResult });

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
