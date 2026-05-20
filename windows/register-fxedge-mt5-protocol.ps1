param(
  [string]$Mt5Path
)

$ErrorActionPreference = "Stop"

function Find-Mt5Terminal {
  param([string]$ProvidedPath)

  if ($ProvidedPath) {
    $resolved = Resolve-Path -LiteralPath $ProvidedPath -ErrorAction SilentlyContinue
    if ($resolved -and (Test-Path -LiteralPath $resolved.Path -PathType Leaf)) {
      return $resolved.Path
    }
    throw "MT5 terminal64.exe was not found at: $ProvidedPath"
  }

  $programFilesX86 = ${env:ProgramFiles(x86)}
  $candidates = @(
    "$env:ProgramFiles\MetaTrader 5\terminal64.exe",
    "$env:ProgramFiles\MetaTrader 5 Terminal\terminal64.exe",
    "$env:ProgramFiles\Pepperstone MetaTrader 5\terminal64.exe",
    "$env:ProgramFiles\Pepperstone MT5\terminal64.exe",
    "$programFilesX86\MetaTrader 5\terminal64.exe",
    "$programFilesX86\MetaTrader 5 Terminal\terminal64.exe",
    "$programFilesX86\Pepperstone MetaTrader 5\terminal64.exe",
    "$programFilesX86\Pepperstone MT5\terminal64.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      return $candidate
    }
  }

  throw "MT5 terminal64.exe was not found automatically. Run this again with -Mt5Path `"C:\Path\To\terminal64.exe`"."
}

$terminalPath = Find-Mt5Terminal -ProvidedPath $Mt5Path
$protocolKey = "HKCU:\Software\Classes\fxedge-mt5"
$iconKey = Join-Path $protocolKey "DefaultIcon"
$commandKey = Join-Path $protocolKey "shell\open\command"

New-Item -Path $protocolKey -Force | Out-Null
Set-Item -Path $protocolKey -Value "URL:FX Edge MT5 Protocol"
New-ItemProperty -Path $protocolKey -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null

New-Item -Path $iconKey -Force | Out-Null
Set-Item -Path $iconKey -Value "`"$terminalPath`""

New-Item -Path $commandKey -Force | Out-Null
Set-Item -Path $commandKey -Value "`"$terminalPath`""

Write-Host "FX Edge MT5 protocol registered."
Write-Host "Protocol: fxedge-mt5://open"
Write-Host "MT5 path: $terminalPath"
