#!/bin/bash
# Hook script for Notification events
# Sends notification via bridge server
#
# Safe for dogfooding: exits silently if server isn't running

# Read JSON input from stdin
INPUT=$(cat)

# Fast check: is server running? (1 second timeout)
if ! curl -s --connect-timeout 1 http://localhost:3847/api/status > /dev/null 2>&1; then
  exit 0
fi

# Extract session_id from JSON input
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
if [ -z "$SESSION_ID" ]; then
  exit 0
fi

# Extract notification message (for Notification events, check .message or .notification)
MESSAGE=$(echo "$INPUT" | jq -r '.message // .notification // "Notification from Claude Code"')

# Register session and send notification
curl -s -X POST http://localhost:3847/api/session \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\": \"$SESSION_ID\", \"event\": \"Notification\", \"prompt\": $(echo "$MESSAGE" | jq -Rs .)}"
