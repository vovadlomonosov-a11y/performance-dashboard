import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TEAM_NAMES: Record<string, string> = {
  scott: "Scott",
  emily: "Emily",
  anthony: "Anthony",
  nick: "Nick",
};

const MEMBER_EMAILS: Record<string, string | undefined> = {
  scott: process.env.SCOTT_EMAIL,
  emily: process.env.EMILY_EMAIL,
  anthony: process.env.ANTHONY_EMAIL,
  nick: process.env.NICK_EMAIL,
};

const DASHBOARD_URL =
  process.env.DASHBOARD_URL ||
  "https://performance-dashboard-five-psi.vercel.app";

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD)
    return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

export async function POST(req: Request) {
  try {
    const { type, memberId, task, day } = await req.json();

    const transporter = getTransporter();
    if (!transporter) {
      return NextResponse.json({ ok: true, skipped: "no_smtp_configured" });
    }

    if (type === "task_assigned") {
      const email = MEMBER_EMAILS[memberId];
      const name = TEAM_NAMES[memberId] || memberId;
      if (!email) {
        return NextResponse.json({ ok: true, skipped: "no_email_for_member" });
      }

      await transporter.sendMail({
        from: `"Upstate Auto Dashboard" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `📌 New task assigned — ${day}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; color: #1e293b;">
            <h2 style="color: #ef4444; margin-bottom: 8px;">📌 New Task Assigned</h2>
            <p>Hi ${name},</p>
            <p>You've been assigned a new task for <strong>${day}</strong>:</p>
            <div style="background: #f1f5f9; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 15px;">
              <strong>${task}</strong>
            </div>
            <p>
              <a href="${DASHBOARD_URL}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Open Dashboard →
              </a>
            </p>
          </div>`,
      });
    } else if (type === "daily_reminder") {
      const recipients = Object.entries(MEMBER_EMAILS).filter(
        ([, e]) => !!e
      ) as [string, string][];

      await Promise.all(
        recipients.map(([id, email]) =>
          transporter!.sendMail({
            from: `"Upstate Auto Dashboard" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "⏰ Daily reminder — Submit your checklist",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; color: #1e293b;">
                <h2 style="color: #3b82f6; margin-bottom: 8px;">Daily Checklist Reminder</h2>
                <p>Hi ${TEAM_NAMES[id] || id},</p>
                <p>This is your end-of-day reminder to complete and submit your performance checklist.</p>
                <p>
                  <a href="${DASHBOARD_URL}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                    Open Dashboard →
                  </a>
                </p>
              </div>`,
          })
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Notify error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
