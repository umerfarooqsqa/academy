#!/usr/bin/env bash
# localtunnel's free relay drops connections periodically — this wrapper keeps
# restarting it with a fixed subdomain so the public URL stays constant even
# across drops (no need to re-register the webhook URL in Meta's console
# every time it reconnects).
SUBDOMAIN="${1:-academyadmin923199}"
PORT="${2:-3100}"
while true; do
  echo "[stable-tunnel] starting localtunnel (subdomain=$SUBDOMAIN)..."
  npx localtunnel --port "$PORT" --subdomain "$SUBDOMAIN"
  echo "[stable-tunnel] localtunnel exited — reconnecting in 2s..."
  sleep 2
done
