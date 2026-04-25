#!/usr/bin/env bash
# start_demo.sh — Start the VitaQuest backend for local demo.
# Both phones must be on the same network as this laptop (e.g. laptop hotspot).
#
# Usage: bash start_demo.sh

set -euo pipefail

# ── Detect local IP ──────────────────────────────────────────────────────────
# Works on macOS (en0/en1) and Linux.
if command -v ipconfig &>/dev/null; then
  # macOS
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' \
    || echo "127.0.0.1")
else
  # Linux fallback
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          VitaQuest Demo Server               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Local IP  : ${LOCAL_IP}"
echo "║  Endpoint  : http://${LOCAL_IP}:8000"
echo "╠══════════════════════════════════════════════╣"
echo "║  Update react expo/src/constants/            ║"
echo "║  verifyConfig.ts with the IP above if        ║"
echo "║  it differs from the hardcoded value.        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Server ready at http://${LOCAL_IP}:8000"
echo ""

# ── Start server ─────────────────────────────────────────────────────────────
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
