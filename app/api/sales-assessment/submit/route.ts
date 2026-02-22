import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveSalesAssessment } from "@/lib/salesAssessmentSheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, responses, totalTime } = body as {
      name: string;
      email: string;
      responses: Record<string, string>;
      totalTime: string;
    };

    if (!name || !email) {
      return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
    }

    // Save every field to Google Sheets
    await saveSalesAssessment({ name, email, totalTime, responses });

    // Send email notification if SMTP is configured (non-fatal — sheets save regardless)
    if (process.env.SMTP_HOST && process.env.NOTIFICATION_EMAIL) {
      sendNotificationEmail({ name, email, responses, totalTime }).catch((err) => {
        console.error("[sales-assessment] email failed (non-fatal):", err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/sales-assessment/submit] error:", error);
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 });
  }
}

// ─── Email ──────────────────────────────────────────────────────────────────

async function sendNotificationEmail(data: {
  name: string;
  email: string;
  responses: Record<string, string>;
  totalTime: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Assessment Submitted: ${data.name} — Sales Specialist`,
    html: buildEmailHtml(data),
  });
}

function field(label: string, value: string) {
  const safe = (value || "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin-bottom:6px">${label}</div>
      <div style="font-size:14px;line-height:1.7;color:#333;background:#f9f9f9;padding:14px;border-radius:4px;border-left:3px solid #C8A862;white-space:pre-wrap;font-family:inherit">${safe}</div>
    </div>`;
}

function section(title: string, ...fields: string[]) {
  return `
    <h2 style="color:#C8A862;border-bottom:2px solid #C8A862;padding-bottom:8px;margin-top:36px;font-size:18px">${title}</h2>
    ${fields.join("")}`;
}

function buildEmailHtml(data: {
  name: string;
  email: string;
  responses: Record<string, string>;
  totalTime: string;
}) {
  const { name, email, responses: r, totalTime } = data;

  const body = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:720px;margin:0 auto;background:#fff;padding:40px;border-radius:8px">
      <div style="background:#0F0F0F;padding:20px 28px;border-radius:8px;margin-bottom:28px;display:flex;align-items:center;gap:16px">
        <div style="background:linear-gradient(135deg,#C8A862,#A08840);width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#0F0F0F;font-size:14px;letter-spacing:1px;flex-shrink:0">UAS</div>
        <div>
          <div style="color:#F5F0E8;font-weight:700;font-size:16px">Upstate Auto Styling</div>
          <div style="color:#8A8478;font-size:13px;margin-top:2px">Sales Specialist Assessment — New Submission</div>
        </div>
      </div>

      <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-bottom:8px">
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:6px 0;color:#888;font-size:13px;width:120px">Candidate</td>
            <td style="padding:6px 0;font-weight:600;font-size:15px;color:#111">${name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#888;font-size:13px">Email</td>
            <td style="padding:6px 0;font-size:14px"><a href="mailto:${email}" style="color:#C8A862">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#888;font-size:13px">Time Taken</td>
            <td style="padding:6px 0;font-size:14px;color:#333">${totalTime}</td>
          </tr>
        </table>
      </div>

      ${section(
        "🎙️ Voice &amp; Spoken English",
        field("Scenario 1 — New BMW Customer (Recording)", r.voice_1),
        field("Scenario 2 — Price Objection (Recording)", r.voice_2),
        field("Scenario 3 — Cold Lead Callback (Recording)", r.voice_3)
      )}

      ${section(
        "✍️ Written Communication",
        field("SMS Follow-up — Mike / Ceramic Quote", r.written_text),
        field("Email Confirmation — Sarah / PPF Booking", r.written_email),
        field("Casual Text Reply — Truck Windows", r.written_casual)
      )}

      ${section(
        "💡 Sales Instinct",
        field("The Cheap Buyer", r.sales_cheap),
        field("The Shopper", r.sales_shopper),
        field("The Ghost", r.sales_ghost)
      )}

      ${section(
        "⚡ Objection Handling (Timed)",
        field(`Objection 1 — "That's way more than I expected." (${r.objection_0_time || "?"}s)`, r.objection_0),
        field(`Objection 2 — "I need to talk to my wife about it." (${r.objection_1_time || "?"}s)`, r.objection_1),
        field(`Objection 3 — "Can you just email me the quote?" (${r.objection_2_time || "?"}s)`, r.objection_2),
        field(`Objection 4 — "Found someone on Facebook for half the price." (${r.objection_3_time || "?"}s)`, r.objection_3),
        field(`Objection 5 — "Not sure I need ceramic coating, car's already 3 years old." (${r.objection_4_time || "?"}s)`, r.objection_4)
      )}

      ${section(
        "🖥️ CRM &amp; Tech Fluency",
        field("New Lead Process (Step-by-Step)", r.crm_newlead),
        field("Weekly Reporting — What Numbers Would You Pull?", r.crm_reporting),
        field("CRM Tools Used", r.crm_tools)
      )}

      ${section(
        "🕐 Time Zone &amp; Availability",
        field("Time Zone &amp; Hours Availability", r.tz_hours),
        field("Hot Lead at 4:45 PM Friday — What Do You Do?", r.tz_hotlead),
        field("Home Office Setup", r.tz_setup)
      )}

      ${section(
        "🤝 Culture &amp; Coachability",
        field("Google Reviews Research", r.culture_shop),
        field("Response to Feedback: 'You talk too much, not enough questions'", r.culture_feedback),
        field("Why Upstate Auto Styling?", r.culture_why)
      )}

      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#aaa;text-align:center">
        Submitted via the Sales Specialist Assessment form
      </div>
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px;background:#f0f0f0">${body}</body></html>`;
}
