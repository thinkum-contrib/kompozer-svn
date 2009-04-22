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
 * The Original Code is Mozilla Communicator client code, released
 * March 31, 1998.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
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

var gPublishSiteData;
var gPublishDataChanged = false;
var gDefaultSiteIndex = -1;
var gDefaultSiteName;
var gPreviousDefaultSite;
var gPreviousTitle;
var gSettingsChanged = false;
var gSiteDataChanged = false;
var gAddNewSite = false;
var gCurrentSiteIndex = -1;
var gPasswordManagerOn = true;
var retValue;

// Dialog initialization code
function Startup()
{
  if (!GetCurrentEditor())
  {
    window.close();
    return;
  }

  if ("arguments" in window && window.arguments[0])
  {
    retValue = window.arguments[0];
  }

  gDialog.SiteList          = document.getElementById("SiteList");
  gDialog.SiteNameInput     = document.getElementById("SiteNameInput");
  gDialog.LocalPathInput    = document.getElementById("LocalPathInput");    // Kaze
  gDialog.PublishUrlInput   = document.getElementById("PublishUrlInput");
  gDialog.BrowseUrlInput    = document.getElementById("BrowseUrlInput");
  gDialog.BrowsePrefixInput = document.getElementById("BrowsePrefixInput"); // Kaze
  gDialog.UsernameInput     = document.getElementById("UsernameInput");
  gDialog.PasswordInput     = document.getElementById("PasswordInput");
  gDialog.PasvModeInput     = document.getElementById("PasvModeInput");     // Kaze
  gDialog.ipv6ModeInput     = document.getElementById("ipv6ModeInput");     // Kaze
  gDialog.SecurityInput     = document.getElementById("SecurityInput");     // Kaze
  gDialog.ftpPortInput      = document.getElementById("ftpPortInput");      // Kaze
  gDialog.TreeSyncInput     = document.getElementById("TreeSyncInput");     // Kaze
  gDialog.SavePassword      = document.getElementById("SavePassword");
  gDialog.SetDefaultButton  = document.getElementById("SetDefaultButton");
  gDialog.RemoveSiteButton  = document.getElementById("RemoveSiteButton");
  gDialog.OkButton          = document.documentElement.getButton("accept");

  gPublishSiteData     = GetPublishSiteData();
  gDefaultSiteName     = GetDefaultPublishSiteName();
  gPreviousDefaultSite = gDefaultSiteName;

  gPasswordManagerOn = GetBoolPref("signon.rememberSignons");
  gDialog.SavePassword.disabled = !gPasswordManagerOn;

  InitDialog();

  SetWindowLocation();
}

function InitDialog()
{
  // If there's no current site data, start a new item in the Settings panel
  if (!gPublishSiteData)
  {
    AddNewSite();
  }
  else
  {
    FillSiteList();

    // uncomment next code line if you want preselection of the default
    // publishing site
    InitSiteSettings(gDefaultSiteIndex);

    SetTextboxFocus(gDialog.SiteNameInput);
  }
}

function FillSiteList()
{
  // Prevent triggering SelectSiteList() actions
  gIsSelecting = true;
  ClearListbox(gDialog.SiteList);
  gIsSelecting = false;
  gDefaultSiteIndex = -1;

  // Fill the site list
  var count = gPublishSiteData.length;
  for (var i = 0; i < count; i++)
  {
    var name = gPublishSiteData[i].siteName;
    var item = gDialog.SiteList.appendItem(name);
    SetPublishItemStyle(item);
    if (name == gDefaultSiteName)
      gDefaultSiteIndex = i;
  }
}

function SetPublishItemStyle(item)
{
  // Display default site with bold style
  if (item)
  {
    if (item.getAttribute("label") == gDefaultSiteName)
      item.setAttribute("class", "bold");
    else
      item.removeAttribute("class");
  }
}

function AddNewSite()
{
  // Save any pending changes locally first
  if (!ApplyChanges())
    return;

  // Initialize Setting widgets to none of the selected sites
  InitSiteSettings(-1);
  gAddNewSite = true;

  SetTextboxFocus(gDialog.SiteNameInput);
}

function RemoveSite()
{
  if (!gPublishSiteData)
    return;

  var index = gDialog.SiteList.selectedIndex;
  var item;
  if (index != -1)
  {
    item = gDialog.SiteList.selectedItems[0];
    var nameToRemove = item.getAttribute("label");

    // Remove one item from site data array
    gPublishSiteData.splice(index, 1);
    // Remove item from site list
    gDialog.SiteList.clearSelection();
    gDialog.SiteList.removeItemAt(index);

    // Adjust if we removed last item and reselect a site
    if (index >= gPublishSiteData.length)
      index--;
    InitSiteSettings(index);

    if (nameToRemove == gDefaultSiteName)
    {
      // Deleting current default -- set to new selected item
      //  Arbitrary, but what else to do?
      SetDefault();
    }
    gSiteDataChanged = true;
  }
}

function SetDefault()
{
  if (!gPublishSiteData)
    return;

  var index = gDialog.SiteList.selectedIndex;
  if (index != -1)
  {
    gDefaultSiteIndex = index;
    gDefaultSiteName = gPublishSiteData[index].siteName;
    
    // Set bold style on new default
    var item = gDialog.SiteList.firstChild;
    while (item)
    {
      SetPublishItemStyle(item);
      item = item.nextSibling;
    }
  }
}

// Recursion prevention:
// Use when you don't want to trigger ApplyChanges and InitSiteSettings
var gIsSelecting = false;

function SelectSiteList()
{
  if (gIsSelecting)
    return;

  gIsSelecting = true;
  var newIndex = gDialog.SiteList.selectedIndex;

  // Save any pending changes locally first
  if (!ApplyChanges())
    return;

  InitSiteSettings(newIndex);

  gIsSelecting = false;
}

// Use this to prevent recursion in SelectSiteList
function SetSelectedSiteIndex(index)
{
  gIsSelecting = true;
  gDialog.SiteList.selectedIndex = index;
  gIsSelecting = false;
}

function InitSiteSettings(selectedSiteIndex)
{  
  // Index to the site we will need to update if settings changed
  gCurrentSiteIndex = selectedSiteIndex;
  
  SetSelectedSiteIndex(selectedSiteIndex);
  var haveData = (gPublishSiteData && selectedSiteIndex != -1);

  gDialog.SiteNameInput.value     = haveData ? gPublishSiteData[selectedSiteIndex].siteName     : "";
  gDialog.LocalPathInput.value    = haveData ? gPublishSiteData[selectedSiteIndex].localPath    : ""; // Kaze
  gDialog.PublishUrlInput.value   = haveData ? gPublishSiteData[selectedSiteIndex].publishUrl   : "";
  gDialog.BrowseUrlInput.value    = haveData ? gPublishSiteData[selectedSiteIndex].browseUrl    : "";
  gDialog.BrowsePrefixInput.value = haveData ? gPublishSiteData[selectedSiteIndex].browsePrefix : ""; // Kaze
  gDialog.UsernameInput.value     = haveData ? gPublishSiteData[selectedSiteIndex].username     : "";
  gDialog.PasvModeInput           = haveData ? gPublishSiteData[gCUrrentSiteIndex].passiveMode  : ""; // Kaze
  gDialog.ipv6ModeInput           = haveData ? gPublishSiteData[gCUrrentSiteIndex].IPv6         : ""; // Kaze
  gDialog.SecurityInput           = haveData ? gPublishSiteData[gCUrrentSiteIndex].security     : ""; // Kaze
  gDialog.ftpPortInput            = haveData ? gPublishSiteData[gCUrrentSiteIndex].ftpPort      : ""; // Kaze
  gDialog.TreeSyncInput           = haveData ? gPublishSiteData[gCUrrentSiteIndex].treeSync     : ""; // Kaze

  var savePassord = haveData && gPasswordManagerOn;
  gDialog.PasswordInput.value  = savePassord ? gPublishSiteData[selectedSiteIndex].password : "";
  gDialog.SavePassword.checked = savePassord ? gPublishSiteData[selectedSiteIndex].savePassword : false;

  gDialog.SetDefaultButton.disabled = !haveData;
  gDialog.RemoveSiteButton.disabled = !haveData;
  gSettingsChanged = false;
}

function onInputSettings()
{
  // TODO: Save current data during SelectSite1 and compare here
  //       to detect if real change has occurred?
  gSettingsChanged = true;
}

function ApplyChanges()
{
  if (gSettingsChanged && !UpdateSettings())
  {
    // Restore selection to previously current site
    SetSelectedSiteIndex(gCurrentSiteIndex);
    return false;
  }
  return true;
}

function UpdateSettings()
{
  // Validate and add new site
  var newName = TrimString(gDialog.SiteNameInput.value);
  if (!newName)
  {
    ShowInputErrorMessage(GetString("MissingSiteNameError"), gDialog.SiteNameInput);
    return false;
  }
  if (PublishSiteNameExists(newName, gPublishSiteData, gCurrentSiteIndex))
  {
    ShowInputErrorMessage(GetString("DuplicateSiteNameError").replace(/%name%/, newName));            
    SetTextboxFocus(gDialog.SiteNameInput);
    return false;
  }

  var newUrl = FormatUrlForPublishing(gDialog.PublishUrlInput.value);
  /* Kaze: a site is now allowed to have to publish URL
   *if (!newUrl)
   *{
   *  ShowInputErrorMessage(GetString("MissingPublishUrlError"), gDialog.PublishUrlInput);
   *  return false;
   *}
   */
  //if (!GetScheme(newUrl))
  if (newUrl && newUrl.length && !GetScheme(newUrl))
  {
    newUrl = "ftp://" + newUrl; 
    gDialog.PublishUrlInput.value = newUrl;
  }

  var siteUrl = FormatUrlForPublishing(gDialog.BrowseUrlInput.value);
  if (!GetScheme(siteUrl))
  {
    siteUrl = "http://" + siteUrl; 
    gDialog.BrowseUrlInput.value = siteUrl;
  }

  // Start assuming we're updating existing site at gCurrentSiteIndex
  var newSiteData = false;

  if (!gPublishSiteData)
  {
    // First time used - Create the first site profile
    gPublishSiteData = new Array(1);
    gCurrentSiteIndex = 0;
    newSiteData = true;
  }
  else if (gCurrentSiteIndex == -1)
  {
    // No currently-selected site,
    //  must be adding a new site
    // Add new data at the end of list
    gCurrentSiteIndex = gPublishSiteData.length;
    newSiteData = true;
  }
    
  if (newSiteData)
  {
    // Init new site profile
    gPublishSiteData[gCurrentSiteIndex] = {};
    gPublishSiteData[gCurrentSiteIndex].docDir = "";
    gPublishSiteData[gCurrentSiteIndex].otherDir = "";
    gPublishSiteData[gCurrentSiteIndex].dirList = [""];
    gPublishSiteData[gCurrentSiteIndex].previousSiteName = newName;
  }

  gPublishSiteData[gCurrentSiteIndex].siteName     = newName;
  gPublishSiteData[gCurrentSiteIndex].publishUrl   = newUrl;
  gPublishSiteData[gCurrentSiteIndex].browseUrl    = FormatUrlForPublishing(gDialog.BrowseUrlInput.value);
  gPublishSiteData[gCurrentSiteIndex].username     = TrimString(gDialog.UsernameInput.value);
  gPublishSiteData[gCurrentSiteIndex].password     = gDialog.PasswordInput.value;
  gPublishSiteData[gCurrentSiteIndex].savePassword = gDialog.SavePassword.checked;
  // Kaze: new prefs
  gPublishSiteData[gCurrentSiteIndex].localPath    = gDialog.LocalPathInput.value;
  gPublishSiteData[gCurrentSiteIndex].browsePrefix = gDialog.BrowsePrefixInput.value;
  gPublishSiteData[gCUrrentSiteIndex].passiveMode  = gDialog.PasvModeInput;
  gPublishSiteData[gCUrrentSiteIndex].IPv6         = gDialog.ipv6ModeInput;
  gPublishSiteData[gCUrrentSiteIndex].security     = gDialog.SecurityInput;
  gPublishSiteData[gCUrrentSiteIndex].ftpPort      = gDialog.ftpPortInput;
  gPublishSiteData[gCUrrentSiteIndex].treeSync     = gDialog.TreeSyncInput;

  if (gCurrentSiteIndex == gDefaultSiteIndex)
    gDefaultSiteName = newName;

  // When adding the very first site, assume that's the default
  if (gPublishSiteData.length == 1 && !gDefaultSiteName)
  {
    gDefaultSiteName = gPublishSiteData[0].siteName;
    gDefaultSiteIndex = 0;
  }

  FillSiteList();

  // Select current site in list  
  SetSelectedSiteIndex(gCurrentSiteIndex);

  // Signal saving data to prefs
  gSiteDataChanged = true;
  
  // Clear current site flags
  gSettingsChanged = false;
  gAddNewSite = false;

  return true;
}


function doHelpButton()
{
  //openHelp("comp-doc-publish-site-settings");
  openHelp("comp-doc-publish-settings-publish-settings"); // Kaze: this might have changed with Nvu/KompoZer?
}

function onAccept()
{
  retValue.cancelled = false;

  // Save any pending changes locally first
  if (!ApplyChanges())
    return false;

  if (gSiteDataChanged)
  {
    // Save all local data to prefs
    SavePublishSiteDataToPrefs(gPublishSiteData, gDefaultSiteName);
  }
  else if (gPreviousDefaultSite != gDefaultSiteName)
  {
    // only the default site was changed
    SetDefaultSiteName(gDefaultSiteName);
  }

  SaveWindowLocation();

  return true;
}

function onCancel()
{
  retValue.cancelled = true;
  SaveWindowLocation();
  return true;
}

function SelectSiteDirectory()
{
 	var nsIFilePicker = Components.interfaces.nsIFilePicker; // Kaze
  try {
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "foobar" /*dialog.bundle.getString("chooseFileDialogTitle")*/, nsIFilePicker.modeGetFolder);

    /* Kaze: this button is now used to select the local site directory path
     *if (fp.show() == nsIFilePicker.returnOK && fp.fileURL.spec && fp.fileURL.spec.length > 0)
     *  gDialog.PublishUrlInput.value = fp.fileURL.spec;
     */
    if (fp.show() == nsIFilePicker.returnOK && fp.file.path && fp.file.path.length > 0)
      gDialog.LocalPathInput.value = fp.file.path;
  }
  catch(ex) {
  }

  // Kaze: required with Gecko 1.8.1
  gSettingsChanged = true;
}
