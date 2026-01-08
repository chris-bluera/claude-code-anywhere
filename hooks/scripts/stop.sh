#!/bin/bash
# Hook script for Stop events
# Notifies email bridge that session ended

curl -s -X POST http://localhost:3847/api/send \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\": \"${CLAUDE_SESSION_ID}\", \"event\": \"Stop\", \"message\": \"Session ended\"}"
