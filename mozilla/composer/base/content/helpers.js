/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is
 *   Fabien Cazenave <kaze@kompozer.net>
 *
 * Portions created by the Initial Developer are Copyright (C) 2001-2008
 * the Initial Developer. All Rights Reserved.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var gHelpers = {
/*
 * This is a simple file IO library, mostly inspired by Launchy
 *   it uses specific KompoZer preferences (= defaut helper apps)
 *   it works on all platforms but can't pass arguments on MacOS X
 */

  hidePassword : function(url) {
    return url.replace(/^(.*:\/\/.*):(.*)@/, "$1:******@");
  },
  
  url2path : function(url) {
    // taken from Launchy (io.js)
    const hasUnescape = (typeof(unescape)=="function");
    var path = url;
    
    if (/^file/i.test(url)) try {
      var uri = Components.classes['@mozilla.org/network/standard-url;1']
        .createInstance(Components.interfaces.nsIURL);
      var file = Components.classes['@mozilla.org/file/local;1']
        .createInstance(Components.interfaces.nsILocalFile);
      uri.spec = url;
        
      try { // normal OS
        file.initWithPath(uri.path);
        path = hasUnescape ? unescape(file.path) : file.path;
      } catch (e) {}
      try { // Widows sucks
        file.initWithPath(uri.path.replace(/^\//,"").replace(/\//g,"\\"));
        path = hasUnescape ? unescape(file.path) : file.path;
      } catch (e) {}
    } catch(e) {
      this.trace("could not get path from " + this.hidePassword(url));
    }
    
    return path;
  },

  path2url : function(path) {
    const hasUnescape = (typeof(unescape)=="function");
    var url = path;
    
    if (!(/^file/i).test(path)) try {
      var uri = Components.classes['@mozilla.org/network/standard-url;1']
        .createInstance(Components.interfaces.nsIURL);
      uri.filePath = path.replace(/\\/g, '/'); // Widows sucks
      //url = 'file://' + uri.spec + '/';
      url = 'file://' + uri.spec;
    } catch(e) {
      this.trace("could not get url from " + path);
    }
    
    return url;
  },

  unlink : function(url) {
    var file = this.newLocalFile(url);
    try {
      file.remove(false);
      return true;
    } catch(e) {
      return false;
    }
  },
  
  newLocalFile : function(url) {
    var filePath = this.url2path(url);
    /*
     *try {
     *  netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
     *} catch (e) {
     *  alert("Permission to save file was denied.");
     *}
     */
    try {
      var nsFile = Components.classes['@mozilla.org/file/local;1']
        .createInstance(Components.interfaces.nsILocalFile);
      nsFile.initWithPath(filePath);
    } catch(e) {
      this.trace("could not create LocalFile interface on " + FilePath);
    }
    return nsFile;
  },
  
  newProcess : function(appFile) {
    // more info about processes: http://www.xulplanet.com/references/xpcomref/comps/c_processutil1.html
    var process = null;
    
    //~ if (appFile.isFile() && appFile.isExecutable()) try { // on MacOS X, apps are folders (bug in launchy 4.0.0, apps.js, line 473)
    if (appFile.isExecutable()) try {
      process = Components.classes['@mozilla.org/process/util;1']
        .createInstance(Components.interfaces.nsIProcess);
      process.init(appFile);
    } catch(e) {
      this.trace("failed to create process.");
    }
    
    //~ process.kill();
    //~ process.abort();
    //~ process.stop();
    return process;
  },
  
  newMIMEInfo : function(dataFile) {
    var mimeInfo = null;
    
    //~ if (appFile.isFile() && appFile.isExecutable()) try { // on MacOS X, apps are folders (bug in launchy 4.0.0, apps.js, line 473)
    //~ if (appFile.isExecutable()) try {
    try {
      var mimeSvc = Components.classes['@mozilla.org/uriloader/external-helper-app-service;1']
        .getService(Components.interfaces.nsIMIMEService);
      mimeInfo = mimeSvc.getFromTypeAndExtension(dataFile, null);
    } catch(e) {
      this.trace("failed to create MIME service.");
    }
    
    return mimeInfo;
  },
  
  run : function(url, appPath, appArgs, blocking) {
    var result = 0;
    var appFile = this.newLocalFile(appPath);
    
    // nsIProcess
    if ((appArgs) || (/^http|^ftp/i.test(url)) || (blocking)) { // will NOT work on MacOS X, sorry :-(
      if (!appArgs)
        appArgs = new Array();
      appArgs.push(this.url2path(url));
      var len = appArgs.length;
      try {
        var process = this.newProcess(appFile);
        result = process.run(blocking, appArgs, len);
        if (len) appArgs[len-1] = this.hidePassword(appArgs[len-1]);
        this.trace("started application '" + appPath + "' with " + len + " params: '" + appArgs + "'");
      } catch(e) {
        if (len) appArgs[len-1] = this.hidePassword(appArgs[len-1]);
        this.trace("failed to run application '" + appPath + "' with " + len + " params: '" + appArgs + "'");
      }
    } 
    
    // nsIMIMEService
    else { // MacOS X hack: use nsIMIMEService if there is no other arguments than the *local* file to edit
      try { // taken from ViewSourceWith :-/
        var dataFile = this.newLocalFile(url);
        var mimeInfo = this.newMIMEInfo(dataFile);
        mimeInfo.alwaysAskBeforeHandling = false;
        mimeInfo.preferredAction = Components.interfaces.nsIMIMEInfo.useHelperApp;
        mimeInfo.preferredApplicationHandler = appFile;
        mimeInfo.launchWithFile(dataFile);
        this.trace("started application '" + appPath + "' on '" + url + "'");
      } catch(e) {
        this.trace("failed to run application '" + appPath + "' on '" + url + "'");
      }
    }
    
     return result;
  },

  OpenUrl: function(url) {              // open URL with system default app
    if (!url)
      url = GetDocumentUrl();
    try {
      // nsIMIMEService
      if (/^file:/i.test(url)) { 
        var dataFile = this.newLocalFile(url);
        dataFile.launch(); // doesn't work on Linux
        // using MIME type for local files (doesn't work on Linux either)
        //~ var mimeSvc = Components.classes['@mozilla.org/uriloader/external-helper-app-service;1']
          //~ .getService(Components.interfaces.nsIMIMEService);
        //~ var mimeInfo = this.newMIMEInfo(dataFile);
        //~ mimeInfo.alwaysAskBeforeHandling = false;
        //~ mimeInfo.preferredAction = Components.interfaces.nsIMIMEInfo.useSystemDefault;
        //~ mimeInfo.launchWithFile(dataFile);
      }
      // nsIExternalProtocolService
      else { // equivalent to loadExternalURL(url) for remote files
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                  .getService(Components.interfaces.nsIIOService);
        var uri = ioService.newURI(url, null, null);
        var extProtocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                                       .getService(Components.interfaces.nsIExternalProtocolService);
        extProtocolSvc.loadUrl(uri);
      }
      this.trace("opened file '" + this.hidePassword(url) + "'");
    } catch(e) {
      this.trace("failed to open file '" + this.hidePassword(url) + "'");
    }
    // this creates bugs in the tabeditor :-(
      //~ window.top.GetCurrentEditorElement().webNavigation.loadURI(url, // uri string
         //~ window.top.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE,     // load flags
         //~ null,                                         // referrer
         //~ null,                                         // post-data stream
         //~ null);
  },
  
  OpenUrlWith: function(url, helper) {  // open URL with preferred app
    // get path and args
    var usys, path, args;
    try { 
      usys = this.helpers.getBoolPref(helper + ".useSystem");
      path = this.helpers.getCharPref(helper + ".path");
      args = this.helpers.getCharPref(helper + ".args");
    } catch (e) {}
    
    // launch editor
    if (usys || !path || !path.length)  {
      // system default editor
      this.OpenUrl(url);
    } else {
      // user selected editor
      var argArray = (args != "") ? args.split(' ') : null;
      var result = this.run(url, path, argArray);
    }
  },
  
  Read : function(url)  {               // read data from disk - quick and dirty
    var file = this.newLocalFile(url);
    
    if ( file.exists() == false )
      return false;

    var is = Components.classes["@mozilla.org/network/file-input-stream;1"]
      .createInstance( Components.interfaces.nsIFileInputStream );
    is.init( file,0x01, 00004, null);
    
    var sis = Components.classes["@mozilla.org/scriptableinputstream;1"]
      .createInstance( Components.interfaces.nsIScriptableInputStream );
    sis.init( is );
    
    return sis.read( sis.available() );
  },
  
  Write : function(url, data) {         // write data to disk - quick and dirty
    var file = this.newLocalFile(url);
    
    if ( file.exists() == false ) {
      file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
    }
    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
      .createInstance( Components.interfaces.nsIFileOutputStream );
      
    outputStream.init( file, 0x04 | 0x08 | 0x20, 420, 0 );
    var result = outputStream.write(data, data.length );
    outputStream.close();
    
    return result;
  },
  
  // Helper applications - stored in KompoZer's preferences
  helpers: Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService)
                     .getBranch("editor.helpers."),

  IsHiddenByFilter: function(filter, fileName) {
    if (/\.([^\\\/]*)\.html$/i.test(fileName)) // hidden files (should match nvu2html.reTEMP)
      return true;
    else if (filter == "all")
       return false;
    else try {
      // transform csv-list of file extensions in a regexp (much faster to parse)
      var str = this.extFilters.getCharPref(filter).replace(/,[\s]*/g, '$|\.')
                                                   .replace(/\?/g, '.')
                                                   .replace(/\*/g, '.*');
      var re = new RegExp('\.' + str + '$');
      return (!re.test(fileName));
    } catch(e) {
      return false;
    }
  },

  // debug
  trace : function(message, sender) {
    if (!sender)
      sender = "FileIO";
    var CONSOLE_SERVICE = Components.classes['@mozilla.org/consoleservice;1']
                                    .getService(Components.interfaces.nsIConsoleService);
    try {
      CONSOLE_SERVICE.logStringMessage(sender + ": " + message);
    } catch(e) {}
  }

}

/* File I/O: flags
 *
 *  Example:
 *  var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
 *    .createInstance( Components.interfaces.nsIFileOutputStream );
 *  outputStream.init( file, 0x04 | 0x08 | 0x20, 420, 0 );
 *
 *  Open flags:
 *  #define PR_RDONLY       0x01
 *  #define PR_WRONLY       0x02
 *  #define PR_RDWR         0x04
 *  #define PR_CREATE_FILE  0x08
 *  #define PR_APPEND       0x10
 *  #define PR_TRUNCATE     0x20
 *  #define PR_SYNC         0x40
 *  #define PR_EXCL         0x80
 */

/* File I/O: modes
 *
 * CAVEAT: 'mode' is currently only applicable on UNIX platforms.
 * The 'mode' argument may be ignored by PR_Open on other platforms.
 *
 *   00400   Read by owner.
 *   00200   Write by owner.
 *   00100   Execute (search if a directory) by owner.
 *   00040   Read by group.
 *   00020   Write by group.
 *   00010   Execute by group.
 *   00004   Read by others.
 *   00002   Write by others
 *   00001   Execute by others.
 */

/* File picker: filters
 *
 *   PRInt16  modeOpen         = 0
 *   PRInt16  modeSave         = 1
 *   PRInt16  modeGetFolder    = 2
 *   PRInt16  modeOpenMultiple = 3
 */

/* File picker: filters
 *
 *   PRInt32  filterAll        = 1
 *   PRInt32  filterHTML       = 2
 *   PRInt32  filterText       = 4
 *   PRInt32  filterImages     = 8
 *   PRInt32  filterXML        = 16
 *   PRInt32  filterXUL        = 32
 *   PRInt32  filterApps       = 64
 */

/* File picker: return values
 *
 *   PRInt16  returnOK         = 0
 *   PRInt16  returnCancel     = 1
 *   PRInt16  returnReplace    = 2
 */
 
