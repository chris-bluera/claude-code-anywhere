#!/bin/bash
# Hook script for PreToolUse events
# Requests user approval via email for Bash/Write/Edit tools
#
# Safe for dogfooding: exits 0 (allow) if server isn't running

# Fast check: is server running? (1 second timeout)
if ! curl -s --connect-timeout 1 http://localhost:3847/api/status > /dev/null 2>&1; then
  exit 0
fi

# Check if session is enabled
ENABLED=$(curl -s -X GET "http://localhost:3847/api/session/${CLAUDE_SESSION_ID}/enabled" 2>/dev/null)
if ! echo "$ENABLED" | grep -q '"enabled":true'; then
  # Session not enabled, allow the tool
  exit 0
fi

# Register session and send approval request
curl -s -X POST http://localhost:3847/api/session \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\": \"${CLAUDE_SESSION_ID}\", \"event\": \"PreToolUse\", \"prompt\": \"Tool: ${CLAUDE_TOOL_NAME} - Approve? (Y/N)\"}" > /dev/null

# Poll for response (60 attempts, 5 seconds each = 5 minutes timeout)
for i in $(seq 1 60); do
  RESP=$(curl -s "http://localhost:3847/api/response/${CLAUDE_SESSION_ID}" 2>/dev/null)

  if echo "$RESP" | grep -q '"response"'; then
    ANSWER=$(echo "$RESP" | grep -o '"response":"[^"]*"' | cut -d'"' -f4)

    if echo "$ANSWER" | grep -qi '^y'; then
      # Approved
      exit 0
    else
      # Denied
      echo '{"decision": "block", "reason": "User denied via email"}'
      exit 0
    fi
  fi

  sleep 5
done

# Timeout
echo '{"decision": "block", "reason": "Email approval timeout"}'
