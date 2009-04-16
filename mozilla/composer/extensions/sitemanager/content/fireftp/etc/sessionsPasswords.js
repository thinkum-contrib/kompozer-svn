function createAccount() {
  if (!gSiteManager.length) {
    newSite();
  }
}

function newSite() {
  var newSiteCallback = function(site) {
    gSiteManager.push(site);
    accountHelper(site);
  };

  var params = { callback    : newSiteCallback,
                 siteManager : gSiteManager,
                 localPath   : gLocalPath.value,
                 remotePath  : gRemotePath.value,
                 site        : { account  : "", host     : "",   port             : 21,    login          : "",    password : "",     anonymous : false,
                                 security : "", pasvmode : true, ipmode           : false, treesync       : false, localdir : "",     remotedir : "",
                                 webhost  : "", prefix   : "",   downloadcasemode : 0,     uploadcasemode : 0,     encoding : "UTF-8" } };

  window.openDialog("chrome://fireftp/content/accountManager.xul", "accountManager", "chrome,dialog,resizable,centerscreen", params);
}

function editSite() {
  if (!gAccountField.value) {
    return;
  }

  var editSite;                                                      // grab a copy of the old site

  for (var x = 0; x < gSiteManager.length; ++x) {
    if (gSiteManager[x].account == gAccountField.value) {
      editSite = new cloneObject(gSiteManager[x]);
      break;
    }
  }

  var oldSite = new cloneObject(editSite);

  var editSiteCallback = function(site) {
    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == oldSite.account) {
        gSiteManager[x] = site;
        break;
      }
    }

    try {                                                            // delete old password from list
      var recordedHost = (oldSite.host.indexOf("ftp.") == 0 ? '' : "ftp.") + oldSite.host;
      gPassManager.removeUser(recordedHost, oldSite.login);
    } catch (ex) { }

    accountHelper(site);
  };

  editSite.temporary  = false;
  var params          = { callback    : editSiteCallback,
                          siteManager : gSiteManager,
                          localPath   : gLocalPath.value,
                          remotePath  : gRemotePath.value,
                          site        : editSite };

  window.openDialog("chrome://fireftp/content/accountManager.xul", "accountManager", "chrome,dialog,resizable,centerscreen", params);
}

function deleteSite() {
  if (!gAccountField.value) {
    return;
  }

  if (!confirm(gStrbundle.getString("confirmDelete") + " '" + gAccountField.value + "'?")) {
    return;
  }

  for (var x = 0; x < gSiteManager.length; ++x) {                    // delete the account
    if (gSiteManager[x].account == gAccountField.value) {
      try {                                                          // delete password from list
        var recordedHost = (gSiteManager[x].host.indexOf("ftp.") == 0 ? '' : "ftp.") + gSiteManager[x].host;
        gPassManager.removeUser(recordedHost, gSiteManager[x].login);
      } catch (ex) { }

      gSiteManager.splice(x, 1);

      break;
    }
  }

  saveSiteManager();
  loadSiteManager();
}

function saveTempSite() {
  if (!gAccountField.value) {
    return;
  }

  var account = gAccountField.value;

  for (var x = 0; x < gSiteManager.length; ++x) {
    if (gSiteManager[x].account == gAccountField.value) {
      gSiteManager[x].temporary = false;
      break;
    }
  }

  saveSiteManager();
  loadSiteManager();

  for (var x = 0; x < gSiteManager.length; ++x) {                    // select the new site
    if (gSiteManager[x].account == account) {
      gAccountField.selectedIndex = x;
      onAccountChange();
      break;
    }
  }
}

function quickConnect() {                                            // make a quick connection, account not saved
  var quickConnectCallback = function(site) {
    tempAccountHelper(site);
  };

  var quickConnectCancelCallback = function() {
    $('quickMenuItem').setAttribute("disabled", gFtp.isConnected);
  };

  $('quickMenuItem').setAttribute("disabled", true);

  var params = { callback       : quickConnectCallback,
                 cancelCallback : quickConnectCancelCallback,
                 siteManager    : gSiteManager,
                 quickConnect   : true,
                 localPath      : gLocalPath.value,
                 remotePath     : gRemotePath.value,
                 site           : { account  : "", host     : "",   port             : 21,    login          : "",    password : "",     anonymous : false,
                                    security : "", pasvmode : true, ipmode           : false, treesync       : false, localdir : "",     remotedir : "",
                                    webhost  : "", prefix   : "",   downloadcasemode : 0,     uploadcasemode : 0,     encoding : "UTF-8",
                                    temporary : true } };

  window.openDialog("chrome://fireftp/content/accountManager.xul", "accountManager", "chrome,dialog,resizable,centerscreen", params);
}

function externalLink() {                                            // opened up fireFTP using a link in Firefox
  var site = { account  : "", host     : "",            port             : 21,    login          : "anonymous", password : "fireftp@example.com", anonymous : true,
               security : "", pasvmode : gTempPasvMode, ipmode           : false, treesync       : false,       localdir : "",                    remotedir : "",
               webhost  : "", prefix   : "",            downloadcasemode : 0,     uploadcasemode : 0,           encoding : "UTF-8",
               temporary : true };

  var uri    = Components.classes["@mozilla.org/network/standard-url;1"].getService(Components.interfaces.nsIURI);
  var toUTF8 = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService);
  uri.spec   = gLoadUrl;

  if (!uri.schemeIs("ftp") || gLoadUrl.length <= 6) {                // sanity check
    return;
  }

  if (uri.username) {
    site.login     = unescape(uri.username);
    site.password  = unescape(uri.password);
    site.anonymous = site.login ? false : true;
  }

  if (uri.username && !uri.password) {
    try {
      var host = { value : "" };    var login = { value : "" };    var password = { value : "" };
      gPassManagerIn.findPasswordEntry('ftp://' + site.login + '@' + uri.host, "", "", host, login, password);
      site.password = password.value;
    } catch (ex) { }
  }

  if (!uri.username && !uri.password) {
    try {
      var host = { value : "" };    var login = { value : "" };    var password = { value : "" };
      gPassManagerIn.findPasswordEntry('ftp://' + uri.host, "", "", host, login, password);
      site.login    = login.value;
      site.password = password.value;
    } catch (ex) { }
  }

  site.host = uri.host;
  site.port = uri.port == -1 ? 21 : uri.port;

  var prefBranch   = gPrefsService.getBranch("browser.");
  gLoadUrl         = uri.path.charAt(uri.path.length - 1) == '/' ? "" : unescape(uri.path);

  try {
    gLoadUrl       = toUTF8.convertStringToUTF8(gLoadUrl, "UTF-8", 1);
  } catch (ex) {
    debug(ex);
  }

  try {
    if (prefBranch.getBoolPref("download.useDownloadDir")) {
      site.localdir  = prefBranch.getComplexValue("download.dir", Components.interfaces.nsISupportsString).data;
    }
  } catch (ex) { }

  site.remotedir = gLoadUrl == "" ? unescape(uri.path) : unescape(uri.path.substring(0, uri.path.lastIndexOf('/')));

  try {
    site.remotedir = toUTF8.convertStringToUTF8(site.remotedir, "UTF-8", 1);
  } catch (ex) {
    debug(ex);
  }

  gPrefs.setCharPref("loadurl", "");

  tempAccountHelper(site);
}

function accountHelper(site) {
  if (gPasswordMode) {
    try {                                                            // save username & password
      var recordedHost  = (site.host.indexOf("ftp.") == 0 ? '' : "ftp.") + site.host;

      gPassManager.addUser(recordedHost, site.login, site.password);
    } catch (ex) {
      debug(ex);
    }
  }

  var tempPassword = site.password;
  saveSiteManager();                                                 // save site manager
  loadSiteManager();

  for (var x = 0; x < gSiteManager.length; ++x) {                    // select the new site
    if (gSiteManager[x].account == site.account) {
      gAccountField.selectedIndex = x;
      gSiteManager[x].password    = tempPassword;                    // if "Remember Passwords" is off we have to remember what it is temporarily
      onAccountChange();
      break;
    }
  }
}

function tempAccountHelper(site) {
  site.account = site.host;

  var found = true;
  var count = 0;

  while (found) {
    found = false;

    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == site.account) {
        found = true;
        ++count;
        site.account = site.host + '-' + count.toString();
        break;
      }
    }
  }

  gSiteManager.push(site);

  accountHelper(site);

  connect(true);
}

function onAccountChange() {
  var accountToLoad = gFtp.isConnected ? gAccount : gAccountField.value;

  for (var x = 0; x < gSiteManager.length; ++x) {                    // load up the new values into the global variables
    if (gSiteManager[x].account == accountToLoad) {
      accountChangeHelper(gSiteManager[x]);
      break;
    }
  }

  if (gAccountField.value) {
    accountButtonsDisabler(false);
  }
}

function accountChangeHelper(site) {
  gFtp.host         = site.host;
  gFtp.port         = site.port;
  gFtp.security     = site.security;
  gFtp.login        = site.login;
  gFtp.password     = site.password;
  gFtp.passiveMode  = site.pasvmode;
  gFtp.ipType       = site.ipmode ? "IPv6" : "IPv4";
  gFtp.setEncoding   (site.encoding || "UTF-8");
  gAccount          = site.account;
  gDownloadCaseMode = site.downloadcasemode;
  gUploadCaseMode   = site.uploadcasemode;
  gWebHost          = site.webhost;
  gPrefix           = site.prefix;
  gTreeSync         = site.treesync;
  gTreeSyncLocal    = site.localdir;
  gTreeSyncRemote   = site.remotedir;

  if (!gFtp.isConnected) {
    if (site.localdir) {
      var dir = localFile.init(site.localdir);
      if (localFile.verifyExists(dir)) {
        localDirTree.changeDir(site.localdir);
      } else {
        error(gStrbundle.getString("noPermission"));
      }
    }

    if (site.remotedir) {
      gRemotePath.value = site.remotedir;
    } else {
      gRemotePath.value = "/";
    }
  }

  gFtp.initialPath  = gRemotePath.value;

  if (site.account) {
    var sString  = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
    sString.data = site.account;
    gPrefs.setComplexValue("defaultaccount", Components.interfaces.nsISupportsString, sString);
  }

  accountButtonsDisabler(false);
}

function setConnectButton(connect) {
  gConnectButton.label =                   connect ? gStrbundle.getString("connectButton") : gStrbundle.getString("disconnectButton");
  gConnectButton.setAttribute('command',   connect ? 'cmd_connect'                         : 'cmd_disconnect');
  gConnectButton.setAttribute('accesskey', connect ? gStrbundle.getString("connectAccess") : gStrbundle.getString("disconnectAccess"));
}

function accountButtonsDisabler(enable) {
  $('editMenuItem').setAttribute(  "disabled", enable);
  $('deleteMenuItem').setAttribute("disabled", enable);

  if (!gFtp.isConnected) {
    $('connectbutton').disabled = enable;
  }

  if (gSiteManager) {
    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == gAccountField.value) {
        $('saveMenuItem').setAttribute("disabled", !gSiteManager[x].temporary);
        break;
      }
    }
  } else {
    $('saveMenuItem').setAttribute("disabled", true);
  }
}

function connectedButtonsDisabler() {
  $('abortbutton').disabled =                   !gFtp.isConnected;
  $('retrieveButton').disabled =                !gFtp.isConnected;
  $('storeButton').disabled =                   !gFtp.isConnected;
  $('remoteUpButton').disabled =                !gFtp.isConnected;
  $('remoteRefreshButton').disabled =           !gFtp.isConnected;
  $('searchRemote').disabled =                  !gFtp.isConnected;
  $('diffMenuItem').setAttribute(   "disabled", !gFtp.isConnected);
  $('recDiffMenuItem').setAttribute("disabled", !gFtp.isConnected);
  $('customMenuItem').setAttribute( "disabled", !gFtp.isConnected);
  $('quickMenuItem').setAttribute(  "disabled",  gFtp.isConnected);
  $('remotepath').setAttribute("disconnected",  !gFtp.isConnected);
  remoteDirTree.treebox.invalidate();
  remoteTree.treebox.invalidate();

  searchSelectType();
}

function loadSiteManager(pruneTemp, importFile) {
  // read gSiteManager data
  try {
    gAccountField.removeAllItems();

    if (!gFtp.isConnected) {
      gFtp.host         = "";
      gFtp.port         = 21;
      gFtp.security     = "";
      gFtp.login        = "";
      gFtp.password     = "";
      gFtp.passiveMode  = true;
      gFtp.initialPath  = "";
      gFtp.setEncoding("UTF-8");
      gAccount          = "";
      gDownloadCaseMode = 0;
      gUploadCaseMode   = 0;
      gWebHost          = "";
      gPrefix           = "";
      gRemotePath.value = "/";
    }

    var file;
    if (importFile) {
      file = importFile;
    } else {
      file = gProfileDir.clone();
      file.append("fireFTPsites.dat");
    }

    if (!file.exists() && !importFile) {
      gSiteManager = new Array();
    } else if (file.exists()) {
      var fstream  = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
      var sstream  = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
      fstream.init(file, 1, 0, false);
      sstream.init(fstream);

      var siteData = "";
      var str      = sstream.read(-1);

      while (str.length > 0) {
        siteData += str;
        str       = sstream.read(-1);
      }

      if (importFile) {
        try {
          var tempSiteManager = eval(siteData);
        } catch (ex) {
          error(gStrbundle.getString("badImport"));
          sstream.close();
          fstream.close();
          return;
        }

        var passCheck = false;
        var toUTF8    = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService);
        var key;
        for (var x = 0; x < tempSiteManager.length; ++x) {
          if (tempSiteManager[x].passcheck) {
            passCheck = true;
            var passwordObject       = new Object();
            passwordObject.returnVal = false;

            window.openDialog("chrome://fireftp/content/password2.xul", "password", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

            if (passwordObject.returnVal) {
              key = passwordObject.password;
            } else {
              sstream.close();
              fstream.close();
              return;
            }

            key = key ? key : "";
            if (rc4Decrypt(key, tempSiteManager[x].password) != "check123") {
              error(gStrbundle.getString("badPassword"));
              sstream.close();
              fstream.close();
              return;
            }
            break;
          }
        }

        for (var x = 0; x < tempSiteManager.length; ++x) {
          if (tempSiteManager[x].passcheck) {
            continue;
          }

          var found   = true;
          var count   = 0;
          var skip    = true;
          var account = tempSiteManager[x].account;

          while (found) {
            found = false;

            for (var y = 0; y < gSiteManager.length; ++y) {
              if (gSiteManager[y].account == account) {
                found = true;

                for (i in gSiteManager[y]) {                         // if it's the exact same object skip it
                  if (i != "password" && gSiteManager[y][i] != tempSiteManager[x][i]) {
                    skip = false;
                    break;
                  }
                }

                if (skip) {
                  break;
                }

                ++count;
                account = tempSiteManager[x].account + '-' + count.toString();
                break;
              }
            }

            if (skip) {
              break;
            }
          }

          if (skip && found) {
            continue;
          }

          if ((gSlash == "/" && tempSiteManager[x].localdir.indexOf("/") == -1) || (gSlash == "\\" && tempSiteManager[x].localdir.indexOf("\\") == -1)) {
            tempSiteManager[x].localdir = "";
            tempSiteManager[x].treesync = false;
          }

          if (passCheck) {
            tempSiteManager[x].password = rc4Decrypt(key, tempSiteManager[x].password);

            try {
              tempSiteManager[x].password = toUTF8.convertStringToUTF8(tempSiteManager[x].password, "UTF-8", 1);
            } catch (ex) {
              debug(ex);
            }
          }

          if (gPasswordMode) {
            try {                                                            // save username & password
              var recordedHost  = (tempSiteManager[x].host.indexOf("ftp.") == 0 ? '' : "ftp.") + tempSiteManager[x].host;

              gPassManager.addUser(recordedHost, tempSiteManager[x].login, tempSiteManager[x].password);
            } catch (ex) {
              debug(ex);
            }
          }

          tempSiteManager[x].account = account;
          gSiteManager.push(tempSiteManager[x]);
        }
      } else {
        gSiteManager = eval(siteData);
      }

      if (gPasswordMode) {
        for (var x = 0; x < gSiteManager.length; ++x) {              // retrieve passwords from passwordmanager
          try {
            var host = { value : "" };    var login = { value : "" };    var password = { value : "" };
            gPassManagerIn.findPasswordEntry((gSiteManager[x].host.indexOf("ftp.") == 0 ? '' : "ftp.")
                                            + gSiteManager[x].host, gSiteManager[x].login, "", host, login, password);

            gSiteManager[x].password = password.value;
          } catch (ex) { }
        }
      }

      sstream.close();
      fstream.close();

      if (pruneTemp) {
        for (var x = gSiteManager.length - 1; x >= 0; --x) {
          if (gSiteManager[x].temporary) {
            gSiteManager.splice(x, 1);
          }
        }
      }

      for (var x = 0; x < gSiteManager.length; ++x) {
        gAccountField.appendItem(gSiteManager[x].account, gSiteManager[x].account);
      }
    }

    if (gSiteManager.length) {
      gAccountField.setAttribute("label", gStrbundle.getString("chooseAccount"));
    } else {
      gAccountField.setAttribute("label", gStrbundle.getString("noAccounts"));
    }

    accountButtonsDisabler(true);
  } catch (ex) {
    debug(ex);
  }
}

function saveSiteManager(exportFile) {
  try {                                                              // write gSiteManager out to disk
    var tempSiteManagerArray = new Array();

    for (var x = 0; x < gSiteManager.length; ++x) {
      tempSiteManagerArray.push(new cloneObject(gSiteManager[x]));
    }

    var key;
    if (exportFile) {
      var passwordObject       = new Object();
      passwordObject.returnVal = false;

      window.openDialog("chrome://fireftp/content/password2.xul", "password", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

      if (passwordObject.returnVal) {
        key = passwordObject.password;
      } else {
        return;
      }

      key = key ? key : "";
      tempSiteManagerArray.push({ account: "a", passcheck: "check123", password: "check123" });
    }

    var fromUTF8     = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter);
    fromUTF8.charset = "UTF-8";
    for (var x = 0; x < tempSiteManagerArray.length; ++x) {          // we don't save out the passwords, those are saved in the passwordmanager
      if (exportFile) {
        try {
          tempSiteManagerArray[x].password = fromUTF8.ConvertFromUnicode(tempSiteManagerArray[x].password) + fromUTF8.Finish();
        } catch (ex) {
          debug(ex);
        }

        tempSiteManagerArray[x].password = rc4Encrypt(key, tempSiteManagerArray[x].password);
      } else {
        tempSiteManagerArray[x].password = "";
      }
    }

    var file;
    if (exportFile) {
      file = exportFile;
    } else {
      file = gProfileDir.clone();
      file.append("fireFTPsites.dat");
    }

    var foutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    foutstream.init(file, 0x04 | 0x08 | 0x20, 0644, 0);
    tempSiteManagerArray.sort(compareAccount);
    foutstream.write(tempSiteManagerArray.toSource(), tempSiteManagerArray.toSource().length);
    foutstream.close();
  } catch (ex) {
    debug(ex);
  }
}

function importSites() {
  var nsIFilePicker   = Components.interfaces.nsIFilePicker;
  var fp              = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.defaultExtension = "dat";
  fp.appendFilter("FireFTP (*.dat)", "*.dat");
  fp.init(window, null, nsIFilePicker.modeOpen);
  var res = fp.show();

  if (res != nsIFilePicker.returnOK) {
    return;
  }

  var tempAccount = gAccountField.value;

  loadSiteManager(true, fp.file);
  saveSiteManager();                                                 // save site manager
  loadSiteManager();

  for (var x = 0; x < gSiteManager.length; ++x) {                    // select the new site
    if (gSiteManager[x].account == tempAccount) {
      gAccountField.selectedIndex = x;
      onAccountChange();
      break;
    }
  }
}

function exportSites() {
  var nsIFilePicker   = Components.interfaces.nsIFilePicker;
  var fp              = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.defaultString    = "fireFTPsites.dat";
  fp.defaultExtension = "dat";
  fp.appendFilter("FireFTP (*.dat)", "*.dat");
  fp.init(window, null, nsIFilePicker.modeSave);
  var res = fp.show();

  if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
    saveSiteManager(fp.file);
  }
}

/* RC4 symmetric cipher encryption/decryption
 * Copyright (c) 2006 by Ali Farhadi.
 * released under the terms of the Gnu Public License.
 * see the GPL for details.
 *
 * Email: ali[at]farhadi[dot]ir
 * Website: http://farhadi.ir/
 */

function rc4Encrypt(key, pt) {
	s = new Array();

	for (var i = 0; i < 256; ++i) {
		s[i] = i;
	}

	var j = 0;
	var x;

	for (i = 0; i < 256; ++i) {
		j    = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
		x    = s[i];
		s[i] = s[j];
		s[j] = x;
	}

	i = 0;
	j = 0;
	var ct = '';

	for (var y = 0; y < pt.length; ++y) {
		i    = (i + 1)    % 256;
		j    = (j + s[i]) % 256;
		x    = s[i];
		s[i] = s[j];
		s[j] = x;
		ct  += String.fromCharCode(pt.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
	}

	return ct;
}

function rc4Decrypt(key, ct) {
	return rc4Encrypt(key, ct);
}
