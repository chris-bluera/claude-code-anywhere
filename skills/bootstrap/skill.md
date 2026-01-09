---
name: bootstrap
description: (Deprecated) Plugin environment setup is now automatic
version: 2.0.0
---

# Bootstrap Plugin Environment

**This skill is no longer needed.**

The plugin now uses `${CLAUDE_PLUGIN_ROOT}` which is automatically available in Claude Code plugin contexts. All scripts are located in the plugin's `scripts/` directory and are accessed directly.

If you're seeing "NOT_CONFIGURED" errors, ensure the plugin is properly installed via:
- `/plugin add` for the marketplace version
- `--plugin-dir .` for development mode
