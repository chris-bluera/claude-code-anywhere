---
description: Remove global notification installation
allowed-tools:
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/uninstall.sh)
  - Bash(launchctl * ~/Library/LaunchAgents/com.claude.code-anywhere.plist)
  - Bash(systemctl --user * claude-code-anywhere*)
  - Bash(rm -f ~/.config/claude-code-anywhere/*)
---

# /cca-uninstall

Remove global notification installation and revert to session-only mode.

## What This Removes

1. **PATH shim** at `~/.claude-code-anywhere/bin/claude`
2. **Background daemon** (launchd/systemd service)
3. **PATH entry** from `.zshrc`/`.bashrc`
4. **Plugin copy** at `~/.claude-code-anywhere/plugins/`

Your `.env` configuration is preserved as a backup.

## After Uninstall

| Aspect | Before (Global) | After (Session-Only) |
|--------|-----------------|---------------------|
| New terminal | Just works | Need `/cca on` |
| Multiple sessions | All connected | Each needs setup |
| Daemon | Always running | Stops with session |
| Reboots | Auto-starts | Need restart |

## Workflow

1. Confirm user wants to uninstall
2. Run the uninstaller: `${CLAUDE_PLUGIN_ROOT}/scripts/uninstall.sh`
3. Report success

## Post-Uninstall Steps

After running this command, tell the user:

1. **Restart your shell**: `exec $SHELL` or open a new terminal
2. **Verify**: `which claude` should show the original claude location
3. **Re-enable per-session**: Run `/cca on` in each session as needed

## To Reinstall Later

```
/cca-install
```
