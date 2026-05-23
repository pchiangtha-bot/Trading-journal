#define MyAppName "FX Edge Journal MT5 Connector"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "FX Edge Journal"
#define MyAppExeName "terminal64.exe"

[Setup]
AppId={{8C4936C5-6C7B-4A70-8E8F-14F8FAAE3E30}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\FX Edge Journal MT5 Connector
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=installer-output
OutputBaseFilename=FxEdgeMt5DesktopSetup
SetupIconFile=fx-edge.ico
UninstallDisplayIcon={app}\fx-edge.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "fx-edge.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "mt5-setup-readme.txt"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKCU; Subkey: "Software\Classes\fxedge-mt5"; ValueType: string; ValueName: ""; ValueData: "URL:FX Edge MT5 Protocol"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\fxedge-mt5"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\fxedge-mt5\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: """{code:GetMt5Path}"""; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\fxedge-mt5\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{code:GetMt5Path}"""; Flags: uninsdeletekey

[Run]
Filename: "{code:GetMt5Path}"; Description: "Open MetaTrader 5 now"; Flags: nowait postinstall skipifsilent unchecked

[Code]
var
  Mt5PathPage: TInputFileWizardPage;

function CandidatePath(Index: Integer): String;
begin
  case Index of
    0: Result := ExpandConstant('{pf}\MetaTrader 5\terminal64.exe');
    1: Result := ExpandConstant('{pf}\MetaTrader 5 Terminal\terminal64.exe');
    2: Result := ExpandConstant('{pf}\Pepperstone MetaTrader 5\terminal64.exe');
    3: Result := ExpandConstant('{pf}\Pepperstone MetaTrader 5 Terminal\terminal64.exe');
    4: Result := ExpandConstant('{pf}\Pepperstone MT5\terminal64.exe');
    5: Result := ExpandConstant('{pf32}\MetaTrader 5\terminal64.exe');
    6: Result := ExpandConstant('{pf32}\MetaTrader 5 Terminal\terminal64.exe');
    7: Result := ExpandConstant('{pf32}\Pepperstone MetaTrader 5\terminal64.exe');
    8: Result := ExpandConstant('{pf32}\Pepperstone MetaTrader 5 Terminal\terminal64.exe');
    9: Result := ExpandConstant('{pf32}\Pepperstone MT5\terminal64.exe');
    10: Result := ExpandConstant('{localappdata}\Programs\MetaTrader 5\terminal64.exe');
  else
    Result := '';
  end;
end;

function DetectMt5Path(): String;
var
  I: Integer;
  Path: String;
begin
  Result := '';
  for I := 0 to 10 do
  begin
    Path := CandidatePath(I);
    if FileExists(Path) then
    begin
      Result := Path;
      Exit;
    end;
  end;
end;

procedure InitializeWizard();
begin
  Mt5PathPage := CreateInputFilePage(
    wpSelectDir,
    'Select MetaTrader 5',
    'Choose your MetaTrader 5 terminal64.exe file.',
    'FX Edge Journal needs this one-time Windows link so the website MT5 icon can open your local MetaTrader 5 app.'
  );
  Mt5PathPage.Add(
    'MetaTrader 5 terminal:',
    'MetaTrader 5 terminal|terminal64.exe|Executable files|*.exe|All files|*.*',
    '.exe'
  );
  Mt5PathPage.Values[0] := DetectMt5Path();
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  SelectedPath: String;
begin
  Result := True;
  if CurPageID = Mt5PathPage.ID then
  begin
    SelectedPath := Trim(Mt5PathPage.Values[0]);
    if (SelectedPath = '') or (not FileExists(SelectedPath)) then
    begin
      MsgBox('Please choose your MetaTrader 5 terminal64.exe file before continuing.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if CompareText(ExtractFileName(SelectedPath), '{#MyAppExeName}') <> 0 then
    begin
      if MsgBox('The selected file is not named terminal64.exe. Continue with this file?', mbConfirmation, MB_YESNO) = IDNO then
      begin
        Result := False;
        Exit;
      end;
    end;
  end;
end;

function GetMt5Path(Param: String): String;
begin
  Result := Mt5PathPage.Values[0];
end;
