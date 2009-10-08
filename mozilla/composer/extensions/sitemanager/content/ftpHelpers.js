/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * Contributor(s):
 *   Fabien Cazenave <kaze@kompozer.net>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

// Note: these helpers have been designed to work with FireFTP's codebase.
// Many thanks to Mime Cuvalo for allowing Composer to use his code!

gFtp = new ftpMozilla(null);
//gFtp = new ftpMozilla(ftpObserver);
gFtp.appendLog = ftpAppendLog;
gFtp.error     = ftpErrorReport;
gFtp.debug     = function(ex) { dump(ex + "\n") };
/*
 *gFtp.errorConnectStr   = gStrbundle.getString("errorConn");
 *gFtp.errorXCheckFail   = gStrbundle.getString("errorXCheckFail");
 *gFtp.passNotShown      = gStrbundle.getString("passNotShown");
 *gFtp.l10nMonths        = gStrbundle.getString("months").split("|");
 *gTransferTypes         = new Array(gStrbundle.getString("auto"), gStrbundle.getString("binary"), gStrbundle.getString("ascii"));
 *gMonths                = gStrbundle.getString("months").split("|");
 */

function ftpConnect(publishData) {
  var reconnected = false;
  gFtp.host     = publishData.publishUrl.replace(/^ftp:\/*/, '').replace(/\/$/, '');
  gFtp.port     = publishData.ftpPort;
  gFtp.login    = publishData.username;
  gFtp.password = window.top.GetSavedPassword(publishData);

  // not all FTP servers use utf-8 yet, that's a pity (e.g. OVH still uses latin-1)
  // so we'll have to specify the server encoding in the prefs some day
  //gFtp.setEncoding("UTF-8");
  gFtp.setEncoding("ISO-8859-15");

  var newConnectedHost = gFtp.login + "@" + gFtp.host;
  if (!gFtp.isConnected) {
    gFtp.connect();
  }
  else if (newConnectedHost != gFtp.connectedHost) {
    // switching to a different host or different login
    //gFtp.disconnect();
    gFtp.connect();
  }
  gFtp.connectedHost = newConnectedHost;
}

function ftpCheckQueue() {
  // quick and ugly hack
  if (gFtp.eventQueue.length)
    setTimeout(ftpCheckQueue, 500);
  else
    EnableAllUI(true);
}

function ftpCheckDirectory(remoteDir) {
  // ensure remoteDir exists
  if ( remoteDir.length
   && (remoteDir != "/")
   && (remoteDir != gFtp.currentWorkingDir)
   && (remoteDir != gFtp.currentWorkingDir + "/")
  ) // the directory doesn't exist, we have to create it
    gFtp.makeDirectory(remoteDir);
}

function ftpUploadFile(localPath, remotePath, remoteDir) {
  // ensure remoteDir exists
  if ( remoteDir.length
   && (remoteDir != "/")
   && (remoteDir != gFtp.currentWorkingDir)
   && (remoteDir != gFtp.currentWorkingDir + "/")
  ) { // the directory doesn't exist, we have to create it
    var dirs = remoteDir.split("/");
    var dir  = "";
    for (var i = 1; i < dirs.length; i++) {
      dir += "/" + dirs[i];
      gFtp.makeDirectory(dir); // this will generate some error reports... nevermind
      //gFtp.changeWorkingDirectory(dir, function() { ftpCheckDirectory(dir); });
    }
  }

  // now we're sure the remote dir exists, we can upload the file
  gFtp.upload(localPath, remotePath, false, -1, ftpEndRequest);
}

function ftpListDirectory() {
  var l = gFtp.listData.length;
  var list = gFtp.currentWorkingDir;
  for (var i = 0; i < l; i++)
    list += "\n" + gFtp.listData[i].leafName;
  //gHelpers.trace(list);
  alert(list);
}

function ftpAppendLog(message, css, type) {
  // early way out if 'message' is null
  if (!message || !message.length)
    return;

  // append message to the <body> node in the FTP console
  var divNode = gDialog.ftpConsole.createElement("div");
  divNode.setAttribute("type", type);
  divNode.setAttribute("class", css);
  divNode.innerHTML = message.replace(/[\r\n]+/g, '<br>');
  gDialog.ftpConsole.body.appendChild(divNode);
}

function ftpErrorReport(msg) {
  ftpAppendLog(msg, "error", "error");
}

function ftpEndRequest() {
  gFtp.cleanup();
  EnableAllUI(true);
}

//
// Overriding functions in ComposerCommands.js
// see also lines 2074-2292 in ComposerCommands.js
//

/* experimental 'Publish' function, using a real FTP transfer
nsPublishCommand.doCommand = function(aCommand) {
    if (GetCurrentEditor())
    {
      var docUrl = GetDocumentUrl();
      var filename = GetFilename(docUrl);
      var publishData;

      if (filename)
      {
        // Try to get publish data from the document url
        publishData = CreatePublishDataFromUrl(docUrl);

        // If none, use default publishing site? Need a pref for this
        //if (!publishData)
        //  publishData = GetPublishDataFromSiteName(GetDefaultPublishSiteName(), filename);
      }

      if (!publishData)
      {
        // Show the publish dialog
        var publishData = {};
        window.ok = false;
        var oldTitle = GetDocumentTitle();
        window.openDialog("chrome://editor/content/EditorPublish.xul","_blank", 
                          "chrome,close,titlebar,modal", "", "", publishData);
        if (GetDocumentTitle() != oldTitle)
          UpdateWindowTitle();

        window.content.focus();
        if (!window.ok)
          return false;
      }

      if (publishData)
      {
        FinishHTMLSource();
        return ftpPublish(publishData);
      }
    }
    return false;
}
*/
