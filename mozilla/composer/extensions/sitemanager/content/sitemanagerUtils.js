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

// Kaze's sandbox
function initSiteManagerContextMenu(popup) {
  var index = gDialog.SiteTree.view.selection.currentIndex;
  var item = gFilteredItemsArray[index];
  if (item) {
    var disabled = (item.level == 0) ? "true" : "false";
    document.getElementById("renameItem").setAttribute("disabled", disabled);
    document.getElementById("removeItem").setAttribute("disabled", disabled);
    document.getElementById("createDirItem").setAttribute("disabled", "false");
  }
}

