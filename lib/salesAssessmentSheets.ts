import { google } from "googleapis";
import { JWT, OAuth2Client } from "google-auth-library";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
const SHEET_NAME = "SalesAssessments";

const HEADERS = [
  "Timestamp",
  "Name",
  "Email",
  "Total Time",
  "Voice 1 — New BMW Customer (link)",
  "Voice 2 — Price Objection (link)",
  "Voice 3 — Cold Lead Callback (link)",
  "Written — SMS Follow-up (Mike)",
  "Written — Email Confirmation (Sarah)",
  "Written — Casual Text Reply",
  "Sales — The Cheap Buyer",
  "Sales — The Shopper",
  "Sales — The Ghost",
  "Objection 1 Response",
  "Objection 1 Time (sec)",
  "Objection 2 Response",
  "Objection 2 Time (sec)",
  "Objection 3 Response",
  "Objection 3 Time (sec)",
  "Objection 4 Response",
  "Objection 4 Time (sec)",
  "Objection 5 Response",
  "Objection 5 Time (sec)",
  "CRM — New Lead Process",
  "CRM — Weekly Reporting",
  "CRM Tools Used",
  "Timezone & Availability",
  "Hot Lead at 4:45 PM",
  "Home Office Setup",
  "Culture — Google Reviews",
  "Culture — Feedback Response",
  "Culture — Why This Role",
];

function getAuth(): JWT | OAuth2Client {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return client;
  }
  throw new Error(
    "No Google auth configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_REFRESH_TOKEN."
  );
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

async function ensureSheetAndHeaders(
  sheets: ReturnType<typeof getSheets>
): Promise<void> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:A1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      // Sheet exists but is empty — write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isNotFound =
      message.includes("Unable to parse range") ||
      message.includes("Requested entity was not found") ||
      (err as { code?: number }).code === 400;

    if (isNotFound) {
      // Tab doesn't exist — create it then write headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
    } else {
      throw err;
    }
  }
}

export async function saveSalesAssessment(data: {
  name: string;
  email: string;
  totalTime: string;
  responses: Record<string, string>;
}): Promise<void> {
  const sheets = getSheets();
  await ensureSheetAndHeaders(sheets);

  const timestamp = new Date().toISOString();
  const r = data.responses;

  const row = [
    timestamp,
    data.name,
    data.email,
    data.totalTime,
    r.voice_1 || "",
    r.voice_2 || "",
    r.voice_3 || "",
    r.written_text || "",
    r.written_email || "",
    r.written_casual || "",
    r.sales_cheap || "",
    r.sales_shopper || "",
    r.sales_ghost || "",
    r.objection_0 || "",
    r.objection_0_time || "",
    r.objection_1 || "",
    r.objection_1_time || "",
    r.objection_2 || "",
    r.objection_2_time || "",
    r.objection_3 || "",
    r.objection_3_time || "",
    r.objection_4 || "",
    r.objection_4_time || "",
    r.crm_newlead || "",
    r.crm_reporting || "",
    r.crm_tools || "",
    r.tz_hours || "",
    r.tz_hotlead || "",
    r.tz_setup || "",
    r.culture_shop || "",
    r.culture_feedback || "",
    r.culture_why || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:AJ`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}
