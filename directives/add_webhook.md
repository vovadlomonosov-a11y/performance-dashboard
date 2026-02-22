# Directive: Add a Webhook

## Goal
Register a new Modal webhook that maps a URL slug to a directive, then deploy and test it.

## Inputs
- `slug` — short identifier for the endpoint (e.g. `send-weekly-report`)
- `directive_file` — relative path inside `directives/` (e.g. `weekly_report.md`)
- Description of what the webhook should do

## Steps

### 1. Create the directive
Write the directive file in `directives/<directive_file>` describing:
- Goal
- Inputs (what the webhook payload must contain)
- Tools/scripts to use
- Expected outputs
- Edge cases

### 2. Register the webhook
Add an entry to `execution/webhooks.json`:
```json
{
  "webhooks": {
    "<slug>": {
      "directive": "<directive_file>",
      "description": "<short description>"
    }
  }
}
```

### 3. Deploy
```bash
modal deploy execution/modal_webhook.py
```

### 4. Test the endpoint
Use the execute endpoint with the slug and sample inputs:
```bash
curl -X POST <execute_endpoint_url> \
  -H "Content-Type: application/json" \
  -d '{"slug": "<slug>", "inputs": {...}}'
```

### 5. Verify Slack notification
Check the Slack channel — all webhook activity streams there in real time.

## Available Tools for Webhooks
- `send_email` — SMTP email via env vars
- `read_sheet` — read rows from a Google Sheet
- `update_sheet` — write rows to a Google Sheet

## Edge Cases
- If the directive file is missing, the endpoint returns a 500 error — create the file first.
- Slack streaming requires `SLACK_WEBHOOK_URL` in `.env`.
- Google Sheets tools require `credentials.json` and `token.json` in the project root.
- Modal deployment requires `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` or running `modal token new`.
