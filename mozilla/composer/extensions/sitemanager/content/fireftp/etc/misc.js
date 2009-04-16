function commas(num) {                 // add commas to numbers
  num = num.toString();

  if (num.search(/\d{4}$/) == -1) {
    return num;
  }

  num = num.replace(/\d{3}$/, ",$&");

  while (num.search(/\d{4}\x2C/) != -1) {
    num = num.replace(/\d{3}\x2C/, ",$&");
  }

  return num;
}

function zeros(num) {                  // pad with zeros
  num = num.toString();
  return num.length == 2 ? num : '0' + num;
}

function onChangeType() {              // change TYPE A/TYPE I/auto from statusbar
  gPrefs.setIntPref("filemode", (gFtp.fileMode + 1) % 3);
}

function setInterfaceMode() {          // update the interface based on collapsing
  gPrefs.setIntPref("interfacemode", ($('leftsplitter').getAttribute('state')  == 'collapsed') * 2
                                   + ($('rightsplitter').getAttribute('state') == 'collapsed'));
}

function updateInterface() {           // update the interface based on interfacemode variable
  var local  = (gInterfaceMode & 2);
  var remote = (gInterfaceMode & 1);

  $('storbutton').collapsed  = local;
  $('retrbutton').collapsed  = remote;

  $('localview').collapsed   = local;
  $('remoteview').collapsed  = remote;

  $('leftsplitter').setAttribute( 'state', (local  ? 'collapsed' : 'open'));
  $('rightsplitter').setAttribute('state', (remote ? 'collapsed' : 'open'));
}

function onLocalPathFocus(event) {
  gLocalPathFocus  = gLocalPath.value;
}

function onLocalPathBlur(event) {
  gLocalPath.value = gLocalPathFocus;
}

function onRemotePathFocus(event) {
  gRemotePathFocus = gRemotePath.value;
}

function onRemotePathBlur(event) {
  if (!gFtp.isConnected) {
    gRemotePathFocus  = gRemotePath.value;
  } else {
    gRemotePath.value = gRemotePathFocus;
  }
}

function browseLocal(title) {          // browse the local file structure
  var nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp            = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(window, title ? title : gStrbundle.getString("selectFolder"), nsIFilePicker.modeGetFolder);
  var res = fp.show();

  if (res == nsIFilePicker.returnOK) {
    localDirTree.changeDir(fp.file.path);
  }

  return res == nsIFilePicker.returnOK;
}

function parseSize(size) {             // adds byte information for file sizes
  if (size > 1024 * 1024 * 1024) {
    size = parseFloat(size / 1024 / 1024 / 1024).toFixed(1) + " GB";
  } else if (size > 1024 * 1024) {
    size = parseFloat(size / 1024 / 1024).toFixed(2)        + " MB";
  } else if (size > 1024) {
    size = parseFloat(size / 1024).toFixed(1)               + " KB";
  } else if (size >= 0) {
    size = size + " Bytes";
  }

  return size;
}

function displayWelcomeMessage(msg) {
  if (gWelcomeMode) {
    try {
      if (gWelcomeWindow && gWelcomeWindow.close) {          // get rid of those extra pestering welcome windows if the program is reconnecting automatically
        gWelcomeWindow.close();
      }
    } catch (ex) { }

    gWelcomeWindow = window.openDialog("chrome://fireftp/content/welcome.xul", "welcome", "chrome,resizable,centerscreen", msg);
  }
}

function custom() {
  if (!gFtp.isConnected || !gFtp.isReady) {
    return;
  }

  var cmd = window.prompt(gStrbundle.getString("command"), "", gStrbundle.getString("customCommand"));

  if (!cmd) {
    return;
  }

  gFtp.custom(cmd);
}

function cloneObject(what) {
  for (i in what) {
    this[i] = what[i];
  }
}

function cloneArray(a) {
  var n = new Array();

  for (var x = 0; x < a.length; ++x) {
    n.push(a[x]);
  }

  return n;
}

function runInFirefox(path) {
  var windowManager          = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
  var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
  var win                    = windowManagerInterface.getMostRecentWindow("navigator:browser");

  if (win) {
    var theTab               = win.gBrowser.addTab(path);
    win.gBrowser.selectedTab = theTab;
    return;
  }

  try {    // this is used if FireFTP is running as a standalone and there are no browsers open; much more complicated, not very pretty
    var firefoxInstallPath = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                       .get("CurProcD", Components.interfaces.nsILocalFile);
    var firefox            = localFile.init(firefoxInstallPath.path + "\\" + "firefox.exe");

    if (!firefox.exists()) {                                 // try linux
      firefox.initWithPath(firefoxInstallPath.path + "/" + "firefox");
      if (!firefox.exists()) {                               // try os x
         firefox.initWithPath(firefoxInstallPath.path + "/" + "firefox-bin");
      }
    }

    var process = Components.classes['@mozilla.org/process/util;1'].getService(Components.interfaces.nsIProcess);
    process.init(firefox);
    var arguments = new Array(path);
    process.run(false, arguments, arguments.length, {});
  } catch (ex) {
    debug(ex);
  }
}

function tipJar() {
  if (!gDonated) {
    gPrefs.setBoolPref("donated", true);
    runInFirefox("http://fireftp.mozdev.org/donate.html");
  }
}

function doAbort() {
  gSearchRunning = false;
  gFtp.abort();
}

function toolsPopupMenu() {
  $('diffMenuItem').setAttribute("disabled",     !gFtp.isConnected || localTree.searchMode == 2 || remoteTree.searchMode == 2);
  $('recDiffMenuItem').setAttribute("disabled",  !gFtp.isConnected || localTree.searchMode == 2 || remoteTree.searchMode == 2);
}

function setCharAt(str, index, ch) {                         // how annoying
  return str.substr(0, index) + ch + str.substr(index + 1);
}
