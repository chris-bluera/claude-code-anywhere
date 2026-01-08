---
description: Diagnose Claude Code Anywhere installation and configuration
allowed-tools:
  - Bash(which -a claude)
  - Bash(curl -s --max-time * http://localhost:3847/api/status *)
  - Bash(launchctl list * com.claude.notify *)
  - Bash(systemctl --user is-active claude-notify.service *)
  - Bash(test -f ~/.claude-notify/*)
  - Read(~/.claude-notify/manifest.json)
  - Read(~/.claude-notify/plugins/claude-code-anywhere/.env)
  - Read(~/.claude-notify/plugins/claude-code-anywhere/plugin.json)
---

# /notify-doctor

Diagnose installation status and configuration of Claude Code Anywhere.

## Diagnostic Checks

Run these diagnostics and report results:

### 1. PATH Shim Check

```bash
which -a claude 2>/dev/null | head -5
```

**Expected:** First result should be `~/.claude-notify/bin/claude`

- ✅ if shim is first in PATH
- ⚠️ if shim exists but not first (real claude will bypass notifications)
- ❌ if shim not found (notifications won't work for new sessions)

### 2. Service Status

**macOS:**
```bash
launchctl list | grep com.claude.notify 2>/dev/null || echo "not found"
```

**Linux:**
```bash
systemctl --user is-active claude-notify.service 2>/dev/null || echo "not found"
```

**Or via API:**
```bash
curl -s --max-time 2 http://localhost:3847/api/status 2>/dev/null || echo '{"running": false}'
```

- ✅ if service running
- ❌ if service not running or not found

### 3. Plugin Installation

```bash
test -f ~/.claude-notify/plugins/claude-code-anywhere/plugin.json && echo "installed" || echo "not found"
```

- ✅ if plugin files exist
- ❌ if plugin not found

### 4. Channel Configuration

Read `~/.claude-notify/plugins/claude-code-anywhere/.env` and check:

- **Email:** Look for `SMTP_HOST`, `SMTP_USER`, `EMAIL_TO`
- **Telegram:** Look for `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

For each configured channel:
- ✅ "Email: configured (to: user@example.com)"
- ✅ "Telegram: configured (chat: 123456)"
- ⚠️ "Email: partially configured (missing EMAIL_TO)"
- ❌ "No channels configured"

### 5. Installation Manifest

Read `~/.claude-notify/manifest.json` if it exists:
- Show version installed
- Show installation date
- Show service type

## Output Format

```
╭─────────────────────────────────────────╮
│  Claude Code Anywhere - Diagnostics    │
╰─────────────────────────────────────────╯

## PATH Check
✅ Shim is first in PATH: ~/.claude-notify/bin/claude
   Real claude: /opt/homebrew/bin/claude

## Service Status
✅ Daemon running (launchd: com.claude.notify)
   API: http://localhost:3847

## Plugin Installation
✅ Plugin installed: v0.3.4
   Path: ~/.claude-notify/plugins/claude-code-anywhere

## Channels
✅ Email: you@example.com
✅ Telegram: Chat ID 123456789

## Installation Info
   Installed: 2026-01-08
   Service: launchd

---

## IDE Notes (if shim not first)

If PATH issues detected:

**VS Code / Cursor:**
Add to settings.json:
```json
"terminal.integrated.env.osx": {
  "PATH": "${env:HOME}/.claude-notify/bin:${env:PATH}"
}
```

**iTerm2:**
Should work automatically if shell rc files are configured.

**tmux:**
May need: `set-option -g default-command "exec $SHELL -l"`
```

## Troubleshooting Suggestions

Based on diagnostics, suggest fixes:

| Issue | Fix |
|-------|-----|
| Shim not in PATH | `source ~/.zshrc` or restart terminal |
| Service not running | `launchctl load ~/Library/LaunchAgents/com.claude.notify.plist` |
| Plugin not found | Re-run installer: `bash scripts/install.sh` |
| No channels | Edit `~/.claude-notify/plugins/claude-code-anywhere/.env` |
