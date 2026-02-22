# -*- coding: utf-8 -*-
"""
setup_sheets.py -- Creates and configures the Google Spreadsheet for the dashboard.
Run once: py execution/setup_sheets.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SHARE_WITH_EMAIL = "vovadlomonosov@gmail.com"


def get_credentials():
    from google.oauth2.service_account import Credentials
    sa_path = ROOT / "service_account.json"
    if not sa_path.exists():
        print("[ERROR] service_account.json not found in project root.")
        sys.exit(1)
    return Credentials.from_service_account_file(
        str(sa_path),
        scopes=[
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ],
    )


def create_spreadsheet(drive_service):
    file = drive_service.files().create(
        body={
            "name": "Performance Dashboard",
            "mimeType": "application/vnd.google-apps.spreadsheet",
        },
        fields="id",
    ).execute()
    return file["id"]


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
        print(f"   [OK] Headers set for {sheet}")


def share_with_user(drive_service, spreadsheet_id):
    try:
        drive_service.permissions().create(
            fileId=spreadsheet_id,
            body={
                "type": "user",
                "role": "writer",
                "emailAddress": SHARE_WITH_EMAIL,
            },
            sendNotificationEmail=False,
        ).execute()
        print(f"   [OK] Shared with {SHARE_WITH_EMAIL}")
    except Exception as e:
        print(f"   [WARN] Could not share: {e}")
        print(f"          Open the sheet and share manually if needed.")


def print_env_vars(spreadsheet_id):
    sa_json = (ROOT / "service_account.json").read_text().replace("\n", " ").strip()
    print("\n" + "=" * 60)
    print("Add these to .env.local AND Vercel environment variables:")
    print("=" * 60)
    print(f"SPREADSHEET_ID={spreadsheet_id}")
    print(f"GOOGLE_SERVICE_ACCOUNT_JSON={sa_json}")
    print("=" * 60)


def main():
    from googleapiclient.discovery import build

    print("Authenticating with service account...")
    creds = get_credentials()

    sheets_service = build("sheets", "v4", credentials=creds)
    drive_service  = build("drive",  "v3", credentials=creds)

    print("Creating Google Spreadsheet...")
    spreadsheet_id = create_spreadsheet(drive_service)
    print(f"   [OK] Spreadsheet ID: {spreadsheet_id}")

    print("Writing headers...")
    write_headers(sheets_service, spreadsheet_id)

    print("Sharing with your Google account...")
    share_with_user(drive_service, spreadsheet_id)

    print(f"\n[DONE] Spreadsheet ready.")
    print(f"   URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")

    print_env_vars(spreadsheet_id)


if __name__ == "__main__":
    main()
