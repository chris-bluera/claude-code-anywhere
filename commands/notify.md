---
description: Toggle notifications on/off or check status
argument-hint: on | off | on all | off all | status | install | uninstall
allowed-tools:
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/cpr.sh *)
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/server-status.sh *)
  - Bash(curl * http://localhost:*/api/*)
  - Bash(test -x ~/.claude-code-anywhere/*)
  - Bash(cat */port)
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/install.sh)
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/uninstall.sh)
  - Bash(pkill -f "bun run server" *)
  - Bash(launchctl * ~/Library/LaunchAgents/com.claude.code-anywhere.plist)
  - Bash(systemctl --user * claude-code-anywhere*)
  - Bash(rm -f ~/.config/claude-code-anywhere/*)
---

# /notify

Toggle notifications on/off, check status, or manage global installation.

See @skills/notify-server/skill.md for implementation details.

**Action requested:** `$1`

## Plugin Root

!`${CLAUDE_PLUGIN_ROOT}/scripts/cpr.sh 2>/dev/null || echo "NOT_CONFIGURED"`

## Server Status

!`${CLAUDE_PLUGIN_ROOT}/scripts/server-status.sh 2>/dev/null || echo '{"running": false, "error": "server not started"}'`

## Installation Status

!`test -x ~/.claude-code-anywhere/bin/claude && echo "GLOBAL" || echo "SESSION_ONLY"`

## Usage

### Per-Session Commands
- `/notify on` - Enable notifications for **this session only**
- `/notify off` - Disable notifications for **this session only** (server keeps running)
- `/notify status` - Show current status

### Global Commands
- `/notify on all` - Enable notifications **globally** (all sessions)
- `/notify off all` - Disable notifications **globally** and stop server
- `/notify install` - Install global mode (all Claude Code sessions get notifications)
- `/notify uninstall` - Remove global installation

## Workflow

### `on` (current session only)
1. Check plugin root (see context above)
2. If "NOT_CONFIGURED": Run `@skills/bootstrap/skill.md` first, then retry
3. Check if server running (from Server Status context above)
4. If not running, start it: `cd "<plugin-root>" && nohup bun run server > /tmp/claude-code-anywhere-server.log 2>&1 &`
5. Wait for server to be ready (poll `/api/status` until it responds)
6. Enable this session only: `curl -X POST http://localhost:$PORT/api/session/$CLAUDE_SESSION_ID/enable`
7. Confirm with channel status (see `status` workflow below for format)

### `on all` (global)
1. Check plugin root (same as `on` steps 1-2)
2. Check if server running, start if needed (same as `on` steps 3-5)
3. Enable globally: `curl -X POST http://localhost:$PORT/api/enable`
4. Confirm with channel status

### `off` (current session only)
1. Disable this session only: `curl -X POST http://localhost:$PORT/api/session/$CLAUDE_SESSION_ID/disable`
2. **Do NOT stop the server** (other sessions may still be active)
3. Confirm with status showing session disabled

### `off all` (global)
1. Disable globally: `curl -X POST http://localhost:$PORT/api/disable`
2. Stop server: `pkill -f "bun run server"`
3. Confirm server stopped

### `status`
Report from context above:
- **Installation mode**: Global or Session-only
- Server running/stopped
- Notifications enabled/disabled
- Active sessions count
- For each channel in `channels` array:
  - Name (Email/Telegram)
  - Config details from `config` object:
    - Email: `from` and `to` addresses
    - Telegram: `chatId`
  - Enabled status
  - Connected status
  - Last activity (formatted as relative time if available)
  - Any error message

If Installation Status is "SESSION_ONLY", include:
> "ℹ️ Running in session-only mode. Run `/notify install` for global notifications."

### `install`
1. Explain what will be installed (see @commands/notify-install.md)
2. Run `${CLAUDE_PLUGIN_ROOT}/scripts/install.sh`
3. Clear the "shown" marker: `rm -f ~/.config/claude-code-anywhere/shown-install-message`
4. Report success, remind to restart shell

### `uninstall`
1. Confirm user wants to uninstall
2. Run `${CLAUDE_PLUGIN_ROOT}/scripts/uninstall.sh`
3. Report success
