#!/bin/bash
# Server status checker for claude-code-anywhere

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Get plugin root using cpr.sh
PLUGIN_ROOT=$("${SCRIPT_DIR}/cpr.sh" 2>/dev/null)
if [ -z "$PLUGIN_ROOT" ]; then
    echo '{"running": false, "error": "plugin not found"}'
    exit 0
fi

# Read port from plugin's port file
PORT_FILE="${PLUGIN_ROOT}/port"
if [ ! -f "$PORT_FILE" ]; then
    echo '{"running": false, "error": "no port file - server not started"}'
    exit 0
fi

PORT=$(cat "$PORT_FILE" 2>/dev/null)
if [ -z "$PORT" ]; then
    echo '{"running": false, "error": "empty port file"}'
    exit 0
fi

# Query server status
curl -s --max-time 2 "http://localhost:${PORT}/api/status" 2>/dev/null || echo '{"running": false, "error": "server not responding"}'
