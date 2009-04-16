function startup() {
  if (gStrbundle) {                            // we get two onload events b/c of the embedded browser
    return;
  }

  window.onerror         = detailedError;

  gStrbundle             = $("strings");
  gConnectButton         = $('connectbutton');
  gAccountField          = $('account');
  gLocalPath             = $('localpath');
  gLocalTree             = $('localtree');
  gLocalDirTree          = $('localdirtree');
  gLocalTreeChildren     = $('localtreechildren');
  gLocalDirTreeChildren  = $('localdirtreechildren');
  gRemotePath            = $('remotepath');
  gRemoteTree            = $('remotetree');
  gRemoteDirTree         = $('remotedirtree');
  gRemoteTreeChildren    = $('remotetreechildren');
  gRemoteDirTreeChildren = $('remotedirtreechildren');
  gCmdlogDoc             = $('cmdlog').contentWindow.document;
  gCmdlogBody            = $('cmdlog').contentWindow.document.body;
  gStatusBytes           = $('statusbytes');
  gStatusElapsed         = $('statuselapsed');
  gStatusRemaining       = $('statusremaining');
  gStatusRate            = $('statusrate');
  gStatusMeter           = $('statusmeter');
  gLocalTree.view        = localTree;
  gLocalDirTree.view     = localDirTree;
  gRemoteTree.view       = remoteTree;
  gRemoteDirTree.view    = remoteDirTree;

  gProfileDir            = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("ProfD", Components.interfaces.nsILocalFile);
  gAtomService           = Components.classes["@mozilla.org/atom-service;1"].getService            (Components.interfaces.nsIAtomService);
  gPassManager           = Components.classes["@mozilla.org/passwordmanager;1"].getService         (Components.interfaces.nsIPasswordManager);
  gPassManagerIn         = Components.classes["@mozilla.org/passwordmanager;1"].getService         (Components.interfaces.nsIPasswordManagerInternal);
  gIos                   = Components.classes["@mozilla.org/network/io-service;1"].getService      (Components.interfaces.nsIIOService);
  gPromptService         = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
  gPrefsService          = Components.classes["@mozilla.org/preferences-service;1"].getService     (Components.interfaces.nsIPrefService);
  gFormHistory           = Components.classes["@mozilla.org/satchel/form-history;1"].getService    (Components.interfaces.nsIFormHistory ?
                                                                                                    Components.interfaces.nsIFormHistory :
                                                                                                    Components.interfaces.nsIFormHistory2);
  gPrefs                 = gPrefsService.getBranch("fireftp.");

  if (gPrefsService instanceof Components.interfaces.nsIPrefBranchInternal) {
    gPrefsService.addObserver("fireftp", prefsObserver, false);
  }

  gFtp                   = new ftpMozilla(ftpObserver);
  gFtp.debug             = debug;
  gFtp.error             = error;
  gFtp.appendLog         = appendLog;
  gFtp.errorConnectStr   = gStrbundle.getString("errorConn");
  gFtp.errorXCheckFail   = gStrbundle.getString("errorXCheckFail");
  gFtp.passNotShown      = gStrbundle.getString("passNotShown");
  gFtp.l10nMonths        = gStrbundle.getString("months").split("|");
  gTransferTypes         = new Array(gStrbundle.getString("auto"), gStrbundle.getString("binary"), gStrbundle.getString("ascii"));
  gMonths                = gStrbundle.getString("months").split("|");


  treeHighlighter.valid  = new Array({ tree: gLocalTree,  children: gLocalTreeChildren,  column: "localname"  },
                                     { tree: gRemoteTree, children: gRemoteTreeChildren, column: "remotename" });

  if ($('searchWhich').selectedIndex == -1) {
    $('searchWhich').selectedIndex = 0;
  }

  searchSelectType();

  readPreferences(true);
  setConnectButton(true);
  accountButtonsDisabler(true);
  connectedButtonsDisabler();
  localDirTree.changeDir(gLocalPath.value);
  loadSiteManager(true);
  loadPrograms();

  for (var x = 0; x < gSiteManager.length; ++x) {
    if (gSiteManager[x].account == gDefaultAccount) {
      gAccountField.selectedIndex = x;
      onAccountChange();
      break;
    }
  }
  gAccountField.focus();

  appendLog("<span style='cursor:pointer;text-decoration:underline;color:blue' onclick=\"window.open('http://fireftp.mozdev.org/donate.html','FireFTP');\">"
      + "FireFTP</span> " + gVersion
      + "  '<span style='cursor:pointer;text-decoration:underline' onclick=\"window.open('http://www.modestmouse.com/','mm');\">"
      + "Cowboy Dan</span>'" + ", " + gStrbundle.getString("opening"), 'blue', "info");
  gCmdlogBody.scrollTop = 0;

  tipJar();

  if (gLoadUrl) {
    setTimeout("externalLink()", 1000);
  }
}

function beforeUnload() {
  return "";
}

function unload() {
  if (gPrefsService instanceof Components.interfaces.nsIPrefBranchInternal) {
    gPrefsService.removeObserver("fireftp", prefsObserver, false);
  }

  gFtp.disconnect();
}
