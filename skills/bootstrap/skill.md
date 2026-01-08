---
name: bootstrap
description: Initialize plugin environment by creating the plugin root resolver script
version: 1.0.0
---

# Bootstrap Plugin Environment

Creates `.claude/cpr.sh` (Claude Plugin Root resolver) in the current project directory.

**Run this once per project** before using `/notify` commands.

## Setup Command

```bash
mkdir -p .claude && cat > .claude/cpr.sh << 'SCRIPT'
#!/bin/bash
# Claude Plugin Root resolver for claude-code-anywhere
# Created by bootstrap skill

PLUGIN_NAME="claude-code-anywhere"

# 1. Try CLAUDE_PLUGIN_ROOT (available in hooks)
if [ -n "${CLAUDE_PLUGIN_ROOT}" ] && [ -d "${CLAUDE_PLUGIN_ROOT}" ]; then
    echo "${CLAUDE_PLUGIN_ROOT%/}"
    exit 0
fi

# 2. Try installed_plugins.json
if [ -f "${HOME}/.claude/plugins/installed_plugins.json" ] && command -v jq &>/dev/null; then
    PLUGIN_ROOT=$(jq -r '.plugins | to_entries[] | select(.key | contains("'$PLUGIN_NAME'")) | .value.installPath' "${HOME}/.claude/plugins/installed_plugins.json" 2>/dev/null)
    if [ -n "$PLUGIN_ROOT" ] && [ -d "$PLUGIN_ROOT" ]; then
        echo "${PLUGIN_ROOT%/}"
        exit 0
    fi
fi

# 3. Try Python fallback
if command -v python3 &>/dev/null && [ -f "${HOME}/.claude/plugins/installed_plugins.json" ]; then
    PLUGIN_ROOT=$(python3 -c "
import json
try:
    with open('${HOME}/.claude/plugins/installed_plugins.json') as f:
        plugins = json.load(f)['plugins']
    for key, value in plugins.items():
        if '$PLUGIN_NAME' in key:
            print(value['installPath'].rstrip('/'))
            break
except: pass
" 2>/dev/null)
    if [ -n "$PLUGIN_ROOT" ] && [ -d "$PLUGIN_ROOT" ]; then
        echo "$PLUGIN_ROOT"
        exit 0
    fi
fi

echo "Error: Could not locate $PLUGIN_NAME plugin" >&2
exit 1
SCRIPT
chmod +x .claude/cpr.sh
```

After running, verify with:
```bash
.claude/cpr.sh
```

This should output the plugin installation path.
