#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SERVICE_DIR/fx-edge-mt5-relay.service"

if [ ! -f "$HOME/.vnc/passwd" ]; then
  echo "Run ./start-vnc.sh once first so the VNC password exists."
  exit 1
fi

mkdir -p "$SERVICE_DIR"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=FX Edge MT5 closed-position relay
After=default.target

[Service]
Type=simple
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/run-relay.sh
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF

chmod +x "$SCRIPT_DIR"/*.sh
systemctl --user daemon-reload
systemctl --user enable --now fx-edge-mt5-relay.service

if command -v loginctl >/dev/null 2>&1; then
  sudo loginctl enable-linger "$USER" || true
fi

echo "Service installed."
echo "Check it with:"
echo "  systemctl --user status fx-edge-mt5-relay.service"

