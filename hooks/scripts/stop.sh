#!/bin/bash
# Hook script for Stop events
# Notifies email bridge that session ended
#
# Safe for dogfooding: exits silently if server isn't running

# Fast check: is server running? (1 second timeout)
if ! curl -s --connect-timeout 1 http://localhost:3847/api/status > /dev/null 2>&1; then
  exit 0
fi

curl -s -X POST http://localhost:3847/api/send \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\": \"${CLAUDE_SESSION_ID}\", \"event\": \"Stop\", \"message\": \"Session ended\"}"
