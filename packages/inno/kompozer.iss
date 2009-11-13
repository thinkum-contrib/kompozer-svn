[Setup]
AppId={{64C7EDE3-A314-459C-BF63-1591D6A4A53D}
AppName=Kompozer
AppVerName=Kompozer 0.8b1
AppPublisherURL=http://www.kompozer.net/
AppSupportURL=http://www.kompozer.net/
AppUpdatesURL=http://www.kompozer.net/
DefaultDirName={pf}\Kompozer
InfoBeforeFile=setup-data\info.txt
DefaultGroupName=Kompozer
WizardImageFile=setup-data\wizimage.bmp
WizardSmallImageFile=setup-data\wizimage-small.bmp
AllowNoIcons=no
LicenseFile=C:\augustin\gnugpl-v2.txt
OutputDir=setup-output\
OutputBaseFilename=kompozer-0.8b1-enUS-win32-setup
SetupIconFile=C:\augustin\kompozer\icon.ico
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
;Name: "basque"; MessagesFile: "compiler:Languages\Basque.isl"
;Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
;Name: "catalan"; MessagesFile: "compiler:Languages\Catalan.isl"
;Name: "czech"; MessagesFile: "compiler:Languages\Czech.isl"
;Name: "danish"; MessagesFile: "compiler:Languages\Danish.isl"
;Name: "dutch"; MessagesFile: "compiler:Languages\Dutch.isl"
;Name: "finnish"; MessagesFile: "compiler:Languages\Finnish.isl"
;Name: "french"; MessagesFile: "compiler:Languages\French.isl"
;Name: "german"; MessagesFile: "compiler:Languages\German.isl"
;Name: "hebrew"; MessagesFile: "compiler:Languages\Hebrew.isl"
;Name: "hungarian"; MessagesFile: "compiler:Languages\Hungarian.isl"
;Name: "italian"; MessagesFile: "compiler:Languages\Italian.isl"
;Name: "norwegian"; MessagesFile: "compiler:Languages\Norwegian.isl"
;Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"
;Name: "portuguese"; MessagesFile: "compiler:Languages\Portuguese.isl"
;Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
;Name: "slovak"; MessagesFile: "compiler:Languages\Slovak.isl"
;Name: "slovenian"; MessagesFile: "compiler:Languages\Slovenian.isl"
;Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "C:\augustin\kompozer\0.8\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Kompozer"; Filename: "{app}\kompozer.exe"; WorkingDir:"{app}"
Name: "{group}\{cm:ProgramOnTheWeb,Kompozer}"; Filename: "http://www.kompozer.net/"; WorkingDir:"{app}"
Name: "{group}\{cm:UninstallProgram,Kompozer}"; Filename: "{uninstallexe}"; WorkingDir:"{app}"
Name: "{commondesktop}\Kompozer"; Filename: "{app}\kompozer.exe"; Tasks: desktopicon; WorkingDir:"{app}"
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Kompozer"; Filename: "{app}\kompozer.exe"; Tasks: quicklaunchicon; WorkingDir:"{app}"
