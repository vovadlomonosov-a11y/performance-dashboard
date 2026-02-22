"""
Modal webhook app — do not modify unless necessary.
Each endpoint maps a slug to a directive and executes it.

Deploy:  modal deploy execution/modal_webhook.py
"""

import json
import os
from pathlib import Path

import modal

app = modal.App("performance-dashboard-webhooks")

image = modal.Image.debian_slim().pip_install(
    "anthropic",
    "gspread",
    "google-auth",
    "google-auth-oauthlib",
    "python-dotenv",
    "slack-sdk",
)

WEBHOOKS_FILE = Path(__file__).parent / "webhooks.json"
DIRECTIVES_DIR = Path(__file__).parent.parent / "directives"


def load_webhooks() -> dict:
    with open(WEBHOOKS_FILE) as f:
        return json.load(f).get("webhooks", {})


@app.function(image=image, secrets=[modal.Secret.from_dotenv()])
@modal.web_endpoint(method="GET")
def list_webhooks():
    """List all registered webhooks."""
    webhooks = load_webhooks()
    return {"webhooks": list(webhooks.keys())}


@app.function(image=image, secrets=[modal.Secret.from_dotenv()])
@modal.web_endpoint(method="POST")
def execute(payload: dict):
    """Execute a directive by slug. Payload: {"slug": "...", "inputs": {...}}"""
    slug = payload.get("slug")
    if not slug:
        return {"error": "Missing 'slug' in payload"}, 400

    webhooks = load_webhooks()
    if slug not in webhooks:
        return {"error": f"Unknown webhook slug: {slug}"}, 404

    directive_file = webhooks[slug].get("directive")
    directive_path = DIRECTIVES_DIR / directive_file
    if not directive_path.exists():
        return {"error": f"Directive file not found: {directive_file}"}, 500

    directive_text = directive_path.read_text()
    inputs = payload.get("inputs", {})

    # Orchestrate via Claude
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    messages = [
        {
            "role": "user",
            "content": f"Execute the following directive with these inputs:\n\nInputs: {json.dumps(inputs)}\n\nDirective:\n{directive_text}",
        }
    ]

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=messages,
    )

    result = response.content[0].text

    # Stream to Slack if configured
    slack_url = os.environ.get("SLACK_WEBHOOK_URL")
    if slack_url:
        import urllib.request
        body = json.dumps({"text": f"*Webhook `{slug}` completed*\n```{result[:2000]}```"}).encode()
        urllib.request.urlopen(urllib.request.Request(slack_url, data=body, headers={"Content-Type": "application/json"}))

    return {"slug": slug, "result": result}


@app.function(image=image, secrets=[modal.Secret.from_dotenv()])
@modal.web_endpoint(method="POST")
def test_email(payload: dict):
    """Send a test email. Payload: {"to": "...", "subject": "...", "body": "..."}"""
    import smtplib
    from email.message import EmailMessage

    msg = EmailMessage()
    msg["From"] = os.environ.get("EMAIL_FROM", os.environ.get("SMTP_USER", ""))
    msg["To"] = payload.get("to", "")
    msg["Subject"] = payload.get("subject", "Test email")
    msg.set_content(payload.get("body", "Test"))

    with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.environ.get("SMTP_PORT", 587))) as smtp:
        smtp.starttls()
        smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(msg)

    return {"status": "sent", "to": payload.get("to")}
