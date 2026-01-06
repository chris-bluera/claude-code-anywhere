# Claude SMS

[![CI](https://github.com/chris-bluera/claude-sms/actions/workflows/ci.yml/badge.svg)](https://github.com/chris-bluera/claude-sms/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

> **Stay connected to your Claude Code sessions from anywhere.** Get SMS notifications when tasks complete, approve operations remotely, and respond to prompts—all from your phone.

## Table of Contents

<details>
<summary>Click to expand</summary>

- [Why Claude SMS?](#-why-claude-sms)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Quick Reference](#-quick-reference)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [SMS Format](#-sms-format)
- [Hook Events](#-hook-events)
- [Configuration](#-configuration)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)
- [Technologies](#-technologies)
- [Cost Estimate](#-cost-estimate)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

</details>

---

## ✨ Why Claude SMS?

When Claude Code needs your input—a question, approval, or notification—you shouldn't have to be tethered to your terminal.

| Scenario | Without Claude SMS | With Claude SMS |
|----------|-------------------|-----------------|
| Task completes | Sit and wait, or miss it | Get SMS: "Task completed!" |
| Claude asks a question | Session blocks until you notice | Get SMS, reply from anywhere |
| Destructive operation | Must be at terminal to approve | Approve via text: "Y" |
| Long-running task | Keep checking back | Do other things, get notified |

**The result:** Run background tasks with confidence. Walk away. Your phone keeps you connected.

---

## 🚀 Features

- **📱 Notifications** — Get SMS alerts when tasks complete or errors occur
- **💬 Interactive Prompts** — Respond to Claude's questions via text
- **✅ Approval Requests** — Approve or deny destructive operations remotely
- **🔀 Multi-Session** — Track multiple Claude Code sessions independently
- **⚡ Easy Toggle** — Enable/disable SMS with `/sms on` or `/sms off`
- **🌐 Built-in Tunnel** — Automatic webhook exposure via cloudflared
- **🔒 Persistent URLs** — Optional stable tunnel URLs (no Twilio reconfiguration)

---

## 🏁 Quick Start

### Prerequisites

- Node.js 18+ (via nvm recommended for WSL)
- Twilio account with SMS-capable phone number

### 1. Install the Plugin

```bash
claude /plugin add github.com/chris-bluera/claude-sms
```

### 2. Set Environment Variables

```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
export TWILIO_AUTH_TOKEN=your-auth-token
export TWILIO_FROM_NUMBER=+1234567890
export SMS_USER_PHONE=+1987654321
```

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) for persistence.

### 3. Start the Bridge Server

```bash
npx claude-sms server
```

This starts the SMS bridge server and automatically creates a public webhook URL via cloudflared.

### 4. Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Your Number**
3. Under "Messaging", set webhook URL to:
   ```
   https://your-tunnel-url.trycloudflare.com/webhook/twilio
   ```
   (The URL is displayed when you start the server)

### 5. Test the Setup

```bash
npx claude-sms test
```

Or in Claude Code:
```
/sms-test
```

---

## 📋 Quick Reference

### Plugin Commands

| Command | Description |
|---------|-------------|
| `/sms on` | Enable SMS for current session |
| `/sms off` | Disable SMS for current session |
| `/sms off --all` | Disable SMS globally |
| `/sms status` | Show current status |
| `/sms-test` | Send a test SMS |

### CLI Commands

| Command | Description |
|---------|-------------|
| `npx claude-sms server` | Start bridge server with cloudflared tunnel |
| `npx claude-sms status` | Check server status |
| `npx claude-sms enable` | Enable SMS globally |
| `npx claude-sms disable` | Disable SMS globally |
| `npx claude-sms test` | Send test SMS |
| `npx claude-sms config` | Show configuration |

---

## 📖 Usage

### Enabling/Disabling SMS

```bash
# In Claude Code
/sms on          # Enable for this session
/sms off         # Disable for this session
/sms off --all   # Disable globally
/sms status      # Check current state
```

### From Command Line

```bash
npx claude-sms enable   # Enable globally
npx claude-sms disable  # Disable globally
npx claude-sms status   # Check server and settings
```

---

## 🔄 How It Works

```
┌─────────────────┐    Hook     ┌─────────────────┐    SMS     ┌──────────┐
│  Claude Code    │───triggered─▶│  Bridge Server  │───────────▶│  Phone   │
│                 │             │                 │            │          │
│                 │◀──response──│                 │◀───reply───│          │
└─────────────────┘             └─────────────────┘            └──────────┘
```

1. Claude Code triggers a hook (notification, tool use, etc.)
2. Hook sends message to bridge server
3. Bridge server sends SMS via Twilio
4. User replies via SMS
5. Twilio webhook delivers reply to bridge server
6. Hook retrieves response and returns it to Claude Code

---

## 📨 SMS Format

### Outbound

```
[CC-abc123] ⚠️ Approve tool use?

Tool: Bash - Approve? (Y/N)

Reply with your response
```

### Inbound

Simple reply (single active session):
```
Yes
```

With session ID (multiple sessions):
```
[CC-abc123] Yes
```

---

## 🎣 Hook Events

| Event | Trigger | SMS Sent |
|-------|---------|----------|
| `Notification` | Status updates, completions | Yes (by default) |
| `Stop` | Session ends | Yes (by default) |
| `PreToolUse` | Before Bash/Write/Edit | Yes (awaits approval) |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Yes | Your Twilio phone number |
| `SMS_USER_PHONE` | Yes | Your mobile number |
| `SMS_BRIDGE_URL` | No | Bridge server URL (default: localhost:3847) |
| `SMS_BRIDGE_PORT` | No | Server port (default: 3847) |
| `CLOUDFLARE_TUNNEL_ID` | No | Tunnel ID for persistent URL (see below) |
| `CLOUDFLARE_TUNNEL_URL` | No | Your persistent tunnel URL |

### Persistent Tunnel URL

By default, the server creates a random tunnel URL each time it starts (e.g., `https://random-words.trycloudflare.com`). This requires updating your Twilio webhook URL after each restart.

For a persistent URL that never changes:

1. **Create a Cloudflare tunnel** (one-time):
   ```bash
   # Install cloudflared if not already installed
   # Then authenticate and create tunnel
   cloudflared tunnel login
   cloudflared tunnel create claude-sms
   ```

2. **Configure DNS** in Cloudflare dashboard:
   - Add a CNAME record pointing to your tunnel

3. **Set environment variables**:
   ```bash
   export CLOUDFLARE_TUNNEL_ID=claude-sms
   export CLOUDFLARE_TUNNEL_URL=https://claude-sms.yourdomain.com
   ```

Now the webhook URL stays the same across restarts.

### State File

Settings are stored in `~/.claude/claude-sms/state.json`:

```json
{
  "enabled": true,
  "hooks": {
    "Notification": true,
    "Stop": true,
    "PreToolUse": true,
    "UserPromptSubmit": false
  }
}
```

---

## 🔒 Security

- **Phone Verification** — Only responds to registered phone number
- **Session IDs** — Prevent cross-session interference
- **Timeout** — Sessions expire after 30 minutes of inactivity
- **No Secrets** — Never sends credentials/secrets via SMS

---

## 🔧 Troubleshooting

<details>
<summary><b>❌ SMS Not Sending</b></summary>

1. Check environment variables: `npx claude-sms config`
2. Verify Twilio credentials in [Twilio Console](https://console.twilio.com)
3. Ensure phone number is SMS-capable
4. Check server logs for errors
</details>

<details>
<summary><b>📭 Response Not Received</b></summary>

1. Verify tunnel is running: look for URL in server output
2. Check Twilio webhook configuration matches tunnel URL
3. Ensure session ID matches in reply (`[CC-xxx]` prefix)
</details>

<details>
<summary><b>🚫 Server Not Starting</b></summary>

1. Check if port 3847 is in use: `lsof -i :3847`
2. Verify all required env vars are set
3. Try a different port: `npx claude-sms server -p 3848`
</details>

<details>
<summary><b>🔗 Tunnel Issues</b></summary>

1. Ensure cloudflared is installed: `which cloudflared`
2. Check cloudflared logs in server output
3. For persistent tunnels, verify `CLOUDFLARE_TUNNEL_ID` matches your tunnel name
4. Check DNS configuration in Cloudflare dashboard
</details>

---

## 🛠️ Development

### Setup

```bash
git clone https://github.com/chris-bluera/claude-sms.git
cd claude-sms
bun install
bun run build
```

### Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Compile TypeScript to dist/ |
| `bun run test` | Run tests in watch mode |
| `bun run test:run` | Run tests once |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run precommit` | Full validation (lint, typecheck, tests, build) |
| `bun run version:patch` | Bump patch version + changelog |
| `bun run version:minor` | Bump minor version + changelog |
| `bun run version:major` | Bump major version + changelog |

### Claude Code Settings

For the best development experience, copy the example settings:

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
```

This provides:
- Auto-validation after code edits
- Pre-approved common commands
- Desktop notifications

### Releasing

1. Make changes and commit
2. Bump version: `bun run version:patch`
3. Commit: `git commit -am "chore: bump version to X.Y.Z"`
4. Push: `git push`
5. **GitHub Actions automatically creates the release**

---

## 🔬 Technologies

- **[Commander.js](https://github.com/tj/commander.js)** — CLI framework
- **[Twilio SDK](https://github.com/twilio/twilio-node)** — SMS sending/receiving
- **[cloudflared](https://github.com/cloudflare/cloudflared)** — Secure tunnel for webhooks
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe development
- **[Vitest](https://vitest.dev/)** — Testing framework

---

## 💰 Cost Estimate

| Service | Cost |
|---------|------|
| Twilio SMS (US) | ~$0.0079/message |
| Cloudflared tunnel | Free |
| **Estimated monthly (moderate use)** | **$5-15** |

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests
4. Submit a pull request

---

## 📄 License

MIT — See [LICENSE](./LICENSE) for details.

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/chris-bluera/claude-sms/issues)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
