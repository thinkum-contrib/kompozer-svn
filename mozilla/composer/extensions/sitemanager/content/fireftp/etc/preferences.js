function readPreferences(startup) {
  try {
    gDefaultAccount          = gPrefs.getComplexValue("defaultaccount", Components.interfaces.nsISupportsString).data;
    gBytesMode               = gPrefs.getBoolPref("bytesmode");
    gDebugMode               = gPrefs.getBoolPref("debugmode");
    gDisableDestructMode     = gPrefs.getBoolPref("destructmode");
    gDonated                 = gPrefs.getBoolPref("donated");
    gErrorMode               = gPrefs.getBoolPref("errormode");
    gInterfaceMode           = gPrefs.getIntPref ("interfacemode");
    gLogErrorMode            = gPrefs.getBoolPref("logerrormode");
    gLogMode                 = gPrefs.getBoolPref("logmode");
    gNoPromptMode            = gPrefs.getBoolPref("nopromptmode");
    gPasswordMode            = gPrefs.getBoolPref("passwordmode");
    gRefreshMode             = gPrefs.getBoolPref("refreshmode");
    gTempPasvMode            = gPrefs.getBoolPref("temppasvmode");
    gWelcomeMode             = gPrefs.getBoolPref("welcomemode");

    gFtp.fileMode            = gPrefs.getIntPref ("filemode");
    gFtp.hiddenMode          = gPrefs.getBoolPref("hiddenmode");
    gFtp.keepAliveMode       = gPrefs.getBoolPref("keepalivemode");
    gFtp.networkTimeout      = gPrefs.getIntPref ("network");
    gFtp.proxyHost           = gPrefs.getComplexValue("proxyhost", Components.interfaces.nsISupportsString).data;
    gFtp.proxyPort           = gPrefs.getIntPref ("proxyport");
    gFtp.proxyType           = gPrefs.getCharPref("proxytype");
    gFtp.activePortMode      = gPrefs.getBoolPref("activeportmode");
    gFtp.activeLow           = gPrefs.getIntPref ("activelow");
    gFtp.activeHigh          = gPrefs.getIntPref ("activehigh");
    gFtp.reconnectAttempts   = gPrefs.getIntPref ("attempts");
    gFtp.reconnectInterval   = gPrefs.getIntPref ("retry");
    gFtp.reconnectMode       = gPrefs.getBoolPref("timeoutmode");
    gFtp.sessionsMode        = gPrefs.getBoolPref("sessionsmode");
    gFtp.timestampsMode      = gPrefs.getBoolPref("timestampsmode");

    if (gPrefs.getComplexValue("folder", Components.interfaces.nsISupportsString).data == "") {
      var file = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                           .get("Home", Components.interfaces.nsILocalFile);

      var sString  = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
      if (file.path.indexOf('/') != -1) {
        sString.data = file.path.substring(0, file.path.indexOf('/') + 1);
      } else if (file.path.indexOf('\\') != -1) {
        sString.data = file.path.substring(0, file.path.indexOf('\\') + 1);
      }
      gPrefs.setComplexValue("folder", Components.interfaces.nsISupportsString, sString);
    }

    if (startup) {
      gLocalPath.value = gPrefs.getComplexValue("folder", Components.interfaces.nsISupportsString).data;
      gLoadUrl         = gPrefs.getComplexValue("loadurl", Components.interfaces.nsISupportsString).data;
    }

    updateInterface();

    $('cmdlog').collapsed  = !gLogMode;
    $('logsplitter').state =  gLogMode ? 'open' : 'collapsed';
    $('logbutton').checked = gLogMode;

    $('statustype').label  = gTransferTypes[gFtp.fileMode];

    var asciiList = gPrefs.getComplexValue("asciifiles", Components.interfaces.nsISupportsString).data;
    asciiList     = asciiList.split(",");
    for (var x = 0; x < asciiList.length; ++x) {
      gFtp.asciiFiles.push(asciiList[x]);
    }

  } catch (ex) {
    debug(ex);
  }
}

function showPreferences() {
  var branch       = gPrefsService.getBranch("browser.");
  var instantApply = branch.getBoolPref("preferences.instantApply");
  window.openDialog("chrome://fireftp/content/preferences.xul", "preferences", "chrome,resizable,centerscreen"
                                                                               + (instantApply ? ",dialog=no" : ",modal,dialog"));
}

var prefsObserver = {
  observe : function(prefsbranch, topic, data) {
    readPreferences();

    if (data == "fireftp.bytesmode") {
      localTree.updateView();

      if (gFtp.isConnected) {
        remoteTree.updateView();
      }
    } else if (data == "fireftp.logerrormode") {
      if (gLogErrorMode) {
        showOnlyErrors();
      } else {
        showAll();
      }
    } else if (data == "fireftp.hiddenmode") {
      if (!gFtp.hiddenMode) {
        var file        = localFile.init(gLocalPath.value);
        var hiddenFound = false;

        while (true) {
          if (file.isHidden() && file.path != localDirTree.data[0].path) {
            hiddenFound = true;
            break;
          }

          if (!(parent in file) || file.path == file.parent.path) {
            break;
          }

          file = file.parent;
        }

        if (hiddenFound) {
          gLocalPath.value = localDirTree.data[0].path;
        }
      }

      localDirTree.data     = new Array();
      localDirTree.treebox.rowCountChanged(0, -localDirTree.rowCount);
      localDirTree.rowCount = 0;
      localDirTree.changeDir(gLocalPath.value);
    }
  }
};
