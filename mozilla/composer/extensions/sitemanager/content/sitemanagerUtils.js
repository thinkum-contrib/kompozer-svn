function GetCurrentEditorFromSidebar()
{
  // Get the active editor from the <editor> tag
  // XXX This will probably change if we support > 1 editor in main Composer window
  //      (e.g. a plaintext editor for HTMLSource)

  // For dialogs: Search up parent chain to find top window with editor
  var editor;
  try {
    var editorElement = window.top.document.getElementById("content-frame");
    editor = editorElement.getEditor(editorElement.contentWindow);

    // Do QIs now so editor users won't have to figure out which interface to use
    // Using "instanceof" does the QI for us.
    editor instanceof Components.interfaces.nsIPlaintextEditor;
    editor instanceof Components.interfaces.nsIHTMLEditor;
  } catch (e) { dump (e)+"\n"; }

  return editor;
}

function _GetString(name)
{
  if (!gStringBundle)
  {
    try {
      var strBundleService =
          Components.classes["@mozilla.org/intl/stringbundle;1"].getService(); 
      strBundleService = 
          strBundleService.QueryInterface(Components.interfaces.nsIStringBundleService);

      gStringBundle = strBundleService.createBundle("chrome://editor/locale/sitemanager.properties"); 

    } catch (ex) {}
  }
  if (gStringBundle)
  {
    try {
      return gStringBundle.GetStringFromName(name);
    } catch (e) {}
  }
  return null;
}

function _GetUrlForPasswordManager(publishData)
{
  if (!publishData || !publishData.publishUrl)
    return false;

  var url;

  // For FTP, we must embed the username into the url for a site address
  // XXX Maybe we should we do this for HTTP as well???
  if (publishData.username && GetScheme(publishData.publishUrl) == "ftp")
    url = _InsertUsernameIntoUrl(publishData.publishUrl, publishData.username,
                                 window.top.GetSavedPassword(publishData));
  else
    url = publishData.publishUrl;

  // Strip off terminal "/"
  var len = url.length;
  if (len && url.charAt(len-1) == "\/")
    url = url.slice(0, len-1);
  
  return url;
}

function _InsertUsernameIntoUrl(urlspec, username, passwd)
{
  if (!urlspec || !username)
    return urlspec;

  try {
    var ioService = GetIOService();
    var URI = ioService.newURI(urlspec, GetCurrentEditorFromSidebar().documentCharacterSet, null);
    URI.username = username;
    URI.password = passwd;
    return URI.spec;
  } catch (e) {}

  return urlspec;
}

function _removeAllChildren(e)
{
  if (e)
  {
    var child = e.lastChild;
    while (child)
    {
      var tmp = child.previousSibling;
      e.removeChild(child);
      child = tmp;
    }
  }
}

function IsFileUrl(url)
{
  return (url.substr(0,4) == "file");
}

function GetSelectedItem(tree)
{
  if (tree.view.selection.count == 1)
    return tree.view.selection.currentIndex;
  else
    return -1;
}

function GetURLFromUrl(url)
{
  try {
    var URL = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURL);
    URL.spec = url;
    return URL;
  } catch (e) {
    return null;
  }
}

function AllowEvents(tree, enabled)
{
  if (enabled)
    tree.removeAttribute("allowevents");
  else
    tree.setAttribute("allowevents", false);
}

// Kaze's sandbox, self-stolen from NsmConText.
// NsmConText was my first extension. May it rest in peace...

function initSiteManagerContextMenu(popup) {
  var index = gDialog.SiteTree.view.selection.currentIndex;
  var item  = gFilteredItemsArray[index];

  gContextMenu.openRemote.hidden  = true;
  gContextMenu.openAsText.hidden  = true;
  gContextMenu.insertImage.hidden = true;
  gContextMenu.previewItem.hidden = true;
  gContextMenu.previewSep.hidden  = true;

  gContextMenu.openItem.removeAttribute("style");
  gContextMenu.insertImage.removeAttribute("style");

  if (item) {
    var disabled = (item.level == 0) ? "true" : "false";
    gContextMenu.renameItem.setAttribute("disabled", disabled);
    gContextMenu.removeItem.setAttribute("disabled", disabled);
    gContextMenu.createDirItem.setAttribute("disabled", "false");

    if (item.isContainer) {
      gContextMenu.openRemote.hidden = false;
      gContextMenu.openItem.removeAttribute("style");
    }
    else {
      if (IsSelectedByFilter("images", item.url)) {
        gContextMenu.insertImage.setAttribute("style", "font-weight: bold");
        gContextMenu.insertImage.hidden = false;
      } else {
        gContextMenu.openItem.setAttribute("style", "font-weight: bold");
      }

      if (IsSelectedByFilter("html", item.url)) {
        gContextMenu.openAsText.hidden  = false;
        gContextMenu.previewSep.hidden  = false;
        gContextMenu.previewItem.hidden = false;
      }
    }
  }
}

function OpenItem(helper) {
  var index = gDialog.SiteTree.view.selection.currentIndex;
  var item  = gFilteredItemsArray[index];
  var url   = item.url;

  if (!helper) {
    if (IsSelectedByFilter("html"), url) {
      EditDocument(url);
      return;
    }
    if (item.isContainer)
      helper = "file";
    else if (IsSelectedByFilter("images"), url)
      helper = "image";
    else if (IsSelectedByFilter("media"), url)
      helper = "media";
    else if (IsSelectedByFilter("text", url) || IsSelectedByFilter("css", url))
      helper = "text";
  }
  gHelpers.OpenUrlWith(url, helper);
}

function OpenRemote(helper) {
  var index    = gDialog.SiteTree.view.selection.currentIndex;
  var item     = gFilteredItemsArray[index];
  var rowIndex = item.realIndex;

  // Get related site item
  while (gItemsArray[rowIndex].level > 0)
    rowIndex--;
  var siteItem = gItemsArray[rowIndex];
  var siteName = siteItem.name;

  // get FTP url of the current item
  var count = gPublishSiteData.length;
  for (var i = 0; i < count; i++) {
    var publishData = gPublishSiteData[i];
    if (siteName == publishData.siteName)
      break;
  }
  var siteUrl = _GetUrlForPasswordManager(publishData) + "/" + publishData.browsePrefix;
  var url = item.url.replace(siteItem.url, siteUrl);

  if (!helper) {
    if (item.isContainer)
      gHelpers.OpenUrlWith(url, "ftp");
    else
      return; // TODO: open remote files in helper apps
  }
}

function InsertImage(url) {
  var publishData = window.top.CreatePublishDataFromUrl(url);

  if (!url || !url.length) {
    // get the current sitemanager item
    var index = gDialog.SiteTree.view.selection.currentIndex;
    url = gFilteredItemsArray[index].url;
  }

  if (publishData || IsFileUrl(url)) {
    if (publishData)
      url = publishData.browseUrl + publishData.docDir + publishData.filename;
    var editor = GetCurrentEditorFromSidebar();
    if (editor) {
      var imgElement = editor.createElementWithDefaults("img");
      imgElement.setAttribute("src", url);
      imgElement.setAttribute("alt", "");
      imgElement.setAttribute("border", "0");
      editor.insertElementAtSelection(imgElement, true);
    }
  }
  EnableAllUI(true);
}

function EditDocument(url) {
  var newTab = false;
  var prefs  = window.top.GetPrefs();

  if (!url || !url.length) {
    // get the current sitemanager item
    var index = gDialog.SiteTree.view.selection.currentIndex;
    url = gFilteredItemsArray[index].url;
  }

  try {
    newTab = prefs.getBoolPref("extensions.sitemanager.openInNewTab");
  } catch (e) {}
  window.top.editPage(url, window.top, true, newTab);
}

