# Directive: Deploy Dashboard + Connect Google Sheets

## Overview

This directive walks through the full setup: creating the Google Sheet, connecting it to the Next.js app, and deploying to Vercel.

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- A GitHub account
- A Vercel account (free tier works)

---

## Step 1 — Install Node.js dependencies

```bash
cd "Performance Dashboard"
npm install
```

---

## Step 2 — Set up Google credentials

### 2a. Rename your credentials file

Rename `client_secret_*.json` → `credentials.json` in the project root.

```bash
# In the project root:
cp "client_secret_641056828935-....json" credentials.json
```

### 2b. Add localhost redirect URI

Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**

Click on your OAuth 2.0 client → **Authorized redirect URIs** → Add:
```
http://localhost:8080
```
Save.

### 2c. Enable required APIs

In Google Cloud Console → **APIs & Services** → **Library**, enable:
- **Google Sheets API**
- **Google Drive API**

---

## Step 3 — Create the Google Sheet

Install Python dependencies:
```bash
pip install google-auth google-auth-oauthlib google-api-python-client python-dotenv
```

Run the setup script (this opens a browser for one-time auth):
```bash
python execution/setup_sheets.py
```

This will:
1. Open your browser → sign in with your Google account → grant access
2. Create a spreadsheet called "Performance Dashboard" with 5 tabs
3. Print the `SPREADSHEET_ID` and OAuth tokens you need

**Copy the output** — you'll need it in the next step.

---

## Step 4 — Configure environment variables

Create `.env.local` in the project root:

```env
# From setup_sheets.py output:
SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_ID=641056828935-0gq1cr5alk5ptukem458jh8vr1dokuo7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

> **Note:** `.env.local` is in `.gitignore` — never commit it.

---

## Step 5 — Test locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Check data in the dashboard
- Toggle a checkbox → wait 2 seconds → "✓ Saved" appears in the header
- Check your Google Sheet — a row should appear in `WeeklyData`

---

## Step 6 — Deploy to Vercel

### 6a. Push to GitHub

```bash
git init
git add .
git commit -m "Initial dashboard deploy"
git remote add origin https://github.com/YOUR_USERNAME/performance-dashboard.git
git push -u origin main
```

### 6b. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Environment Variables** — add each var from Step 4:
   - `SPREADSHEET_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
5. Click **Deploy**

Vercel gives you a URL like `https://performance-dashboard-xyz.vercel.app`.

---

## Alternative: Service Account (more robust for production)

If the OAuth refresh token expires, you can switch to a service account:

1. Google Cloud Console → **IAM & Admin** → **Service Accounts** → **Create**
2. Name it `dashboard-app`, skip roles
3. Click the account → **Keys** → **Add Key** → **JSON** → download
4. Share your Google Sheet with the service account email (e.g., `dashboard-app@gen-lang-client-0517900737.iam.gserviceaccount.com`) — give it **Editor** access
5. In Vercel, add `GOOGLE_SERVICE_ACCOUNT_JSON` = the entire contents of the downloaded JSON file (paste as one line)
6. Remove `GOOGLE_REFRESH_TOKEN` from env vars

The app will automatically use the service account when `GOOGLE_SERVICE_ACCOUNT_JSON` is set.

---

## Google Sheet Structure

| Sheet | Purpose |
|-------|---------|
| `WeeklyData` | Full state snapshot per week (one JSON blob per row) |
| `Streaks` | Per-member streak counts and history |
| `History` | Human-readable weekly scores per member (written on Finalize) |
| `SalesHistory` | Scott's daily sales numbers (written on Finalize) |
| `TintHistory` | Anthony's tint jobs (written on Finalize) |

---

## Ongoing Maintenance

- **New week**: The app auto-detects the week via ISO week number. Just use it — data auto-saves.
- **Finalize Week**: Click "✓ FINALIZE WEEK" — this writes summary rows to History/Sales/Tint tabs.
- **Review past data**: Open the Google Sheet → filter `History` by week column.
- **Adding team members**: Edit `TEAM` array in `components/Dashboard.tsx`, redeploy.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No Google auth configured" | Check that env vars are set correctly in Vercel |
| OAuth token expired | Re-run `setup_sheets.py` locally → update `GOOGLE_REFRESH_TOKEN` in Vercel |
| Sheet not updating | Check Vercel function logs (Vercel dashboard → Deployments → Functions) |
| Spreadsheet not found | Verify `SPREADSHEET_ID` matches the URL of your Google Sheet |
