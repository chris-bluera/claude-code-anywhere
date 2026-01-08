---
description: Toggle notifications on/off or check status
argument-hint: on | off | status
allowed-tools:
  - Bash(.claude/cpr.sh *)
  - Bash(curl *)
---

# /notify

Toggle notifications on/off or check status. See @skills/notify-server/skill.md for implementation details.

**Action requested:** `$1`

## Plugin Root

!`.claude/cpr.sh 2>/dev/null || echo "NOT_CONFIGURED"`

## Server Status

!`curl -s http://localhost:3847/api/status 2>/dev/null || echo '{"running": false}'`

## Usage

- `/notify on` - Start server and enable notifications
- `/notify off` - Stop server and disable notifications
- `/notify status` - Show current status

## Workflow

### `on`
1. Check plugin root (see context above)
2. If "NOT_CONFIGURED": Run `@skills/bootstrap/skill.md` first, then retry
3. Check if server running
4. If not running, start it: `cd "<plugin-root>" && nohup bun run server > /tmp/claude-code-anywhere-server.log 2>&1 &`
5. Wait for ready, then enable session
6. Confirm: "Notifications enabled. Server running."

### `off`
1. Disable session
2. Stop server
3. Confirm: "Notifications disabled. Server stopped."

### `status`
Report from context above:
- Server running/stopped
- Notifications enabled/disabled
- Active sessions count
