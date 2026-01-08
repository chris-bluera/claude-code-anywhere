#!/bin/bash
# Hook script for Notification events
# Sends notification via bridge server
#
# Safe for dogfooding: exits silently if server isn't running

# Fast check: is server running? (1 second timeout)
if ! curl -s --connect-timeout 1 http://localhost:3847/api/status > /dev/null 2>&1; then
  exit 0
fi

# Register session and send notification
curl -s -X POST http://localhost:3847/api/session \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\": \"${CLAUDE_SESSION_ID}\", \"event\": \"Notification\", \"prompt\": \"$(echo "$CLAUDE_NOTIFICATION" | sed 's/"/\\"/g')\"}"
