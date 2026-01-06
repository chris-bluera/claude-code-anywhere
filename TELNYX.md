# Telnyx Setup Guide

Complete guide to setting up Telnyx for Claude SMS.

## Table of Contents

- [1. Create Account](#1-create-account)
- [2. Purchase Phone Number](#2-purchase-phone-number)
- [3. Create Messaging Profile](#3-create-messaging-profile)
- [4. Generate API Key](#4-generate-api-key)
- [5. 10DLC Registration (US Only)](#5-10dlc-registration-us-only)
- [6. Webhook Configuration](#6-webhook-configuration)
- [7. Environment Variables](#7-environment-variables)
- [8. Cost Breakdown](#8-cost-breakdown)
- [9. Troubleshooting](#9-troubleshooting)

---

## 1. Create Account

1. Go to [telnyx.com](https://telnyx.com) and click **Sign Up**
2. Complete registration and verify email
3. Complete **KYC verification** (government-issued ID required)
4. Add payment method (pay-as-you-go, no minimums)

---

## 2. Purchase Phone Number

1. In [Mission Control Portal](https://portal.telnyx.com), go to **Numbers** → **Search & Buy**
2. Search for numbers (filter by SMS capability)
3. Purchase a number (~$1/month for US local)

---

## 3. Create Messaging Profile

1. Go to **Messaging** → **Programmable Messaging**
2. Click **Add New Profile**
3. Name it (e.g., "claude-sms")
4. Under **Inbound Settings**, you'll add the webhook URL later
5. Leave all optional settings at defaults
6. Click **Save**

### Assign Number to Profile

1. Go to **Numbers** → **My Numbers**
2. Find your number, click the **Messaging Profile** dropdown
3. Select the profile you created
4. Accept the monthly charge prompt

---

## 4. Generate API Key

1. Go to **API Keys** (left sidebar under "Auth")
2. Ensure you're in **Auth V2**
3. Click **Create API Key**
4. **Save this key immediately** — you won't see it again!

The key starts with `KEY...`

---

## 5. 10DLC Registration (US Only)

> **Required for US SMS.** Without 10DLC registration, messages will be blocked by carriers with error: `"Not 10DLC registered" (code 40010)`

### Step A: Register Your Brand ($4.50 one-time)

1. Go to **Messaging** → **10DLC** → **Brands** → **Create Brand**
2. Provide business information:
   - **With EIN**: Legal company name, EIN, address (must match IRS Form CP-575)
   - **Sole Proprietor**: Name, address, government-issued ID, SSN
3. Submit and wait for verification (usually instant, sometimes 24-48 hours)
4. Status should show **Verified** (green dot)

### Step B: Create a Campaign ($15 one-time + $1.50/month)

Once your brand is verified, create a campaign:

1. Click on your brand → **Create Campaign**

#### Use Case Selection

| Field | Value |
|-------|-------|
| **Use case** (first dropdown) | `Low Volume Mixed` |
| **Use case type** (second dropdown) | `Account Notification` |
| **Vertical** | `Information Technology Services` |

#### Campaign Description

```
Developer tool notifications. Software sends automated alerts to the
developer's own mobile phone for task status updates, completion notices,
and approval requests. Single recipient (developer only).
```

#### Opt In Workflow Description

```
Digital: Developer configures their own phone number in software settings
and explicitly enables SMS notifications. Only the account owner receives
messages. No third-party recipients.
```

#### Keywords (use defaults)

| Field | Value |
|-------|-------|
| Opt in keywords | `START,YES,Y` |
| Opt out keywords | `STOP,UNSUBSCRIBE` |
| Help keywords | `HELP` |

#### Auto-responses

**Opt in message:**
```
Claude SMS: You've enabled notifications. Reply HELP for help or STOP to unsubscribe. Msg&data rates may apply.
```

**Opt out message:**
```
Claude SMS: You are unsubscribed and will receive no further messages.
```

**Help message:**
```
Claude SMS: For help, visit github.com/chris-bluera/claude-sms
```

#### Sample Messages

**Message 1:**
```
[CC-abc123] ✅ Session ended: Task completed successfully. Reply with your response. Reply STOP to opt out.
```

#### Additional Fields

| Field | Value |
|-------|-------|
| **Embedded link** (text field) | Leave blank |
| **Embedded Link** | No |
| **Embedded Phone Number** | No |
| **Number Pooling** | No |
| **Age-Gated Content** | No |
| **Direct Lending or Loan Arrangement** | No |
| **Webhook URL** | Leave blank |
| **Webhook Failover URL** | Leave blank |

Submit the campaign for review (1-2 business days).

### Step C: Assign Number to Campaign

Once campaign is approved:

1. Go to campaign settings
2. Add your phone number to the campaign

---

## 6. Webhook Configuration

### Get Public Key (for signature verification)

1. Go to Telnyx Portal → **API Keys** (left sidebar)
2. Look for **Public Key** section
3. Copy the base64 key (looks like: `zQuwEq2A2KxzDWGqPPJ7gJhuQ6gFp51w9WxqDhPNVDM=`)
4. Set as `TELNYX_WEBHOOK_PUBLIC_KEY` environment variable

### Configure Webhook URL

1. Go to **Messaging** → **Messaging Profiles**
2. Select your profile
3. Under **Inbound Settings**, set webhook URL:
   ```
   https://your-tunnel-url/webhook/telnyx
   ```
4. The URL is shown when you run `npx claude-sms server`

For persistent URLs, see the [Persistent Tunnel URL](./README.md#persistent-tunnel-url) section in README.

---

## 7. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELNYX_API_KEY` | Yes | API Key from Auth V2 (starts with `KEY...`) |
| `TELNYX_FROM_NUMBER` | Yes | Your Telnyx number in E.164 format (e.g., `+15551234567`) |
| `SMS_USER_PHONE` | Yes | Your mobile in E.164 format (e.g., `+15559876543`) |
| `TELNYX_WEBHOOK_PUBLIC_KEY` | Yes | Public key for webhook signature verification |

Example `.env`:

```bash
TELNYX_API_KEY=KEY019B9369154442FBFBA7CDBDF803514C_xxxxxxxxxx
TELNYX_FROM_NUMBER=+15551234567
SMS_USER_PHONE=+15559876543
TELNYX_WEBHOOK_PUBLIC_KEY=zQuwEq2A2KxzDWGqPPJ7gJhuQ6gFp51w9WxqDhPNVDM=
```

---

## 8. Cost Breakdown

| Item | Cost |
|------|------|
| Telnyx phone number | ~$1/month |
| Telnyx SMS (US) | ~$0.003-0.005/message |
| 10DLC brand registration | $4.50 one-time |
| 10DLC campaign review | $15 one-time |
| 10DLC campaign (Low Volume) | $1.50/month |
| Cloudflared tunnel | Free |
| **First month (setup + use)** | **~$25** |
| **Ongoing monthly** | **~$3-5** |

---

## 9. Troubleshooting

### "Not 10DLC registered" error (code 40010)

Your message was rejected because the number isn't registered for A2P messaging.

**Checklist:**
- [ ] Brand status is "Verified"
- [ ] Campaign status is "Approved"
- [ ] Phone number is assigned to the campaign

### "delivery_failed" status

Check the message status via API:

```bash
curl -H "Authorization: Bearer $TELNYX_API_KEY" \
  https://api.telnyx.com/v2/messages/{message_id}
```

Look at the `errors` array for the specific reason.

### Authentication failed

- API key must start with `KEY...`
- Use Bearer token format: `Authorization: Bearer KEY...`
- Ensure no extra whitespace in the key

### Webhook not receiving replies

- Check tunnel is running (`npx claude-sms server`)
- Verify webhook URL in messaging profile matches your tunnel URL
- Check `TELNYX_WEBHOOK_PUBLIC_KEY` is set correctly
- Look at server logs for signature verification errors

### SMS sent but not delivered

Common causes:
- Carrier filtering (10DLC not complete)
- Invalid recipient number
- Insufficient account balance

Check message status via API to see delivery details.
