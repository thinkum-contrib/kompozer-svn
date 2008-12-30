# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Nvu.
#
# The Initial Developer of the Original Code is
# Linspire Inc..
# Portions created by the Initial Developer are Copyright (C) 2004
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Daniel Glazman (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the LGPL or the GPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK ***** -->

const nsIFilePicker     = Components.interfaces.nsIFilePicker;
const FILEPICKER_CONTRACTID     = "@mozilla.org/filepicker;1";
var gPrefs;

function GetPrefsService()
{
  if (gPrefsService)
    return gPrefsService;

  try {
    gPrefsService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  }
  catch(ex) {
    dump("failed to get prefs service!\n");
  }

  return gPrefsService;
}

function GetPrefs()
{
  if (gPrefsBranch)
    return gPrefsBranch;

  try {
    var prefService = GetPrefsService();
    if (prefService)
      gPrefsBranch = prefService.getBranch(null);

    if (gPrefsBranch)
      return gPrefsBranch;
    else
      dump("failed to get root prefs!\n");
  }
  catch(ex) {
    dump("failed to get root prefs!\n");
  }
  return null;
}

function Startup()
{
  gDialog.useSystemSettingsHelpers = document.getElementById("useSystemSettingsHelpers");
  gDialog.externalBrowser          = document.getElementById("externalBrowser");
  gDialog.browserChooseFile        = document.getElementById("browserChooseFile");
  gDialog.externalImageEditor      = document.getElementById("externalImageEditor");
  gDialog.imageEditorChooseFile    = document.getElementById("imageEditorChooseFile");

  try {
    gPrefs = GetPrefs();
  }
  catch (e) {
    dump("can't get pref service!");
  }

#ifdef 0
#ifdef XP_UNIX
  if (gDialog.useSystemSettingsHelpers.value)
    UseSystemBrowser();
  else
    UseOwnBrowser();
#endif
#endif
}

#ifdef 0
function UseSystemBrowser()
{
  gDialog.externalBrowser.setAttribute("disabled", true);
  gDialog.browserChooseFile.setAttribute("disabled", true);
  if (gPrefs)
  {
    gPrefs.setCharPref("network.protocol-handler.app.http", "");
    gPrefs.setCharPref("network.protocol-handler.app.https", "");
    gPrefs.setCharPref("network.protocol-handler.app.ftp", "");
    gPrefs.setCharPref("network.protocol-handler.app.file", "");
  }
}

function UpdateExternalBrowser()
{
  if (gPrefs)
  {
    var filePath = gDialog.externalBrowser.value;
    gPrefs.setCharPref("network.protocol-handler.app.http",  filePath);
    gPrefs.setCharPref("network.protocol-handler.app.https", filePath);
    gPrefs.setCharPref("network.protocol-handler.app.ftp",   filePath);
    gPrefs.setCharPref("network.protocol-handler.app.file",  filePath);
  }
}

function UseOwnBrowser()
{
  gDialog.externalBrowser.removeAttribute("disabled");
  gDialog.browserChooseFile.removeAttribute("disabled");
  UpdateExternalBrowser();
}
#endif

function showConnections()
{
  openDialog("chrome://editor/content/pref-connection.xul", "", "centerscreen,chrome,modal=yes,dialog=yes");
}

function selectFile(e)
{
  if (!e.hasAttribute("location"))
    return;

  var fp = Components.classes[FILEPICKER_CONTRACTID]
                     .createInstance(nsIFilePicker);

  var prefutilitiesBundle = document.getElementById("bundle_prefutilities");
  var title = prefutilitiesBundle.getString("choosefile");
  fp.init(window, title, nsIFilePicker.modeOpen);
  fp.appendFilters(nsIFilePicker.filterAll);

  var ret = fp.show();
  if (ret == nsIFilePicker.returnOK) {
    var folderField = document.getElementById(e.getAttribute("location"));
    var filePath = unescape(fp.fileURL.filePath);
#ifdef XP_WIN
    filePath = filePath.substr(1).replace(/\//g, "\\");
#endif
    folderField.value = filePath;
  }
}
