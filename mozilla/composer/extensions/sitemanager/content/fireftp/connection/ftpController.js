function connect(noAccountChange, showPassDialog) {
  if (!noAccountChange) {
    onAccountChange();
  }

  gStatusBarClear = false;

  gFtp.host = gFtp.host.replace(/^ftp:\/*/, '');                            // error checking - get rid of 'ftp://'

  if (gFtp.host && gFtp.host.charAt(gFtp.host.length - 1) == '/') {
    gFtp.host = gFtp.host.substring(0, gFtp.host.length - 1);
  }

  if (gFtp.host == "about:mozilla") {                                       // just for fun
    window.openDialog("chrome://fireftp/content/welcome.xul", "welcome", "chrome,dialog,resizable,centerscreen", "", true);
    gConnectButton.label = "Flame On!";
    gConnectButton.setAttribute('accesskey', "F");
    return;
  }

  if (!gFtp.host) {                                                         // need to fill in the host
    doAlert(gStrbundle.getString("alertFillHost"));
    return;
  }

  if (!gFtp.port || !parseInt(gFtp.port)) {                                 // need a valid port
    doAlert(gStrbundle.getString("alertFillPort"));
    return;
  }

  if (!gFtp.login || !gFtp.password || showPassDialog) {                    // get a password if needed
    var passwordObject       = new Object();
    passwordObject.login     = gFtp.login;
    passwordObject.password  = gFtp.password;
    passwordObject.returnVal = false;

    window.openDialog("chrome://fireftp/content/password.xul", "password", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

    if (passwordObject.returnVal) {
      gFtp.login    = passwordObject.login;
      gFtp.password = passwordObject.password;
    } else {
      return;
    }
  }

  setConnectButton(false);

  gFtp.connect();
}

function disconnect() {
  if (gFtp.isConnected && gFtp.eventQueue.length && (gFtp.eventQueue.length > 1 || gFtp.eventQueue[0].cmd != "NOOP") && !confirm(gStrbundle.getString("reallyclose"))) {
    return;
  }

  setConnectButton(true);
  gRemotePath.value = '/';
  gRemotePathFocus  = '/';
  document.title    = "FireFTP";

  gFtp.disconnect();
}

var ftpObserver = {
  extraCallback : null,

  onConnectionRefused : function() {
    displayWelcomeMessage(gFtp.welcomeMessage);
    setConnectButton(true);
  },

  onConnected : function() {
    connectedButtonsDisabler();
    setConnectButton(false);

    if (gFtp.security) {
      $('remotepath').setAttribute("security", "on");
    }
  },

  onWelcomed : function() {
    displayWelcomeMessage(gFtp.welcomeMessage);
  },

  onLoginAccepted : function() {
    var newConnectedHost = gFtp.login + "@" + gFtp.host;

    if (gFtp.isConnected && newConnectedHost != gFtp.connectedHost) {       // switching to a different host or different login
      gFtp.connectedHost     = newConnectedHost;
      remoteTree.treebox.rowCountChanged(0,    -remoteTree.rowCount);
      remoteTree.rowCount    = 0;
      remoteTree.data        = new Array();
      remoteDirTree.treebox.rowCountChanged(0, -remoteDirTree.rowCount);
      remoteDirTree.rowCount = 0;
      remoteDirTree.data     = new Array();
    }
  },

  onLoginDenied : function() {
    connect(false, true);
  },

  onDisconnected : function() {
    try {
      if (connectedButtonsDisabler) {                                       // connectedButtonsDisabler could be gone b/c we're disposing
        connectedButtonsDisabler();
        setConnectButton(true);
        remoteDirTree.extraCallback = null;
        this.extraCallback          = null;
        gTreeSyncManager            = false;
        remoteTree.pasteFiles       = new Array();
        $('remotePasteContext').setAttribute("disabled", true);
        $('remotepath').removeAttribute("security");
      }
    } catch (ex) { }
  },

  onReconnecting : function() {
    $('abortbutton').disabled = false;
  },

  onAbort : function() {
    remoteDirTree.extraCallback = null;
    this.extraCallback          = null;
    gTreeSyncManager            = false;

    if (!gSearchRunning) {
      localTree.refresh();
      remoteTree.refresh();
    }
  },

  onIsReadyChange : function(state) {
    try {
      window.onbeforeunload = state ? null : beforeUnload;

      if (gLoadUrl && state && gFtp.isConnected && !gFtp.eventQueue.length) { // if it's an external link check to see if it's a file to download
        var leafName = gLoadUrl.substring(gLoadUrl.lastIndexOf('/') + 1);
        var index = -1;

        for (var x = 0; x < gFtp.listData.length; ++x) {
          if (leafName == gFtp.listData[x].leafName) {
            index = x;
            break;
          }
        }

        var loadUrl = gLoadUrl;
        gLoadUrl    = "";

        if (index == -1) {
          appendLog(gStrbundle.getString("remoteNoExist"), 'error', "error");
          return;
        }

        if (gFtp.listData[index].isDirectory()) {
          remoteDirTree.changeDir(loadUrl);
        } else {                                                              // if it is, well, then download it
          var prefBranch = gPrefsService.getBranch("browser.");

          try {
            if (!prefBranch.getBoolPref("download.useDownloadDir")) {
              if (!browseLocal(gStrbundle.getString("saveFileIn"))) {
                return;
              }
            }
          } catch (ex) { }

          remoteTree.selection.select(index);
          new transfer().start(true);
        }
      }
    } catch (ex) { }
  },

  onShouldRefresh : function(local, remote, dir) {
    if (gRefreshMode && local) {
      if (this.extraCallback) {
        var tempCallback   = this.extraCallback;
        this.extraCallback = null;
        tempCallback();
      } else {
        if (gLocalPath.value != dir) {
          localDirTree.addDirtyList(dir);
        } else {
          localTree.refresh();
        }
      }
    }

    if (gRefreshMode && remote) {
      if (this.extraCallback) {
        var tempCallback   = this.extraCallback;
        this.extraCallback = null;
        tempCallback();
      } else {
        if (gRemotePath.value != dir) {
          remoteDirTree.addDirtyList(dir);
        } else {
          remoteTree.refresh();
        }
      }
    }
  },

  onChangeDir : function(path, dontUpdateView, skipRecursion) {
    if (!dontUpdateView) {
      if (skipRecursion) {
        gRemotePath.value = path ? path : gRemotePath.value;
        remoteDirTree.dontPanic();                                          // don't forget to bring a towel    
      } else {
        remoteDirTree.changeDir(path ? path : gRemotePath.value);
      }
    }
  },

  onDirNotFound : function(buffer) {                                        // so this isn't exactly the cleanest way to do it, bite me
    var changeDirPath;

    if (gFtp.eventQueue.length > 1 && gFtp.eventQueue[1].cmd == "LIST" && (typeof gFtp.eventQueue[1].callback == "string")
                                                                       && gFtp.eventQueue[1].callback.indexOf("remoteDirTree.changeDir(") != -1) {
      changeDirPath = gFtp.eventQueue[1].callback.substring(gFtp.eventQueue[1].callback.indexOf("'") + 1, gFtp.eventQueue[1].callback.length - 2);
    }

    if (gFtp.eventQueue.length > 1 && gFtp.eventQueue[1].cmd == "LIST") {
      gFtp.eventQueue.shift();                                              // get rid of pasv and list in the queue
      gFtp.eventQueue.shift();
      gFtp.trashQueue = new Array();
    }

    if (changeDirPath) {                                                    // this is a fix for people who can't access '/' on their remote hosts
      gRemotePath.value = changeDirPath;
      remoteDirTree.dontPanic();                                            // don't forget to bring a towel
    }
  }
};
