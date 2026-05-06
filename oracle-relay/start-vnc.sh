#!/usr/bin/env sh
set -eu

mkdir -p "$HOME/.vnc"

if [ ! -f "$HOME/.vnc/passwd" ]; then
  echo "Create a VNC password. This protects the local VNC session."
  vncpasswd
fi

vncserver -kill :1 >/dev/null 2>&1 || true
vncserver -localhost yes :1 -geometry 1280x800 -depth 24

echo
echo "VNC is running on display :1."
echo "From your PC, open an SSH tunnel:"
echo "  ssh -L 5901:localhost:5901 ubuntu@YOUR_VM_IP"
echo "Then connect VNC Viewer to localhost:5901."

