# -*- coding: utf-8 -*-
"""
create_sheet_as_user.py
Authenticates as your Google account, creates the spreadsheet in YOUR Drive,
shares it with the service account, writes all headers, and prints env vars.

Run: py execution/create_sheet_as_user.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SERVICE_ACCOUNT_EMAIL = "dashboard-app@artfact-storage.iam.gserviceaccount.com"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def get_user_credentials():
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request

    creds_path = ROOT / "credentials.json"
    token_path = ROOT / "token.json"

    if not creds_path.exists():
        print("[ERROR] credentials.json not found.")
        sys.exit(1)

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None

        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
            creds = flow.run_local_server(port=9090, open_browser=True)
            with open(token_path, "w") as f:
                f.write(creds.to_json())
            print("[OK] Authenticated and token saved.")

    return creds


def create_spreadsheet(sheets_service):
    result = sheets_service.spreadsheets().create(body={
        "properties": {"title": "Performance Dashboard"},
        "sheets": [
            {"properties": {"title": "WeeklyData",    "index": 0}},
            {"properties": {"title": "Streaks",        "index": 1}},
            {"properties": {"title": "History",        "index": 2}},
            {"properties": {"title": "SalesHistory",   "index": 3}},
            {"properties": {"title": "TintHistory",    "index": 4}},
        ],
    }).execute()
    return result["spreadsheetId"]


def write_headers(sheets_service, spreadsheet_id):
    headers = {
        "WeeklyData":   [["week", "timestamp", "data_json"]],
        "Streaks":      [["member", "weeks90", "weeks95", "history_json"]],
        "History":      [["week", "member", "role", "mon_pct", "tue_pct", "wed_pct", "thu_pct", "fri_pct", "week_pct", "finalized_at"]],
        "SalesHistory": [["week", "day", "jobs_closed", "revenue", "upsells", "upsell_revenue"]],
        "TintHistory":  [["week", "day", "vehicle", "services", "reduction_vlt", "split", "split_with"]],
    }
    for sheet, rows in headers.items():
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=f"{sheet}!A1",
            valueInputOption="RAW",
            body={"values": rows},
        ).execute()
        print(f"   [OK] Headers: {sheet}")


def share_with_service_account(drive_service, spreadsheet_id):
    drive_service.permissions().create(
        fileId=spreadsheet_id,
        body={"type": "user", "role": "writer", "emailAddress": SERVICE_ACCOUNT_EMAIL},
        sendNotificationEmail=False,
    ).execute()
    print(f"   [OK] Shared with {SERVICE_ACCOUNT_EMAIL}")


def print_env_vars(spreadsheet_id):
    sa_path = ROOT / "service_account.json"
    sa_json = sa_path.read_text().replace("\n", " ").strip() if sa_path.exists() else "<paste service_account.json contents here>"
    print("\n" + "=" * 60)
    print("Add to .env.local AND Vercel environment variables:")
    print("=" * 60)
    print(f"SPREADSHEET_ID={spreadsheet_id}")
    print(f"GOOGLE_SERVICE_ACCOUNT_JSON={sa_json}")
    print("=" * 60)


def main():
    from googleapiclient.discovery import build

    print("Opening browser for Google sign-in...")
    creds = get_user_credentials()

    sheets = build("sheets", "v4", credentials=creds)
    drive  = build("drive",  "v3", credentials=creds)

    print("Creating spreadsheet in your Google Drive...")
    sid = create_spreadsheet(sheets)
    print(f"   [OK] ID: {sid}")

    print("Writing headers...")
    write_headers(sheets, sid)

    print("Sharing with service account...")
    share_with_service_account(drive, sid)

    print(f"\n[DONE] https://docs.google.com/spreadsheets/d/{sid}")
    print_env_vars(sid)


if __name__ == "__main__":
    main()
