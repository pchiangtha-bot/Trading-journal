#!/usr/bin/env sh
set -eu

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this script as your normal VM user, not root."
  exit 1
fi

ARCH="$(uname -m)"
if [ "$ARCH" != "x86_64" ]; then
  echo "This package expects an x86_64/amd64 Oracle VM."
  echo "Detected: $ARCH"
  echo "Use Oracle Always Free VM.Standard.E2.1.Micro, not Arm/A1.Flex."
  exit 1
fi

echo "Installing desktop, VNC, and support tools..."
sudo apt update
sudo apt install -y \
  ca-certificates \
  curl \
  dbus-x11 \
  p7zip-full \
  tigervnc-common \
  tigervnc-standalone-server \
  unzip \
  wget \
  xdotool \
  xfce4 \
  xfce4-terminal \
  xterm

mkdir -p "$HOME/.vnc"
cat > "$HOME/.vnc/xstartup" <<'EOF'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
startxfce4 &
EOF
chmod +x "$HOME/.vnc/xstartup"

echo
echo "Base relay tools installed."
echo "Next:"
echo "  ./start-vnc.sh"
echo "Then connect through SSH tunnel and run ./install-mt5-official.sh inside the VNC desktop."

