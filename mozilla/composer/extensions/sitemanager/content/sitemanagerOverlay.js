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

var gFtp = new ftpMozilla(null);
var gSiteManagerUploadHandler = null;

//gFtp = new ftpMozilla(ftpObserver);
//gFtp.appendLog = ftpAppendLog;
//gFtp.error     = ftpErrorReport;
//gFtp.debug     = function(ex) { dump(ex + "\n") };
/*
 *gFtp.errorConnectStr   = gStrbundle.getString("errorConn");
 *gFtp.errorXCheckFail   = gStrbundle.getString("errorXCheckFail");
 *gFtp.passNotShown      = gStrbundle.getString("passNotShown");
 *gFtp.l10nMonths        = gStrbundle.getString("months").split("|");
 *gTransferTypes         = new Array(gStrbundle.getString("auto"), gStrbundle.getString("binary"), gStrbundle.getString("ascii"));
 *gMonths                = gStrbundle.getString("months").split("|");
 */

//
// Overriding functions in ComposerCommands.js
// see also lines 2074-2292 in ComposerCommands.js
//

/* experimental 'Publish' function, using a real FTP transfer
nsPublishCommand.doCommand = function(aCommand) {
  if (GetCurrentEditor())
    gSiteManagerUploadHandler(GetDocumentUrl());
} */

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
