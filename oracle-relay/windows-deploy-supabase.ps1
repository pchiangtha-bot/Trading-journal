param(
  [string]$ProjectRef = "lzaetartgfejsnwpiezc"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Supabase CLI was not found. Install it first, then rerun this script."
  Write-Host "Manual commands:"
  Write-Host "  supabase login"
  Write-Host "  supabase link --project-ref $ProjectRef"
  Write-Host "  supabase functions deploy mt5-closed-order --no-verify-jwt"
  exit 1
}

supabase login
supabase link --project-ref $ProjectRef
supabase functions deploy mt5-closed-order --no-verify-jwt

