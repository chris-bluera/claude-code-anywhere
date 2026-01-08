#!/bin/bash
# Hook script for Notification events
# Sends notification to email bridge server

curl -s -X POST http://localhost:3847/api/send \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\": \"${CLAUDE_SESSION_ID}\", \"event\": \"Notification\", \"message\": \"$(echo "$CLAUDE_NOTIFICATION" | sed 's/"/\\"/g')\"}"
