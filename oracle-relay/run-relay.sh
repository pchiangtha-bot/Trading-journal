#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

if [ ! -f "$HOME/.vnc/passwd" ]; then
  echo "VNC password is missing. Run ./start-vnc.sh once interactively before installing the service."
  exit 1
fi

vncserver -localhost yes :1 -geometry 1280x800 -depth 24 >/tmp/fx-edge-vnc.log 2>&1 || true
sleep 4

export DISPLAY=:1
exec "$SCRIPT_DIR/start-mt5.sh"

