# FX Edge Oracle Relay Package

This package keeps MT5 online in Oracle Cloud so closed positions can be detected even when your PC and phone are switched off.

The relay is:

- Free-path friendly: Oracle Cloud Always Free VM + Supabase free tier + MT5/Wine.
- Read-only friendly: use your Pepperstone MT5 investor password when possible.
- Mobile-aware: trades closed from iOS or Android are still visible to the cloud MT5 terminal because it is logged in to the same Pepperstone account.

## Use The Correct Oracle VM

Use an Always Free AMD instance, not Arm.

- Shape: `VM.Standard.E2.1.Micro`
- Image: Ubuntu 22.04 or 24.04
- Architecture: x86_64 / amd64
- Boot volume: default 50 GB is fine

Avoid `VM.Standard.A1.Flex` for this package. It is Arm-based; MT5 under Wine is built around Windows/x86 behavior and is not the simple path there.

## Pepperstone Investor Password

Pepperstone says investor passwords are read-only and are not automatically generated. You create one yourself.

Fastest PC method:

1. Open MT5 and log in to the Pepperstone trading account with your normal master password.
2. In Navigator, find your account number.
3. Right-click the account number.
4. Choose `Change password`.
5. Select `Change Investor (read-only) password`.
6. Enter your current master password in the top/current password field.
7. Enter a new investor password and confirm it.
8. Save it privately.

Android method:

1. Open MT5 Android.
2. Go to `Manage Accounts`.
3. Log in to the Pepperstone account.
4. Tap the 3 dots in the top right.
5. Choose `Change password`.
6. Change the selection from master password to investor password.
7. Enter current master password, then the new investor password.

iOS method:

1. Open MT5 iPhone.
2. Go to `Settings`.
3. Tap the current account at the top.
4. Tap the 3 dots beside the account name.
5. Choose `Change password`.
6. Choose `Change Investor Password`.
7. Enter current master password, then the new investor password.

Use that investor password to log in to MT5 on the Oracle VM. The bridge EA only reads closed-position history and sends it to your Supabase webhook.

## Copy This Package To The VM

From Windows PowerShell on your PC:

```powershell
scp -r "C:\Users\6800120\OneDrive - IBI Quantum\Documents\Trader life\oracle-relay" ubuntu@YOUR_VM_IP:~/
ssh ubuntu@YOUR_VM_IP
```

Replace `YOUR_VM_IP` with the public IP address of your Oracle VM.

## Install On The VM

On the VM:

```bash
cd ~/oracle-relay
chmod +x *.sh
./install-oracle-relay.sh
```

This installs a lightweight desktop, TigerVNC, and support tools.

## Start VNC

On the VM:

```bash
./start-vnc.sh
```

From Windows PowerShell on your PC, open a secure tunnel:

```powershell
ssh -L 5901:localhost:5901 ubuntu@YOUR_VM_IP
```

Then open your VNC Viewer to:

```text
localhost:5901
```

VNC is bound to localhost on the VM, so the tunnel is the intended safe access path.

## Install MT5 Inside VNC

Inside the VNC desktop, open Terminal and run:

```bash
cd ~/oracle-relay
./install-mt5-official.sh
```

Follow the MT5 installer. If Wine asks for Mono or Gecko, accept.

## Configure MT5

Inside MT5 on the VM:

1. Log in to your Pepperstone MT5 account.
2. Prefer the investor/read-only password you created above.
3. Open `Tools > Options > Expert Advisors`.
4. Enable `Allow WebRequest for listed URL`.
5. Add:

```text
https://lzaetartgfejsnwpiezc.supabase.co
```

6. Click OK.

## Add And Compile The Bridge EA

In the VNC Terminal:

```bash
cd ~/oracle-relay
./copy-ea-to-mt5.sh
```

Then in MT5:

1. Open MetaEditor.
2. Open `FxEdgeClosedOrderBridge.mq5`.
3. Compile it.
4. Return to MT5.
5. Attach `FxEdgeClosedOrderBridge` to one chart.

## Generate The App Token

Open your FX Edge Journal app:

1. Sign in with Cloud/Supabase.
2. In the sidebar MT5 Bridge panel, click `PC`.
3. Copy the generated `WebhookUrl` and `BridgeToken`.
4. Paste both into the EA inputs on the Oracle VM.

Use `PC`, not `Mobile`, for this cloud relay. The VM is running the MT5 desktop engine, and it still captures positions closed from Android or iPhone.

## Keep It Running After Logout

After MT5 is installed, logged in, and the EA is attached:

```bash
cd ~/oracle-relay
./install-user-service.sh
```

This creates a user service that starts the VNC display and MT5 after VM reboot.

Check status:

```bash
systemctl --user status fx-edge-mt5-relay.service
```

Restart:

```bash
systemctl --user restart fx-edge-mt5-relay.service
```

## Deploy Supabase Function

From your PC in the project folder:

```powershell
supabase login
supabase link --project-ref lzaetartgfejsnwpiezc
supabase functions deploy mt5-closed-order --no-verify-jwt
```

Also run the latest `supabase-schema.sql` in the Supabase SQL Editor.

## Test

1. Use a demo account first if possible.
2. Open and close a tiny test trade from MT5 mobile or PC.
3. Open FX Edge Journal.
4. Go to Journal.
5. Confirm the trade appears in `Detected Closed Positions`.
6. Click `Record` only after reviewing the imported facts.
