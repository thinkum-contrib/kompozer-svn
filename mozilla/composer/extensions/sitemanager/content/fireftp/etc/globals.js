var gFtp;                       // where the magic happens
var gVersion  = "0.97.3";  // version of FireFTP we're using
var gSlash;                     // holds '/' or '\\' depending on local system
var gMac = false;               // true if we're on a Mac
var gTransferTypes;             // holds 'Auto', 'Binary', 'ASCII'
var gLogQueue = "";             // buffers log data
var gAlertWindow;               // reference to the alertDialog
var gWelcomeWindow;             // reference to the welcomeDialog
var gPrograms = new Array();    // programs in our open with list
var gLocalPathFocus;            // keep the correct value in the local  path
var gRemotePathFocus;           // keep the correct value in the remote path
var gMonths;                    // localized months
var gSiteManager;               // hold site manager data
var gWebHost;                   // url used in viewing things on the web
var gPrefix;                    // part of the ftp url to get rid of for viewing on the web, e.g. /www
var gAccount;                   // name of the account we're connecting to
var gDownloadCaseMode;          // 0 == do nothing, 1 == convert filename to lower case, 2 == convert to uppercase
var gUploadCaseMode;            // ditto
var gTreeSync;                  // whether or not we're trying to keep directories in sync
var gTreeSyncLocal;             // base local  tree sync dir
var gTreeSyncRemote;            // base remote tree sync dir
var gTreeSyncManager;           // the code that manages changes
var gStatusBarClear = true;     // whether the status bar is clear or not

var gSearchFiles;               // search: files matching the query
var gSearchFound;               // search: did we find any results?
var gSearchRunning = false;     // search: is search running?
var gSearchCallbacks;           // search: local callbacks
var gSearchName;                // search: filename search query
var gSearchType;                // search: 0 = local or 1 = remote
var gSearchRecursive;           // search: recursive or not
var gSearchMatchCase;           // search: match case or not
var gSearchRegExp;              // search: regular expression or not

var gMissingRemoteFiles;        // directory diff: files missing on remote files
var gMissingLocalFiles;         // directory diff: files missing on local side
var gDifferentFiles;            // directory diff: files that have different file sizes
var gNewerFiles;                // directory diff: files that are newer
var gOlderFiles;                // directory diff: files that are older

var gDefaultAccount;            // from prefs: select the opened account
var gBytesMode;                 // from prefs: show kilobytes or just bytes
var gDebugMode;                 // from prefs: show debug msgs in log or not
var gDisableDestructMode;       // from prefs: true if we want to disable the self-destruct timer in the overwrite dialog
var gDonated;                   // from prefs: donated or not
var gErrorMode;                 // from prefs: show error msgs or not
var gInterfaceMode;             // from prefs: show local view, remote view, or both
var gLoadUrl;                   // from prefs: ftp url to open onload
var gLogErrorMode;              // from prefs: show only errors in log or not
var gLogMode;                   // from prefs: show log window or not
var gNoPromptMode;              // from prefs: true if we want to disable the overwrite dialog
var gPasswordMode;              // from prefs: save password or not
var gRefreshMode;               // from prefs: refresh on remote side if change is made or not
var gTempPasvMode;              // from prefs: use passive mode for temporary connections
var gWelcomeMode;               // from prefs: show welcome msg on connect or not

var gStrbundle;                 // $() references
var gConnectButton;
var gAccountField;
var gLocalPath;
var gLocalTree;
var gLocalDirTree;
var gLocalTreeChildren;
var gLocalDirTreeChildren;
var gRemotePath;
var gRemoteTree;
var gRemoteDirTree;
var gRemoteTreeChildren;
var gRemoteDirTreeChildren;
var gCmdlogDoc;
var gCmdlogBody;
var gStatusBytes;
var gStatusElapsed;
var gStatusRemaining;
var gStatusRate;
var gStatusMeter;

var gProfileDir;                // services
var gAtomService;
var gPassManager;
var gPassManagerIn;
var gFormHistory;
var gIos;
var gPromptService;
var gPrefsService;
var gPrefs;