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
 * The Original Code is Nvu.
 *
 * The Initial Developer of the Original Code is
 * Linspire Inc..
 * Portions created by the Initial Developer are Copyright (C) 2003-2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), original author
 *   Fabien Cazenave (kaze@kompozer.net)
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

// cf. netwerk/bas/public/nsNetError.h
const ERROR_FTP_LOGIN  = 2152398869;
const ERROR_FTP_CWD    = 2152398870;
const ERROR_FTP_PASV   = 2152398871;
const ERROR_FTP_PWD    = 2152398872;
const ERROR_FTP_LIST   = 2152398873;

var gPublishSiteData;
var gItemsArray, gFilteredItemsArray;
var gNewItemsArray;
var gTreeView;

var gLastDirOpenOrClose = -1;

var gContextMenu;                   // Kaze
var gFilterRE;                      // Kaze
var gHelpers = window.top.gHelpers; // Kaze
var gUseSystemIcons = false;        // Kaze

function SetupTreeView()
{
  // does the Composer window already have an array for tree items?
  if (!window.top.gSiteManagerItemsArray)
  {
    // nope, let's create one
    window.top.gSiteManagerItemsArray = new Array();
  }
  // now we have one so use it
  gItemsArray = window.top.gSiteManagerItemsArray;

  // gFilteredItemsArray holds the items really visible in the tree
  // while gItemsArray has all of them, unfiltered
  if (gFilteredItemsArray)
    delete gFilteredItemsArray;
  gFilteredItemsArray = new Array();

  gTreeView = {
    // see https://developer.mozilla.org/en/XUL_Tutorial/Custom_Tree_Views
    rowCount : gFilteredItemsArray.length,

    getCellText : function(row,column)
    {
      // Kaze: replaced 'column' with 'column.id' because of Gecko 1.8.1
      if (column.id == "dirCol")
        return " "+gFilteredItemsArray[row].name;
      else if (column.id == "sizeCol")
        return gFilteredItemsArray[row].size;
      else if (column.id == "lastModifiedCol")
        return gFilteredItemsArray[row].lastModified;
    },

    setTree            : function(treebox)         { this.treebox = treebox; },
    isContainer        : function(row)             { return gFilteredItemsArray[row].isContainer; },
    isContainerOpen    : function(row)             { return gFilteredItemsArray[row].isContainerOpen; },
    isContainerEmpty   : function(row)             { return gFilteredItemsArray[row].isContainerEmpty; },
    isSeparator        : function(row)             { return false; },
    isSorted           : function(row)             { return false; },
    getLevel           : function(row)             { return gFilteredItemsArray[row].level; },
    getRowProperties   : function(row,props)       {},
    getCellProperties  : function(row,col,props)   {},
    getColumnProperties: function(colid,col,props) {},
    canDropBeforeAfter : function(index,before)    { return false; },
    canDropOn          : function(index)           { return false; },

    getImageSrc: function(row,col)
    {
      // Kaze: replaced 'col' with 'col.id' because of Gecko 1.8.1
      if (col.id != "dirCol" || !this.getLevel(row))
        return null;
      if (gFilteredItemsArray[row].isSymLink)
        return "chrome://editor/skin/icons/link.gif";
      if (gFilteredItemsArray[row].isContainerOpen)
        return "chrome://editor/skin/icons/directory-open.ico";
      if (gFilteredItemsArray[row].isContainer)
        return "chrome://editor/skin/icons/directory.ico";

      // Kaze: this is a real file, gotta get its icon
      if (gUseSystemIcons)
        return "moz-icon://file:///" + gFilteredItemsArray[row].name + "?size=16";
      else {
        // Let's use a predefined icon instead, at least it'll be cross-platform ;-)
        var name = gFilteredItemsArray[row].name;
        if (IsSelectedByFilter("html", name))
          return "chrome://editor/skin/icons/document-html.png";
        if (IsSelectedByFilter("css", name))
          return "chrome://editor/skin/icons/document-style.png";
        if (IsSelectedByFilter("images", name))
          return "chrome://editor/skin/icons/document-image.png";
        if (IsSelectedByFilter("media", name))
          return "chrome://editor/skin/icons/document-media.png";
        if (IsSelectedByFilter("text", name))
          return "chrome://editor/skin/icons/document-text.png";
        // file type not recognized by Composer, use default icon
        return "chrome://editor/skin/icons/document-blank.png";
      }
    },

    getParentIndex: function(rowIndex)
    {
      var rowLevel = this.getLevel(rowIndex);
      if (!rowLevel) return -1;
      while (this.getLevel(rowIndex) != rowLevel - 1)
        rowIndex--;
      return rowIndex;
    },

    hasNextSibling: function(row,nextrow)
    {
      var i = row + 1, l = gFilteredItemsArray.length;
      while (i < l)
      {
        if (this.getLevel(i) < this.getLevel(row))
          return false;
        else if (this.getLevel(i) == this.getLevel(row))
          return true;
        i++;
      }
      return false;
    },

    toggleOpenState: function(row)
    {
      if (this.isContainerOpen(row))
      {
        // let's remove the items from the filtered list
        var count = 1, level = this.getLevel(row);
        while (row+count < gFilteredItemsArray.length && this.getLevel(row+count) > level)
          count++;
        count--;
        gFilteredItemsArray.splice(row+1, count);

        // now we need to remove them also from the whole list
        var realRow = gFilteredItemsArray[row].realIndex;
        var realCount = 1;
        while (realRow+realCount < gItemsArray.length && gItemsArray[realRow+realCount].level > level)
          realCount++;
        realCount--;
        gItemsArray.splice(realRow+1, realCount);

        // unfortunately, the indexes starting at the parent row are now
        // incorrect. We need to update only real indexes for gItemsArray
        // since the objects are shared between gItemsArray and
        // gFilteredItemsArray... Thanks JavaScript:-)
        UpdateItemsArrayRealIndexes(gFilteredItemsArray[row].realIndex);

        // close the container 
        gFilteredItemsArray[row].isContainerOpen = false;
        // let the treeView redraw the +/- box
        //gDialog.SiteTree.treeBoxObject.invalidateRow(row);
        gDialog.SiteTree.boxObject.invalidateRow(row);
        // and tell it we removed some lines...
        //gDialog.SiteTree.treeBoxObject.rowCountChanged(row+1, -count);
        gDialog.SiteTree.boxObject.rowCountChanged(row+1, -count);
        var parentIndex = this.getParentIndex(row);
        if (parentIndex <= 0)
          parentIndex = 0;

        // keep the parent directory in mind for future use...
        gLastDirOpenOrClose = parentIndex;            
      }
      else
      {
        // disable UI and run the throbber
        EnableAllUI(false);
        // keep directory in mind for future use
        gLastDirOpenOrClose = row;
        if (IsFileUrl(gFilteredItemsArray[row].url))
        {
          // if that entry represents a local-HD directory
          OpenLocalDirectory(gFilteredItemsArray[row].url,
                             { row: row+1,
                               parentRow: row,
                               realRow: gFilteredItemsArray[row].realIndex + 1,
                               level: this.getLevel(row)+1
                             }
                            );
        }
        else
        {
          // or if it's FTP-based
          var foo = new FTPDirParser(gFilteredItemsArray[row].url,
                                     { row: row+1,
                                       parentRow: row,
                                       realRow: gFilteredItemsArray[row].realIndex + 1,
                                       level: this.getLevel(row)+1
                                     },
                                     AddFTPDirSubdirs, EndFtpRequest, ErrorFtpRequest);
        }
        // we need to tell treeView the open the directory
        gFilteredItemsArray[row].isContainerOpen = true;
        // and the rest of the update is done by EndFtpRequest
      }
    },

    // PRIVATE

    atomSvc: null,
    atomFiltered: null,

    addRow: function(aRequestData,
                     name, url, size, lastModified,
                     isContainer, isContainerOpen, isContainerEmpty, isSymLink,
                     level, hidden)
    {
      if (!gNewItemsArray)
        gNewItemsArray = new Array();

      var newItem = {
                      name: name,
                      url: url,
                      size: size,
                      lastModified: lastModified,
                      isContainer: isContainer,
                      isContainerOpen: isContainerOpen,
                      isContainerEmpty: isContainerEmpty,
                      isSymLink: isSymLink,
                      level: level,
                      hidden: hidden,
                      realIndex: 0
                    };
       // we just push a data to a temporary array
       gNewItemsArray.push(newItem);
    },
  }; // gTreeView
}

// Dialog initialization code
function Startup()
{
  // Kaze: when Composer starts with an HTML page (command line argument),
  // the editor isn't ready but the sidebar is already loaded
  // - thus leading to an error. So let's disable this test.
  /*
   *if (!GetCurrentEditorFromSidebar()) {
   *  dump("Publish: No editor or return data object not supplied\n");
   *  window.close();
   *  return;
   *}
   */

  gDialog.SiteTree              = document.getElementById("SiteTree");
  gDialog.SiteDropDown          = document.getElementById("SiteDropDown");
  gDialog.SiteList              = document.getElementById("SiteList");
  gDialog.DirectoryList         = document.getElementById("DirectoryList");
  gDialog.FilterDropDown        = document.getElementById("FilterDropDown");
  gDialog.treeViewCheckbox      = document.getElementById("treeViewCheckbox");
  gDialog.dirHierarchy          = document.getElementById("dirHierarchy");
  gDialog.dirHierarchyPopup     = document.getElementById("dirHierarchyPopup");

  gDialog.reloadButton          = document.getElementById("reloadButton");
  gDialog.renameButton          = document.getElementById("renameButton");
  gDialog.createDirButton       = document.getElementById("createDirButton");
  gDialog.removeFileOrDirButton = document.getElementById("removeFileOrDirButton");
  gDialog.stopButton            = document.getElementById("stopButton");
  gDialog.mainBox               = document.getElementById("mainBox");
  gDialog.tabBox                = document.getElementById("sitemanagerTabbox");                  // Kaze
  gDialog.ftpConsole            = document.getElementById("cmdLog").contentWindow.document;      // Kaze

  gDialog.progressmeter         = document.getElementById("progressmeter");

  gDialog.bundle                = document.getElementById("siteManagerBundle");

  // Kaze: gContextMenu is added to handle the sitemanager context menu
  gContextMenu = {
    openItem      : document.getElementById("openItem"),
    openRemote    : document.getElementById("openRemote"),
    openAsText    : document.getElementById("openAsText"),
    insertImage   : document.getElementById("insertImage"),
    previewItem   : document.getElementById("previewItem"),
    previewSep    : document.getElementById("previewSeparator"),
    renameItem    : document.getElementById("renameItem"),
    removeItem    : document.getElementById("removeItem"),
    createDirItem : document.getElementById("createDirItem")
  }

  // Kaze: setup the file filters
  SetupTreeFilters();

  SetupTreeView();
  if (!window.top.gSiteManagerItemsArray.length) {
    // if the global items array is empty, we assume the site manager was
    // never open before and we re-init the whole thing
    FillSiteList();
  } else {
    // let's redisplay what we had before
    FilterAllItems();
  }

  // update the filter state
  if (window.top.gSiteManagerCurrentFilter != "all")
    gDialog.FilterDropDown.value = window.top.gSiteManagerCurrentFilter;

  // finish the setup
  SetupTree();

  if (SiteManagerNotificationHandler)
    window.top.gSiteManagerNotificationHandler = SiteManagerNotificationHandler;

  SetWindowLocation();

  window.top.OnSidebarLoad();
}

function onSelectLocalRemote(tabbox) { // Kaze
  // disabled at the moment
  //tabbox.selectedIndex = 0;
  //return;

  // note: (tabbox.selectedIndex > 0) <=> remote view
  // TODO: don't initialize the site tree if the tab hasn't been changed
  SetupTreeView();
  FillSiteList();
  FilterAllItems();
  SetupTree();
}

function SetupTree()
{
  gTreeView.atomsvc      = Components.classes["@mozilla.org/atom-service;1"]
                                     .getService(Components.interfaces.nsIAtomService);
  gTreeView.atomFiltered = gTreeView.atomsvc.getAtom("filtered");
  gDialog.SiteTree.view  = gTreeView ;

  // yeah man, let the user see the sites right now
  //gDialog.SiteTree.treeBoxObject.rowCountChanged(0, gFilteredItemsArray.length);
  gDialog.SiteTree.boxObject.rowCountChanged(0, gFilteredItemsArray.length);
}

function FillSiteList()
{
  // Fill the site lists
  var count = 0;
  gPublishSiteData = window.top.GetPublishSiteData();

  if (gPublishSiteData)
    count = gPublishSiteData.length;
  var i;

  if (!count)
    return;

  if (window.top.gSiteManagerItemsArray)
    delete window.top.gSiteManagerItemsArray;
  if (gFilteredItemsArray)
    delete gFilteredItemsArray;
  window.top.gSiteManagerItemsArray = new Array();
  gItemsArray = window.top.gSiteManagerItemsArray;

  for (i = 0; i < count; i++) {
    var name = gPublishSiteData[i].siteName;
    //var siteUrl = _GetUrlForPasswordManager(gPublishSiteData[i]);
    // Kaze: select the URL that corresponds to the selected tab
    var siteUrl = gDialog.tabBox.selectedIndex ? 
      _GetUrlForPasswordManager(gPublishSiteData[i]) : gHelpers.path2url(gPublishSiteData[i].localPath);

    gTreeView.addRow(null,
                     name,
                     siteUrl,
                     "",
                     "",
                     true,
                     false,
                     false,
                     false,
                     0,
                     false);
  }

  // let's push the new dirs to the whole items array
  for (i=0; i < gNewItemsArray.length; i++) {
    gNewItemsArray[i].realIndex = i;
    gItemsArray.push(gNewItemsArray[i]);
  }

  // nullify the temporary array created by gTreeView.addRow()
  gNewItemsArray = null;
  // create the filtered array and update
  FilterAllItems();
}

function TweakSiteSettings()
{
  var junk = { cancelled: false };
  window.top.openDialog("chrome://editor/content/EditorPublishSettings.xul","_blank", "chrome,close,titlebar,modal", junk);

  if (!junk.cancelled)
  {
    // the sites' list was changed, redisplay the whole thing
    var n = gFilteredItemsArray.length;
    gFilteredItemsArray.splice(0, n);
    gItemsArray.splice(0, gItemsArray.length);
    // we truncated both global and filtered items arrays
    //gDialog.SiteTree.treeBoxObject.rowCountChanged(0, -n)
    gDialog.SiteTree.boxObject.rowCountChanged(0, -n)

    // now re-fill the sites list
    FillSiteList();
    // and tell the treeView to update
    //gDialog.SiteTree.treeBoxObject.rowCountChanged(0, gFilteredItemsArray.length)
    gDialog.SiteTree.boxObject.rowCountChanged(0, gFilteredItemsArray.length)
  }
}

function EnableAllUI(enabled)
{
  if (enabled)
  {
    //AllowEvents(gDialog.SiteTree, false);
    gDialog.SiteDropDown.removeAttribute("disabled");
    gDialog.DirectoryList.removeAttribute("disabled");
    gDialog.FilterDropDown.removeAttribute("disabled");

    gDialog.reloadButton.removeAttribute("disabled");
    gDialog.renameButton.removeAttribute("disabled");
    gDialog.createDirButton.removeAttribute("disabled");
    gDialog.removeFileOrDirButton.removeAttribute("disabled");

    gDialog.stopButton.setAttribute("disabled", "true");

    window.setCursor("auto");
    //gDialog.mainBox.style.removeProperty("cursor");
    gDialog.progressmeter.className = "";
  }
  else
  {
    //AllowEvents(gDialog.SiteTree, true);
    gDialog.SiteDropDown.setAttribute("disabled", "true");
    gDialog.DirectoryList.setAttribute("disabled", "true");
    gDialog.FilterDropDown.setAttribute("disabled", "true");

    gDialog.reloadButton.setAttribute("disabled", "true");
    gDialog.renameButton.setAttribute("disabled", "true");
    gDialog.createDirButton.setAttribute("disabled", "true");
    gDialog.removeFileOrDirButton.setAttribute("disabled", "true");

    gDialog.stopButton.removeAttribute("disabled");

    window.setCursor("wait");
    //gDialog.mainBox.style.setProperty("cursor", "wait", "");
    gDialog.progressmeter.className = "progress";
  }
}

function RemoveSubdirs(ti)
{
  _removeAllChildren(ti.lastChild);
}

function ResetFirstFileEntry()
{
  gFirstFileEntry = null;
}

function AddFTPDirSubdirs(url, dirEntry, aRQdata)
{
  var location = dirEntry.location;
  var newlocation, size, description;
  if (dirEntry)
  {
    if (dirEntry.type == cnsIDirIndex.TYPE_DIRECTORY)
      size = "";
    else
      size = dirEntry.size;
    description = dirEntry.description;
    newlocation = url + ( (url[url.length - 1] == "/") ?
                          "" : "/" )
                          + location;
  }

  gTreeView.addRow(aRQdata,
                   location,
                   newlocation,
                   size,
                   description,
                   (dirEntry.type == cnsIDirIndex.TYPE_DIRECTORY),
                   false,
                   false,
                   (dirEntry.type == cnsIDirIndex.TYPE_SYMLINK),
                   aRQdata.level,
                   false);
}

function EndFtpRequest(aRQdata)
{
  function compareEntries(a, b) {
    if (a.isContainer && !b.isContainer)
      return -1;
    else if (!a.isContainer && b.isContainer)
      return 1;

    var aName = a.name.toLowerCase();
    var bName = b.name.toLowerCase();
    if (aName < bName) return -1;
    else if (aName > bName) return 1;
    return 0;
  }

  if (!aRQdata)
  {
    ForgetAboutLastFtpRequest();
    EnableAllUI(true);
    return;
  }

  // early way out if this directory has no file in it
  if (!gNewItemsArray)
  {
    gFilteredItemsArray[aRQdata.parentRow].isContainerEmpty = true;
    //gDialog.SiteTree.treeBoxObject.invalidateRow(aRQdata.parentRow);
    gDialog.SiteTree.boxObject.invalidateRow(aRQdata.parentRow);

    ForgetAboutLastFtpRequest();
    EnableAllUI(true);
    return;
  }

  gNewItemsArray.sort(compareEntries);
  var row = aRQdata.realRow;
  var i, l = gNewItemsArray.length;
  for (i=0; i<l; i++) {
    gItemsArray.splice(row, 0, gNewItemsArray[i]);
    row++;
  }
  UpdateItemsArrayRealIndexes(aRQdata.realRow);

  var newFilteredItemsArray = new Array()
  row = aRQdata.row;
  l = gNewItemsArray.length;
  var n = 0;
  for (i=0; i<l; i++)
    if (gNewItemsArray[i].isContainer || !IsHiddenByFilter(window.top.gSiteManagerCurrentFilter, gNewItemsArray[i].name))
    {
      gFilteredItemsArray.splice(row, 0, gNewItemsArray[i]);
      row++;
      n++;
    }

  ForgetAboutLastFtpRequest();
  EnableAllUI(true);

  if (aRQdata && aRQdata.row != -1)
  {
    //FilterAllItems();
    if (gNewItemsArray.length)
    {
      gFilteredItemsArray[aRQdata.parentRow].isContainerEmpty = false;
      if (n)
        gDialog.SiteTree.boxObject.rowCountChanged(aRQdata.row, n);
        //gDialog.SiteTree.treeBoxObject.rowCountChanged(aRQdata.row, n);
    }
    else
    {
      gFilteredItemsArray[aRQdata.parentRow].isContainerEmpty = true;
    }
    //gDialog.SiteTree.treeBoxObject.invalidateRow(aRQdata.parentRow);
    gDialog.SiteTree.boxObject.invalidateRow(aRQdata.parentRow);
  }
  gNewItemsArray = null;
  return n;
}

function ErrorFtpRequest(url, status)
{
  var message = "";
  if (status == ERROR_FTP_LOGIN)
    message = _GetString("FtpLoginError");
  else if (status == ERROR_FTP_CWD)
    message = _GetString("FtpCwdError");
  else
    message = _GetString("FtpUnknownError");

  AlertWithTitle("FTP", message, window.top);

  EndFtpRequest({row:0, parentRow:0, level:0});
}

function stopCallback()
{
  DropFtpConnection();
  ForgetAboutLastFtpRequest();
  gFtp.abort(); // Kaze - FireFTP
  StopNavigation();
}

function StopNavigation()
{
  window.top.document.getElementById("tabeditor").stopWebNavigation(false);
  EndNavigation();
}
function EndNavigation()
{
  window.document.documentElement.removeAttribute("style");
  EnableAllUI(true);
}

function openFile(e)
{
  if (e.button != 0)
    return;

  var item = gFilteredItemsArray[GetSelectedItem(gDialog.SiteTree)];
  if (!item.isContainer)
  {
    var newTab = false; // default is false
    var prefs = window.top.GetPrefs()
    try {
      newTab = prefs.getBoolPref("extensions.sitemanager.openInNewTab"); // Kaze: pref has been renamed
      DEBUG ( "prefs found" );
    }
    catch (e) {};
    EnableAllUI(false);
    window.top.document.getElementById("tabeditor").endNavigationCallback = EndNavigation;

    var url = item.url;
#ifdef SITE_MANAGER_OPENS_WITH
    var publishData = window.top.CreatePublishDataFromUrl(url);
    if (publishData)
      url = publishData.browseUrl + publishData.docDir + publishData.filename;
#else
    if (!IsHiddenByFilter("images", url))
    {
      var publishData = window.top.CreatePublishDataFromUrl(url);
      if (publishData || IsFileUrl(url))
      {
        if (publishData)
          url = publishData.browseUrl + publishData.docDir + publishData.filename;
        var editor = GetCurrentEditorFromSidebar();
        if (editor)
        {
          var imgElement  = editor.createElementWithDefaults("img");
          imgElement.setAttribute("src", url);
          imgElement.setAttribute("alt", "");
          imgElement.setAttribute("border", "0");
          editor.insertElementAtSelection(imgElement, true);
        }
      }
      EnableAllUI(true);
      return;
    }
#endif
    window.top.editPage(url, window.top, true, newTab);
  }
}

function IsHiddenByFilter(filter, fileName)
{
  /*
   *if (filter == "html")
   *  var re = /\.html?$|\.shtml?$/i ;
   *else if (filter == "images")
   *  re = /\.gif$|\.png$|\.jpg$|\.jpeg$|\.ico$/i ;
   *return !re.test(fileName);
   */

  // Kaze: hide temp files
  if (/^\~/.test(fileName))
    return true;
    
  return !IsSelectedByFilter(filter, fileName);
}

function SelectsFilter(e)
{
  window.top.gSiteManagerCurrentFilter = e.value;
  gLastDirOpenOrClose = -1;
  var n = gFilteredItemsArray.length;
  FilterAllItems();
  //gDialog.SiteTree.treeBoxObject.rowCountChanged(0, - n);
  //gDialog.SiteTree.treeBoxObject.rowCountChanged(0, gFilteredItemsArray.length);
  gDialog.SiteTree.boxObject.rowCountChanged(0, - n);
  gDialog.SiteTree.boxObject.rowCountChanged(0, gFilteredItemsArray.length);
}

function FilterAllItems()
{
  delete gFilteredItemsArray;

  gFilteredItemsArray = new Array()
  var i, l = gItemsArray.length;
  for (i=0; i<l; i++)
    if (gItemsArray[i].isContainer || !IsHiddenByFilter(window.top.gSiteManagerCurrentFilter, gItemsArray[i].name))
      gFilteredItemsArray.push(gItemsArray[i]);
}

var siteManagerDndObserver = {

  onDragStart: function (evt , transferData, action){
    var selected = gFilteredItemsArray[GetSelectedItem(gDialog.SiteTree)];
    if (selected.isContainer)
      return false;

    var publishData = window.top.CreatePublishDataFromUrl(selected.url);
    var url  = selected.url;
    var URL  = GetURLFromUrl(url);
    var name = URL.fileName;

    if (publishData)
    {
      url = publishData.browseUrl + publishData.docDir + publishData.filename;
      name = publishData.filename;
    }
    if (!IsHiddenByFilter("images", name))
      var htmlText = '<img src="' +  url + '" alt="' + name + '">';
    else
      htmlText = '<a href="' +  url + '">' + url + "</a>";
    var plainText = url;

    transferData.data = new TransferData();
    transferData.data.addDataForFlavour("text/html", htmlText);
    transferData.data.addDataForFlavour("text/unicode", plainText);
  }
};

function NewSubDir()
{
  var index = GetSelectedItem(gDialog.SiteTree);
  var url;
  if (index >= 0)
  {
    var item = gFilteredItemsArray[index];
    if (item)
    {
      if (!item.isContainer)
      {
        index = gTreeView.getParentIndex(index);
        item = gFilteredItemsArray[index];
        url = item.url;
      }
      else
        url = item.url;
    }
  }
  else if (gLastDirOpenOrClose >= 0)
  {
    index = gLastDirOpenOrClose;
    item = gFilteredItemsArray[index];
    url = item.url;
  }
  else
  {
    // nothing we can do, all sites are closed...
    return;
  }

  // get a reference to the prompt service component.
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                      .getService(Components.interfaces.nsIPromptService);

  var result = {value:null};
  if (promptService.prompt(window,
                           gDialog.bundle.getString("ConfirmDirCreation"),
                           gDialog.bundle.getString("EnterDirName"),
                           result,
                           null,
                           {value:0}))
  {
    if (IsFileUrl(url))
    {
      file = GetFileFromURLSpec(url);
      file.append(result.value);
      //file.create(1, 0755); // Kaze: this creates a dir with wrong access rights on Linux
      file.create(1, 0777);   // Kaze: this creates a dir with 0755 access rights, *sigh*
      url += "/" + result.value;
      AppendNewDir(url, file.leafName, index);
    }
    else
    {
      url += "/" + result.value;
      createDirURLAsync(url, result.value, index);
      EnableAllUI(false);
    }
  }
}

function SelectItem(e)
{
  //if (gDialog.SiteTree.treeBoxObject.selection.count != 1)
  if (gDialog.SiteTree.view.selection.count != 1)
    return;
  //var index = gDialog.SiteTree.treeBoxObject.selection.currentIndex;
  var index = gDialog.SiteTree.view.selection.currentIndex;

  var item = gFilteredItemsArray[index];
  if (item.isContainer)
    gLastDirOpenOrClose = index;
  else
    gLastDirOpenOrClose = gTreeView.getParentIndex(index);
}

function AppendNewDir(aUrl, aDirName, aParentIndex)
{
  var item = gFilteredItemsArray[aParentIndex];
  var level = item.level;
  var index = aParentIndex + 1;
  while ( gFilteredItemsArray[index].level > level &&
          index < gFilteredItemsArray.length )
  {
    if (gFilteredItemsArray[index].level == level + 1 &&
        ((gFilteredItemsArray[index].isContainer && aDirName < gFilteredItemsArray[index].name) ||
         !gFilteredItemsArray[index].isContainer))
      break;
    index++;
  }

  var realIndex;
  if (index < gFilteredItemsArray.length)
    realIndex = gFilteredItemsArray[index].realIndex;
  else
    realIndex = gFilteredItemsArray[index-1].realIndex + 1;

  var rqData = { row: index,
                 realRow: realIndex,
               };

  gTreeView.addRow(rqData,
                   aDirName,
                   aUrl,
                   0,
                   "",
                   true,
                   false,
                   false,
                   false,
                   level+1,
                   false);
  gFilteredItemsArray.splice(index, 0, gNewItemsArray[0]);
  gItemsArray.splice(realIndex, 0, gNewItemsArray[0]);
  UpdateItemsArrayRealIndexes(realIndex);

  // nullify the temporary array created by gTreeView.addRow()
  gNewItemsArray = null;

  //gDialog.SiteTree.treeBoxObject.rowCountChanged(index, +1);
  gDialog.SiteTree.boxObject.rowCountChanged(index, +1);
  EnableAllUI(true);
}

function UpdateItemsArrayRealIndexes(aStartIndex)
{
  var i;
  for (i = aStartIndex; i < gItemsArray.length; i++)
    gItemsArray[i].realIndex = i;
}

function RefreshDirView()
{
  if (gLastDirOpenOrClose == -1)
    return;

  if (!gTreeView.isContainerOpen(gLastDirOpenOrClose))
    return;

  var row = gLastDirOpenOrClose;
  var count = 1, level = gFilteredItemsArray[row].level;
  while (row+count < gFilteredItemsArray.length && gFilteredItemsArray[row+count].level > level)
    count++;
  count--;

  var realRow = gFilteredItemsArray[row].realIndex;
  var realCount = 1;
  while (realRow+realCount < gItemsArray.length && gItemsArray[realRow+realCount].level > level)
    realCount++;
  realCount--;

  EnableAllUI(false);
  if (IsFileUrl(gFilteredItemsArray[row].url))
  {
    var tmp = gLastDirOpenOrClose;
    gTreeView.toggleOpenState(gLastDirOpenOrClose);
    gLastDirOpenOrClose = tmp;
    gTreeView.toggleOpenState(gLastDirOpenOrClose);
  }
  else
    var foo = new FTPDirParser(gFilteredItemsArray[row].url,
                               { row: row+1+count,
                                 parentRow: row,
                                 realRow: gFilteredItemsArray[row].realIndex + 1 + realCount,
                                 refreshCount: count,
                                 refreshRealCount: realCount,
                                 level: gFilteredItemsArray[row].level+1
                               },
                               AddFTPDirSubdirs, EndRefreshDir, ErrorFtpRequest);
}

function EndRefreshDir(aRQdata)
{
  // remove the old directory entries
  gFilteredItemsArray.splice(aRQdata.parentRow + 1, aRQdata.refreshCount);
  gItemsArray.splice(gFilteredItemsArray[aRQdata.parentRow].realIndex + 1, aRQdata.refreshRealCount);

  //gDialog.SiteTree.treeBoxObject.rowCountChanged(aRQdata.parentRow + 1, -aRQdata.refreshCount);
  gDialog.SiteTree.boxObject.rowCountChanged(aRQdata.parentRow + 1, -aRQdata.refreshCount);
  aRQdata.row     = aRQdata.parentRow + 1;
  aRQdata.realRow = gFilteredItemsArray[aRQdata.parentRow].realIndex + 1;
  EndFtpRequest(aRQdata);
}

function Rename()
{
  // get a reference to the prompt service component.
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                .getService(Components.interfaces.nsIPromptService);

  var index = GetSelectedItem(gDialog.SiteTree);
  if (index == -1)
    return;
  var item = gFilteredItemsArray[index];
  if (item.level == 0)
    return;

  var result = {value: item.name};
  if (promptService.prompt(window,
                           gDialog.bundle.getString("ConfirmRenaming"),
                           gDialog.bundle.getString("EnterNewName"),
                           result,
                           null,
                           {value: 0}))
  {
    var url = item.url;
    var URL = GetURLFromUrl(url);
    URL.fileName = result.value;

    if (URL.spec == item.url)
      return;
    if (IsFileUrl(url))
    {
      var localFile = GetLocalFileFromURLSpec(url);
      localFile.moveTo(null, result.value);

      item.url  = URL.spec;
      item.name = result.value;

      gItemsArray[item.realIndex].url  = item.url;
      gItemsArray[item.realIndex].name = item.name;
      //gDialog.SiteTree.treeBoxObject.invalidateRow(index);
      gDialog.SiteTree.boxObject.invalidateRow(index);
    }
    else
    {
      renameURLAsync(url, URL.path, index);
      //window.document.documentElement.setAttribute("style", "cursor: wait");
      EnableAllUI(false);
    }
  }
}

function RenameTo(aNewName, aIndex)
{
  var item = gFilteredItemsArray[aIndex];

  var url = item.url;
  var URL = GetURLFromUrl(url);
  URL.path = aNewName;

  item.name = URL.fileName;
  gItemsArray[item.realIndex].name = item.name;

  item.url = URL.spec;
  gItemsArray[item.realIndex].url = item.url;

  //gDialog.SiteTree.treeBoxObject.invalidateRow(aIndex);
  gDialog.SiteTree.boxObject.invalidateRow(aIndex);
}

function RemoveFileOrDir()
{
  // can we do that?
  var index = GetSelectedItem(gDialog.SiteTree);
  if (index == -1 || !gFilteredItemsArray[index].level)
    return;

  var item = gFilteredItemsArray[index];
  if (item.isContainer)
    RemoveDir(item);
  else
    DeleteFile(item);
}

function DeleteFile(aItem)
{
  // get a reference to the prompt service component.
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                      .getService(Components.interfaces.nsIPromptService);

  if (promptService.confirm(window, gDialog.bundle.getString("ConfirmDeletion"),
                            gDialog.bundle.getString("SureToDelete")))
  {
    var url  = aItem.url;
    if (IsFileUrl(url))
    {
      var localFile = GetLocalFileFromURLSpec(url);
      localFile.remove(false);
      DeleteSelectedItem();
    }
    else
    {
      deleteURLAsync(url);
      EnableAllUI(false);
    }
  }
}

function RemoveDir(aItem)
{
  // get a reference to the prompt service component.
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                      .getService(Components.interfaces.nsIPromptService);

  if (promptService.confirm(window,
                            gDialog.bundle.getString("ConfirmDirRemoval"),
                            gDialog.bundle.getString("SureToRemoveDir")))
  {
    var url  = aItem.url;
    if (IsFileUrl(url))
    {
      var localFile = GetLocalFileFromURLSpec(url);
      var dirEntries = localFile.directoryEntries;
      var removeAll = false;
      if (dirEntries.hasMoreElements())
      {
        while (dirEntries.hasMoreElements())
          var junk = dirEntries.getNext();

        if (promptService.confirm(window,
                                  gDialog.bundle.getString("RemoveDirAlert"),
                                  gDialog.bundle.getString("DirNotEmptyAlert")))
          removeAll = true;

      }
      localFile.remove(removeAll);
      DeleteSelectedItem();
    }
    else
    {
      removeDirURLAsync(url);
      EnableAllUI(false);
    }
  }
}

function DeleteSelectedItem()
{
  var index = GetSelectedItem(gDialog.SiteTree);
  if (index == -1)
    return;
  var item = gFilteredItemsArray[index];
  gItemsArray.splice(item.realIndex, 1);
  gFilteredItemsArray.splice(index, 1);
  //gDialog.SiteTree.treeBoxObject.rowCountChanged(index, -1);
  gDialog.SiteTree.boxObject.rowCountChanged(index, -1);

  EnableAllUI(true);
}

function SiteManagerNotificationHandler(aNotifData, aNotification)
{
  if (aNotification != 0)
    return;

  var ioService = window.top.GetIOService();
  var editor = GetCurrentEditorFromSidebar();
  var URI = ioService.newURI(aNotifData, editor.documentCharacterSet, null);
  URI instanceof Components.interfaces.nsIURL;
  var fileName = URI.fileName;
  URI.fileName = "";
  aNotifData = URI.spec;

  var l = gFilteredItemsArray.length;
  var found = false;
  var dirSpec = "";

  for (var i=0; i<l; i++)
  {
    if (gFilteredItemsArray[i].isContainer)
    {
      var urlspec = gFilteredItemsArray[i].url;

      var URI = ioService.newURI(urlspec, editor.documentCharacterSet, null);
      dirSpec = URI.spec;
      urlspec = StripUsernamePasswordFromURI(URI) + "/";

      if (urlspec == aNotifData)
      {
        found = true;
        break;
      }
    }
  }

  if (found && gFilteredItemsArray[i].isContainerOpen)
  {
    var selectedIndex = GetSelectedItem(gDialog.SiteTree);

    var item = gFilteredItemsArray[i];
    var level = item.level + 1;

    var rowIndex = i + 1;
    while (gFilteredItemsArray[rowIndex].level == level && rowIndex < gFilteredItemsArray.length)
      rowIndex ++;
    // we are going to insert just before rowIndex

    var realRowIndex = gFilteredItemsArray[i].realIndex + 1;
    while (gItemsArray[realRowIndex].level == level && realRowIndex< gItemsArray.length)
      realRowIndex++;
    // we are going to insert just before rowIndex

    var rqData = {realRow: realRowIndex , row: rowIndex};
    gTreeView.addRow(rqData,
                     fileName,
                     dirSpec + "/" + fileName,
                     0,
                     "",
                     false,
                     false,
                     false,
                     false,
                     level,
                     false);

    gFilteredItemsArray.splice(rowIndex, 0, gNewItemsArray[0]);
    gItemsArray.splice(realRowIndex, 0, gNewItemsArray[0]);
    UpdateItemsArrayRealIndexes(realRowIndex);

    // nullify the temporary array created by gTreeView.addRow()
    gNewItemsArray = null;

    //gDialog.SiteTree.treeBoxObject.rowCountChanged(rowIndex, +1);
    gDialog.SiteTree.boxObject.rowCountChanged(rowIndex, +1);
    gDialog.SiteTree.view.selection.select(rowIndex);
    //gDialog.SiteTree.treeBoxObject.ensureRowIsVisible(rowIndex);
    gDialog.SiteTree.boxObject.ensureRowIsVisible(rowIndex);
    gDialog.SiteTree.focus();
    EnableAllUI(true);
  }
}

// Kaze's sandbox

function SetupTreeFilters() {
  gFilterRE = new Array();

  // transform csv-list of file extensions in a regexp (much faster to parse)
  var prefs = window.top.GetPrefs();
  var filters = [ "html", "images", "media", "css", "text" ];
  var str, tmp, filterName;
  for (var i = 0; i < filters.length; i++) {
    filterName = filters[i];
    str = prefs.getCharPref("extensions.sitemanager.filter." + filterName);
    str = str.replace(/,[\s]*/g, '$|\.').replace(/\?/g, '.').replace(/\*/g, '.*');
    gFilterRE[filterName] = new RegExp('\.' + str + '$');
  }

  // we can also use the system icons instead
  gUseSystemIcons = prefs.getBoolPref("extensions.sitemanager.useSystemIcons");
}

function IsSelectedByFilter(filter, fileName)
{
  if (filter == "all")
    return true;

  var re = gFilterRE[filter];
  if (re)
    return re.test(fileName);
  else
    return false;
}

function openFile(e) {
  if (e.button != 0)
    return;
  
  var item = gFilteredItemsArray[GetSelectedItem(gDialog.SiteTree)];
  var url = item.url;

  // if the item is a folder, do nothing
  if (item.isContainer) {
    return;
  }

  // if the item is a HTML file, open in a new Composer
  if (IsSelectedByFilter("html", url)) {
    EditDocument(url);
    return;
  }

  // if the item is an image, insert in the current Composer
  if (IsSelectedByFilter("images", url)) {
    InsertImage(url);
    return;
  }

  // TODO: same thing with media files

  // if the item is a local file, open with an external application
  if (IsFileUrl(url)) {
    var helper = null;
    if (IsSelectedByFilter("text", url) || IsSelectedByFilter("css", url))
      helper = "text";
    else if (IsSelectedByFilter("media", url))
      helper = "media";

    if (helper) {
      // open local file with appropriate helper app
      var error = gHelpers.OpenUrlWith(url, helper);
      if (error)
        if (helper == "text")
          EditDocument(url);
      /*
       *try {
       *  gHelpers.OpenUrlWith(url, helper);
       *} catch (e) {
       *  EnableAllUI(false);
       *  window.top.document.getElementById("tabeditor").endNavigationCallback = EndNavigation;
       *  window.top.document.open(url, window.top, true, true);
       *}
       */
    }
    else {
      // open local file with system default
      gHelpers.OpenUrl(url);
    }
    return;
  }
  
}

function GetItemPublishData(item) {
  if (!gPublishSiteData) // we should raise an exception here
    return null;

  // get site item
  var rowIndex = item.realIndex;
  //~ while (gFilteredItemsArray[rowIndex].level > 0)
  while (gItemsArray[rowIndex].level > 0)
    rowIndex--;
  //~ var siteItem = gFilteredItemsArray[rowIndex];
  var siteItem = gItemsArray[rowIndex];

  // get related publish data
  var count = gPublishSiteData.length;
  var i = count - 1;
  while ((i >= 0) && (siteItem.name != gPublishSiteData[i].siteName))
    i--;

  return i<0 ? null : gPublishSiteData[i];
}

function uploadFileOrDir() {
  // cancel if no item is selected
  var index = GetSelectedItem(gDialog.SiteTree);
  if (index == -1)
    return;

  // cancel if this item has no publishData
  var item = gFilteredItemsArray[index];
  var publishData = GetItemPublishData(item);
  if (!publishData)
    return;

	alert("FTP connection");
  EnableAllUI(false);                      // disable the UI until the FTP transaction is done
  gDialog.ftpConsole.body.innerHTML = "";  // reset the FTP log window
  ftpConnect(publishData);                 // make sure we're connected to the related host

  var sitePath   = publishData.localPath;
  var localPath  = gHelpers.newLocalFile(item.url).path.replace("//", "/");
  var remotePath = localPath.replace(sitePath, "/").replace("\\", "/").replace("//", "/");

  if ((item.level == 0) || item.isContainer) // disable directories for now
    return;

  var remoteDir  = remotePath.replace(/\/[^\/]*$/, "");
  if (!remoteDir.length)
    remoteDir = "/";

  // ensure the destination directory exists before uploading the file
  //gFtp.changeWorkingDirectory(remoteDir, function() { ftpCheckDirectory(remoteDir); });
	alert(gFtp.eventQueue.length + "\nFTP upload: \n" + localPath + "\n" + remotePath + "\n" + remoteDir);
  gFtp.changeWorkingDirectory(remoteDir, function() { ftpUploadFile(localPath, remotePath, remoteDir); });

  //gFtp.list(remotePath, ftpListDirectory, true);
  //gFtp.list(remotePath.replace(/[^\/]$/, ""), ftpListDirectory);
  //gFtp.upload(localPath, remotePath, false, -1, ftpEndRequest);
  //new transfer().uploadHelper(localPath, remotePath);
  //new transfer().start(false, '', localPath, remotePath);

  //setTimeout(ftpCheckQueue, 500);     // will enable the UI as soon as the FTP queue is empty
}

