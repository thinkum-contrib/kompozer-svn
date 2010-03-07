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
 * The Original Code is Mozilla Communicator client code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Pete Collins
 *   Brian King
 *   Daniel Glazman (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the NPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the NPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


/**** NAMESPACES ****/
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const NVU_NS = "http://disruptive-innovations.com/zoo/nvu";

// Each editor window must include this file
// Variables  shared by all dialogs:

// Object to attach commonly-used widgets (all dialogs should use this)
var gDialog = {};

// Bummer! Can't get at enums from nsIDocumentEncoder.h
// http://lxr.mozilla.org/seamonkey/source/content/base/public/nsIDocumentEncoder.h#111
var gStringBundle;
var gIOService;
var gPrefsService;
var gPrefsBranch;
var gFilePickerDirectory;

var gOS = "";
const gWin  = "Win";
const gUNIX = "UNIX";
const gMac  = "Mac";

const kWebComposerWindowID  = "editorWindow";
const kMailComposerWindowID = "msgcomposeWindow";

var gIsHTMLEditor;

// Kaze: gTabEditor is a wrapper for all file IO functions
// use this to be sure Composer will watch modified files!
// This can be easily overlaid by extensions to tweak the way Composer saves files.
var gTabEditor = {
  // properties
  urls : new Array(), // URL indexes
  time : new Array(), // lastModified
  focus: true,

  // private methods
  getURL: function() {
    //return unescape(GetDocumentUrl());
    return GetDocumentUrl();
  },

  getIndex: function(url) {
    var url = url ? url : this.getURL();
    // look for the current url in the 'urls' array
    var found = false;
    for (var i = 0; i < this.urls.length; i++)
      if (this.urls[i] == url) {
        found = true;
        break;
      }
    return (found ? i : -1);
  },

  store: function(url) {
    url = url ? url : this.getURL();
    // get "last modified" time for the current url
    try {
      var file = gHelpers.newLocalFile(url);
      var lastMod = file.lastModifiedTime;
    } catch(e) {
      gHelpers.trace(e, file.path);
      return 0;
    }
    // look for the current url in the 'urls' array
    var found = false;
    for (var i = 0; i < this.urls.length; i++)
      if (this.urls[i] == url) {
        found = true;
        this.time[i] = lastMod;
        break;
      }
    if (!found) {
      this.urls.push(url);
      this.time.push(lastMod);
    }
    return lastMod;
  },

  find: function() {
    var url = this.getURL();
    // get last modification date
    var lastMod = 0;
    for (var i = 0; i < this.urls.length; i++)
      if (this.urls[i] == url) {
        lastMod = this.time[i];
        break;
      }
    return lastMod;
  },

  // public methods
  LoadDocument: function(url) {
    if (!url) url = this.getURL();
    EditorLoadUrl(url);
  },

  SaveDocument: function(aSaveAs, aSaveCopy, aMimeType) {
    this.focus = false;
    var url    = GetDocumentUrl();
    // always save text documents as text/plain
    if (this.IsTextDocument())
      aMimeType = "text/plain";
    // XXX ugly hack for HTML fragments
    if (this.IsHtmlFragment()) {
      gHelpers.Write(url, GetBodyElement().innerHTML);
      GetCurrentEditor().resetModificationCount();
    }
    else { // Save the document (Composer function)
      var result = SaveDocument(aSaveAs, aSaveCopy, aMimeType);
      if (!result)
        return;
    }
    // update URL if saved under a different name/location
    if (aSaveAs) {
      var index = this.getIndex(url);
      url = GetDocumentUrl(); // = new url
      this.urls[index] = url;
      UpdateWindowTitle();
    }
    // store modification date
    //this.store(unescape(url));
    this.store(url);
    this.focus = true;

    return result;
  },

  CloseDocument: function(url) {
    if (!url) url = this.getURL();

    // remove entry
    for (var i = 0; i < this.urls.length; i++)
      if (this.urls[i] == url) {
        this.urls.splice(i, 1);
        this.time.splice(i, 1);
        break;
      }
    return;
  },

  CheckModified: function() {
    var url = this.getURL();
    if ( IsUrlAboutBlank(url) || (GetScheme(url) != "file") || (!this.focus) )
      return;

    // test if the file has been modified
    lastMod = this.find();
    current = this.store();
    this.focus = false;
    if ( (lastMod > 0) && (lastMod != current) ) {
      // file has been modified, ask whether to accept or reject modifications
      if (ConfirmWithTitle(null, GetString("ModifiedDocumentWarning"),
                                 GetString("ModifiedDocumentAccept"),
                                 GetString("ModifiedDocumentDiscard") )
      )
      { // Accept changes
        CancelHTMLSource();           // useless?
        this.LoadDocument(url);       // reload document in Composer (= nsRevertCommand.doCommand();)
      }
      else { // Discard changes
        nsSaveCommand.doCommand();    // save Composer's document to discard changes
      }
    }
    this.focus = true;

    // truncate this.files if needed (barbarian's garbage collector)
    var tabeditor = document.getElementById("tabeditor");
    var nTabs  = tabeditor.mTabpanels.childNodes.length;
    var n      = this.urls.length;
    if (nTabs < n) {
      this.urls.splice(nTabs, n - nTabs);
      this.time.splice(nTabs, n - nTabs);
    }
    if (n == 0)
      this.store(url);
      //this.store(unescape(url));
    return;
  },

  IsTextDocument: function() {
    try {
      if (GetCurrentEditor().document.getElementById("_moz_text_document"))
        return true;
    } catch(e) { // no editor found
      return false;
    }
  },

  IsHtmlFragment: function() {
    try {
      if (GetCurrentEditor().document.getElementById("_moz_html_fragment"))
        return true;
    } catch(e) { // no editor found
      return false;
    }
  }
}

/************* Message dialogs ***************/

function AlertWithTitle(title, message, parentWindow)
{
  if (!parentWindow)
    parentWindow = window;

  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
  promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);

  if (promptService)
  {
    if (!title)
      title = GetString("Alert");

    // "window" is the calling dialog window
    promptService.alert(parentWindow, title, message);
  }
}

// Optional: Caller may supply text to substitue for "Ok" and/or "Cancel"
function ConfirmWithTitle(title, message, okButtonText, cancelButtonText)
{
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
  promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);

  if (promptService)
  {
    var okFlag = okButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_OK;
    var cancelFlag = cancelButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_CANCEL;

    return promptService.confirmEx(window, title, message,
                            (okFlag * promptService.BUTTON_POS_0) +
                            (cancelFlag * promptService.BUTTON_POS_1),
                            okButtonText, cancelButtonText, null, null, {value:0}) == 0;
  }
  return false;
}

/************* String Utilities ***************/

function GetString(name)
{
  if (!gStringBundle)
  {
    try {
      var strBundleService =
          Components.classes["@mozilla.org/intl/stringbundle;1"].getService(); 
      strBundleService = 
          strBundleService.QueryInterface(Components.interfaces.nsIStringBundleService);

      gStringBundle = strBundleService.createBundle("chrome://editor/locale/editor.properties"); 

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

function TrimStringLeft(string)
{
  if(!string) return "";
  return string.replace(/^\s+/, "");
}

function TrimStringRight(string)
{
  if (!string) return "";
  return string.replace(/\s+$/, '');
}

// Remove whitespace from both ends of a string
function TrimString(string)
{
  if (!string) return "";
  return string.replace(/(^\s+)|(\s+$)/g, '')
}

function IsWhitespace(string)
{
  return /^\s/.test(string);
}

function TruncateStringAtWordEnd(string, maxLength, addEllipses)
{
  // Return empty if string is null, undefined, or the empty string
  if (!string)
    return "";

  // We assume they probably don't want whitespace at the beginning
  string = string.replace(/^\s+/, '');
  if (string.length <= maxLength)
    return string;

  // We need to truncate the string to maxLength or fewer chars
  if (addEllipses)
    maxLength -= 3;
  string = string.replace(RegExp("(.{0," + maxLength + "})\\s.*"), "$1")

  if (string.length > maxLength)
    string = string.slice(0, maxLength);

  if (addEllipses)
    string += "...";
  return string;
}

// Replace all whitespace characters with supplied character
// E.g.: Use charReplace = " ", to "unwrap" the string by removing line-end chars
//       Use charReplace = "_" when you don't want spaces (like in a URL)
function ReplaceWhitespace(string, charReplace)
{
  return string.replace(/(^\s+)|(\s+$)/g,'').replace(/\s+/g,charReplace)
}

// Replace whitespace with "_" and allow only HTML CDATA
//   characters: "a"-"z","A"-"Z","0"-"9", "_", ":", "-", ".",
//   and characters above ASCII 127
function ConvertToCDATAString(string)
{
  return string.replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_\.\-\:\u0080-\uFFFF]+/g,'');
}

function GetSelectionAsText()
{
  try {
    return GetCurrentEditor().outputToString("text/plain", 1); // OutputSelectionOnly
  } catch (e) {}

  return "";
}


/************* Get Current Editor and associated interfaces or info ***************/
const nsIPlaintextEditor   = Components.interfaces.nsIPlaintextEditor;
const nsIHTMLEditor        = Components.interfaces.nsIHTMLEditor;
const nsITableEditor       = Components.interfaces.nsITableEditor;
const nsIEditorStyleSheets = Components.interfaces.nsIEditorStyleSheets;
const nsIEditingSession    = Components.interfaces.nsIEditingSession;

function GetCurrentEditor()
{
  // Get the active editor from the <editor> tag
  // XXX This will probably change if we support > 1 editor in main Composer window
  //      (e.g. a plaintext editor for HTMLSource)

  // For dialogs: Search up parent chain to find top window with editor
  var editor;
  try {
    var editorElement = GetCurrentEditorElement();
    editor = editorElement.getEditor(editorElement.contentWindow);

    // Do QIs now so editor users won't have to figure out which interface to use
    // Using "instanceof" does the QI for us.
    editor instanceof Components.interfaces.nsIPlaintextEditor;
    editor instanceof Components.interfaces.nsIHTMLEditor;
  } catch (e) { dump (e)+"\n"; }

  return editor;
}

function GetCurrentTableEditor()
{
  var editor = GetCurrentEditor();
  return (editor && (editor instanceof nsITableEditor)) ? editor : null;
}

function GetCurrentEditorElement()
{
  var tmpWindow = window;
  
  do {
    // Get the <editor> element(s)
    var tabeditor = tmpWindow.document.getElementById("tabeditor");

    // This will change if we support > 1 editor element
    if (tabeditor )
      return tabeditor.getCurrentEditorElement() ;

    tmpWindow = tmpWindow.opener;
  } 
  while (tmpWindow);

  return null;
}

function GetCurrentEditingSession()
{
  try {
    return GetCurrentEditorElement().editingSession;
  } catch (e) { dump (e)+"\n"; }

  return null;
}

function GetCurrentCommandManager()
{
  try {
    return GetCurrentEditorElement().commandManager;
  } catch (e) { dump (e)+"\n"; }

  return null;
}

function GetCurrentEditorType()
{
  try {
    return GetCurrentEditorElement().editortype;
  } catch (e) { dump (e)+"\n"; }

  return "";
}

function IsHTMLEditor()
{
  // We don't have an editorElement, just return false
  if (!GetCurrentEditorElement())
    return false;

  var editortype = GetCurrentEditorType();
  switch (editortype)
  {
      case "html":
      case "htmlmail":
        return true;

      case "text":
      case "textmail":
        return false

      default:
        dump("INVALID EDITOR TYPE: " + editortype + "\n");
        break;
  }
  return false;
}

function PageIsEmptyAndUntouched()
{
  return IsDocumentEmpty() && !IsDocumentModified() && !IsHTMLSourceChanged();
}

function IsInHTMLSourceMode()
{
  // Kaze
  //return (gEditorDisplayMode == kDisplayModeSource);
  //return (gEditorEditMode == kEditModeSource);
  //return (gTabEditor.IsTextDocument() || (gEditorEditMode == kEditModeSource));
  return (gEditorEditMode >= kEditModeSource);
}

// are we editing HTML (i.e. neither in HTML source mode, nor editing a text file)
function IsEditingRenderedHTML()
{
  return IsHTMLEditor() && !IsInHTMLSourceMode();
}

function IsWebComposer()
{
  return document.documentElement.id == "editorWindow";
}

function IsDocumentEditable()
{
  try {
    return GetCurrentEditor().isDocumentEditable;
  } catch (e) {}
  return false;
}

function IsDocumentEmpty()
{
  try {
    return GetCurrentEditor().documentIsEmpty;
  } catch (e) {}
  return false;
}

function IsDocumentModified()
{
  try {
    return GetCurrentEditor().documentModified;
  } catch (e) {}
  return false;
}

function IsHTMLSourceChanged()
{
  return gSourceTextEditor.documentModified;
}

function newCommandParams()
{
  try {
    return Components.classes["@mozilla.org/embedcomp/command-params;1"].createInstance(Components.interfaces.nsICommandParams);
  }
  catch(e) { dump("error thrown in newCommandParams: "+e+"\n"); }
  return null;
}

/************* General editing command utilities ***************/

function GetDocumentTitle()
{
  try {
    return GetCurrentEditor().document.title;
    // return new XPCNativeWrapper(GetCurrentEditor().document, "title").title;
  } catch (e) {}

  return "";
}

function SetDocumentTitle(title)
{

  try {
    GetCurrentEditor().setDocumentTitle(title);

    // Update window title (doesn't work if called from a dialog)
    if ("UpdateWindowTitle" in window)
      window.UpdateWindowTitle();
  } catch (e) {}
}

var gAtomService;
function GetAtomService()
{
  gAtomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
}

function EditorGetTextProperty(property, attribute, value, firstHas, anyHas, allHas)
{
  try {
    if (!gAtomService) GetAtomService();
    var propAtom = gAtomService.getAtom(property);

    GetCurrentEditor().getInlineProperty(propAtom, attribute, value,
                                         firstHas, anyHas, allHas);
  }
  catch(e) {}
}

function EditorSetTextProperty(property, attribute, value)
{
  try {
    if (!gAtomService) GetAtomService();
    var propAtom = gAtomService.getAtom(property);

    GetCurrentEditor().setInlineProperty(propAtom, attribute, value);
    if ("gContentWindow" in window)
      window.gContentWindow.focus();
  }
  catch(e) {}
}

function EditorRemoveTextProperty(property, attribute)
{
  try {
    if (!gAtomService) GetAtomService();
    var propAtom = gAtomService.getAtom(property);

    GetCurrentEditor().removeInlineProperty(propAtom, attribute);
    if ("gContentWindow" in window)
      window.gContentWindow.focus();
  }
  catch(e) {}
}

/************* Element enbabling/disabling ***************/

// this function takes an elementID and a flag
// if the element can be found by ID, then it is either enabled (by removing "disabled" attr)
// or disabled (setAttribute) as specified in the "doEnable" parameter
function SetElementEnabledById(elementID, doEnable)
{
  SetElementEnabled(document.getElementById(elementID), doEnable);
}

function SetElementEnabled(element, doEnable)
{
  if ( element )
  {
    // <Kaze> looks like the first try was the best one...
    //~ /* if ( doEnable )
      //~ element.removeAttribute("disabled");
    //~ else
      //~ element.setAttribute("disabled", "true"); */
    //~ element.disabled = !doEnable;
    if ( doEnable )
      element.removeAttribute("disabled");
    else
      element.setAttribute("disabled", "true");
    // </Kaze>
  }
  else
  {
    dump("Element not found in SetElementEnabled\n");
  }
}

function SetElementVisible(element, isVisible)
{
  if ( element )
  {
    if ( isVisible)
      element.style.visibility = "visible";
    else
      element.style.visibility = "hidden";
  }
  else
  {
    dump("Element not found in SetElementVisible\n");
  }
}

/************* Services / Prefs ***************/

function GetIOService()
{
  if (gIOService)
    return gIOService;

  gIOService = Components.classes["@mozilla.org/network/io-service;1"]
               .getService(Components.interfaces.nsIIOService);

  return gIOService;
}

function GetFileProtocolHandler()
{
  var ios = GetIOService();
  var handler = ios.getProtocolHandler("file");
  return handler.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
}

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

function GetStringPref(name)
{
  try {
    return GetPrefs().getComplexValue(name, Components.interfaces.nsISupportsString).data;
  } catch (e) {}
  return "";
}

function GetBoolPref(name)
{
  try {
    return GetPrefs().getBoolPref(name);
  } catch (e) {}
  return false;
}

function SetUnicharPref(aPrefName, aPrefValue)
{
  var prefs = GetPrefs();
  if (prefs)
  {
    try {
      var str = Components.classes["@mozilla.org/supports-string;1"]
                          .createInstance(Components.interfaces.nsISupportsString);
      str.data = aPrefValue;
      prefs.setComplexValue(aPrefName, Components.interfaces.nsISupportsString, str);
    }
    catch(e) {}
  }
}

function GetUnicharPref(aPrefName, aDefVal)
{
  var prefs = GetPrefs();
  if (prefs)
  {
    try {
      return prefs.getComplexValue(aPrefName, Components.interfaces.nsISupportsString).data;
    }
    catch(e) {}
  }
  return "";
}

// Set initial directory for a filepicker from URLs saved in prefs
function SetFilePickerDirectory(filePicker, fileType)
{
  if (filePicker)
  {
    try {
      var prefBranch = GetPrefs();
      if (prefBranch)
      {
        // Save current directory so we can reset it in SaveFilePickerDirectory
        gFilePickerDirectory = filePicker.displayDirectory;

        var location = prefBranch.getComplexValue("editor.lastFileLocation."+fileType, Components.interfaces.nsILocalFile);
        if (location)
          filePicker.displayDirectory = location;
      }
    }
    catch(e) {}
  }
}

// Save the directory of the selected file to prefs
function SaveFilePickerDirectory(filePicker, fileType)
{
  if (filePicker && filePicker.file)
  {
    try {
      var prefBranch = GetPrefs();

      var fileDir;
      if (filePicker.file.parent)
        fileDir = filePicker.file.parent.QueryInterface(Components.interfaces.nsILocalFile);

      if (prefBranch)
       prefBranch.setComplexValue("editor.lastFileLocation."+fileType, Components.interfaces.nsILocalFile, fileDir);
    
      var prefsService = GetPrefsService();
        prefsService.savePrefFile(null);
    } catch (e) {}
  }

  // Restore the directory used before SetFilePickerDirectory was called;
  // This reduces interference with Browser and other module directory defaults
  if (gFilePickerDirectory)
    filePicker.displayDirectory = gFilePickerDirectory;

  gFilePickerDirectory = null;
}

function GetDefaultBrowserColors()
{
  var prefs = GetPrefs();
  var colors = { TextColor:0, BackgroundColor:0, LinkColor:0, ActiveLinkColor:0 , VisitedLinkColor:0 };
  var useSysColors = false;
  try { useSysColors = prefs.getBoolPref("browser.display.use_system_colors"); } catch (e) {}

  if (!useSysColors)
  {
    try { colors.TextColor = prefs.getCharPref("browser.display.foreground_color"); } catch (e) {}

    try { colors.BackgroundColor = prefs.getCharPref("browser.display.background_color"); } catch (e) {}
  }
  // Use OS colors for text and background if explicitly asked or pref is not set
  if (!colors.TextColor)
    colors.TextColor = "windowtext";

  if (!colors.BackgroundColor)
    colors.BackgroundColor = "window";

  colors.LinkColor = prefs.getCharPref("browser.anchor_color");
  colors.ActiveLinkColor = prefs.getCharPref("browser.active_color");
  colors.VisitedLinkColor = prefs.getCharPref("browser.visited_color");

  return colors;
}

/************* URL handling ***************/

function TextIsURI(selectedText)
{
  return selectedText && /^http:\/\/|^https:\/\/|^file:\/\/|\
    ^ftp:\/\/|^about:|^mailto:|^news:|^snews:|^telnet:|^ldap:|\
    ^ldaps:|^gopher:|^finger:|^javascript:/i.test(selectedText);
}

function IsUrlAboutBlank(urlString)
{
  /*
   *return (urlString == "about:blank" || urlString == "about:xblank" ||
   *        urlString == "about:strictblank" || urlString == "about:xstrictblank");
   */
  return /^about:|^chrome:\/\//.test(urlString);
}

//~ function MakeRelativeUrl(url)
function MakeRelativeUrl(url, base) { // modified
// Added: optional "base" param (default = document URL)

  var inputUrl = TrimString(url);
  if (!inputUrl)
    return inputUrl;

  // Get the filespec relative to current document's location
  // NOTE: Can't do this if file isn't saved yet!
  var docUrl = base ? base : GetDocumentBaseUrl(); // Kaze
  var docScheme = GetScheme(docUrl);

  // Can't relativize if no doc scheme (page hasn't been saved)
  if (!docScheme)
    return inputUrl;

  var urlScheme = GetScheme(inputUrl);

  // Do nothing if not the same scheme or url is already relativized
  if (docScheme != urlScheme)
    return inputUrl;

  var IOService = GetIOService();
  if (!IOService)
    return inputUrl;

  // Host must be the same
  var docHost = GetHost(docUrl);
  var urlHost = GetHost(inputUrl);
  if (docHost != urlHost)
    return inputUrl;


  // Get just the file path part of the urls
  // XXX Should we use GetCurrentEditor().documentCharacterSet for 2nd param ?
  var docPath = IOService.newURI(docUrl, GetCurrentEditor().documentCharacterSet, null).path;
  var urlPath = IOService.newURI(inputUrl, GetCurrentEditor().documentCharacterSet, null).path;

  // We only return "urlPath", so we can convert
  //  the entire docPath for case-insensitive comparisons
  var os = GetOS();
  var doCaseInsensitive = (docScheme == "file" && os == gWin);
  if (doCaseInsensitive)
    docPath = docPath.toLowerCase();

  // Get document filename before we start chopping up the docPath
  var docFilename = GetFilename(docPath);

  // Both url and doc paths now begin with "/"
  // Look for shared dirs starting after that
  urlPath = urlPath.slice(1);
  docPath = docPath.slice(1);

  var firstDirTest = true;
  var nextDocSlash = 0;
  var done = false;

  // Remove all matching subdirs common to both doc and input urls
  do {
    nextDocSlash = docPath.indexOf("\/");
    var nextUrlSlash = urlPath.indexOf("\/");

    if (nextUrlSlash == -1)
    {
      // We're done matching and all dirs in url
      // what's left is the filename
      done = true;

      // Remove filename for named anchors in the same file
      if (nextDocSlash == -1 && docFilename)
      {
        var anchorIndex = urlPath.indexOf("#");
        if (anchorIndex > 0)
        {
          var urlFilename = doCaseInsensitive ? urlPath.toLowerCase() : urlPath;

          if (urlFilename.indexOf(docFilename) == 0)
            urlPath = urlPath.slice(anchorIndex);
        }
      }
    }
    else if (nextDocSlash >= 0)
    {
      // Test for matching subdir
      var docDir = docPath.slice(0, nextDocSlash);
      var urlDir = urlPath.slice(0, nextUrlSlash);
      if (doCaseInsensitive)
        urlDir = urlDir.toLowerCase();

      if (urlDir == docDir)
      {

        // Remove matching dir+"/" from each path
        //  and continue to next dir
        docPath = docPath.slice(nextDocSlash+1);
        urlPath = urlPath.slice(nextUrlSlash+1);
      }
      else
      {
        // No match, we're done
        done = true;

        // Be sure we are on the same local drive or volume
        //   (the first "dir" in the path) because we can't
        //   relativize to different drives/volumes.
        // UNIX doesn't have volumes, so we must not do this else
        //  the first directory will be misinterpreted as a volume name
        if (firstDirTest && docScheme == "file" && os != gUNIX)
          return inputUrl;
      }
    }
    else  // No more doc dirs left, we're done
      done = true;

    firstDirTest = false;
  }
  while (!done);

  // Add "../" for each dir left in docPath
  while (nextDocSlash > 0)
  {
    urlPath = "../" + urlPath;
    nextDocSlash = docPath.indexOf("\/", nextDocSlash+1);
  }
  return urlPath;
}

function MakeAbsoluteUrl(url)
{
  var resultUrl = TrimString(url);
  if (!resultUrl)
    return resultUrl;

  // Check if URL is already absolute, i.e., it has a scheme
  var urlScheme = GetScheme(resultUrl);

  if (urlScheme)
    return resultUrl;

  var docUrl = GetDocumentBaseUrl();
  var docScheme = GetScheme(docUrl);

  // Can't relativize if no doc scheme (page hasn't been saved)
  if (!docScheme)
    return resultUrl;

  var  IOService = GetIOService();
  if (!IOService)
    return resultUrl;
  
  // Make a URI object to use its "resolve" method
  var absoluteUrl = resultUrl;
  var docUri = IOService.newURI(docUrl, GetCurrentEditor().documentCharacterSet, null);

  try {
    absoluteUrl = docUri.resolve(resultUrl);
    // This is deprecated and buggy! 
    // If used, we must make it a path for the parent directory (remove filename)
    //absoluteUrl = IOService.resolveRelativePath(resultUrl, docUrl);
  } catch (e) {}

  return absoluteUrl;
}

// Get the HREF of the page's <base> tag or the document location
// returns empty string if no base href and document hasn't been saved yet
function GetDocumentBaseUrl()
{
  try {
    var docUrl;

    // if document supplies a <base> tag, use that URL instead 
    var baseList = GetCurrentEditor().document.getElementsByTagName("base");
    if (baseList)
    {
      var base = baseList.item(0);
      if (base)
        docUrl = base.getAttribute("href");
    }
    if (!docUrl)
      docUrl = GetDocumentUrl();

    if (!IsUrlAboutBlank(docUrl))
      return docUrl;
  } catch (e) {}
  return "";
}

function GetDocumentUrl()
{
  try {
    var aDOMHTMLDoc = GetCurrentEditor().document.QueryInterface(Components.interfaces.nsIDOMHTMLDocument);
    return aDOMHTMLDoc.URL;
  }
  catch (e) {}
  return "";
}

// Extract the scheme (e.g., 'file', 'http') from a URL string
function GetScheme(urlspec)
{
  var resultUrl = TrimString(urlspec);
  // Unsaved document URL has no acceptable scheme yet
  if (!resultUrl || IsUrlAboutBlank(resultUrl))
    return "";

  var IOService = GetIOService();
  if (!IOService)
    return "";

  var scheme = "";
  try {
    // This fails if there's no scheme
    scheme = IOService.extractScheme(resultUrl);
  } catch (e) {}

  return scheme ? scheme.toLowerCase() : "";
}

function GetHost(urlspec)
{
  if (!urlspec)
    return "";

  var IOService = GetIOService();
  if (!IOService)
    return "";

  var host = "";
  try {
    host = IOService.newURI(urlspec, null, null).host;
  } catch (e) {}

  return host;
}

function GetUsername(urlspec)
{
  if (!urlspec)
    return "";

  var IOService = GetIOService();
  if (!IOService)
    return "";

  var username = "";
  try {
    username = IOService.newURI(urlspec, null, null).username;
  } catch (e) {}

  return username;
}

function GetFilename(urlspec)
{
  if (!urlspec || IsUrlAboutBlank(urlspec))
    return "";

  var IOService = GetIOService();
  if (!IOService)
    return "";

  var filename;

  try {
    var uri = IOService.newURI(urlspec, null, null);
    if (uri)
    {
      var url = uri.QueryInterface(Components.interfaces.nsIURL);
      if (url)
        filename = url.fileName;
    }
  } catch (e) {}

  return filename ? filename : "";
}

// Return the url without username and password
// Optional output objects return extracted username and password strings
// This uses just string routines via nsIIOServices
function StripUsernamePassword(urlspec, usernameObj, passwordObj)
{
  urlspec = TrimString(urlspec);
  if (!urlspec || IsUrlAboutBlank(urlspec))
    return urlspec;

  if (usernameObj)
    usernameObj.value = "";
  if (passwordObj)
    passwordObj.value = "";

  // "@" must exist else we will never detect username or password
  var atIndex = urlspec.indexOf("@");
  if (atIndex > 0)
  {
    try {
      var IOService = GetIOService();
      if (!IOService)
        return urlspec;

      var uri = IOService.newURI(urlspec, null, null);
      var username = uri.username;
      var password = uri.password;

      if (usernameObj && username)
        usernameObj.value = username;
      if (passwordObj && password)
        passwordObj.value = password;
      if (username)
      {
        var usernameStart = urlspec.indexOf(username);
        if (usernameStart != -1)
          return urlspec.slice(0, usernameStart) + urlspec.slice(atIndex+1);
      }
    } catch (e) {}
  }
  return urlspec;
}

function StripPassword(urlspec, passwordObj)
{
  urlspec = TrimString(urlspec);
  if (!urlspec || IsUrlAboutBlank(urlspec))
    return urlspec;

  if (passwordObj)
    passwordObj.value = "";

  // "@" must exist else we will never detect password
  var atIndex = urlspec.indexOf("@");
  if (atIndex > 0)
  {
    try {
      var IOService = GetIOService();
      if (!IOService)
        return urlspec;

      var password = IOService.newURI(urlspec, null, null).password;

      if (passwordObj && password)
        passwordObj.value = password;
      if (password)
      {
        // Find last ":" before "@"
        var colon = urlspec.lastIndexOf(":", atIndex);
        if (colon != -1)
        {
          // Include the "@"
          return urlspec.slice(0, colon) + urlspec.slice(atIndex);
        }
      }
    } catch (e) {}
  }
  return urlspec;
}

// Version to use when you have an nsIURI object
function StripUsernamePasswordFromURI(uri)
{
  var urlspec = "";
  if (uri)
  {
    try {
      urlspec = uri.spec;
      var userPass = uri.userPass;
      if (userPass)
      {
        start = urlspec.indexOf(userPass);
        urlspec = urlspec.slice(0, start) + urlspec.slice(start+userPass.length+1);
      }
    } catch (e) {}    
  }
  return urlspec;
}

function InsertUsernameIntoUrl(urlspec, username)
{
  if (!urlspec || !username)
    return urlspec;

  try {
    var ioService = GetIOService();
    var URI = ioService.newURI(urlspec, GetCurrentEditor().documentCharacterSet, null);
    URI.username = username;
    return URI.spec;
  } catch (e) {}

  return urlspec;
}

function GetOS()
{
  if (gOS)
    return gOS;

  var platform = navigator.platform.toLowerCase();

  if (platform.indexOf("win") != -1)
    gOS = gWin;
  else if (platform.indexOf("mac") != -1)
    gOS = gMac;
  else if (platform.indexOf("unix") != -1 || platform.indexOf("linux") != -1 || platform.indexOf("sun") != -1)
    gOS = gUNIX;
  else
    gOS = "";
  // Add other tests?

  return gOS;
}

function ConvertRGBColorIntoHEXColor(color)
{
  if ( /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.test(color) ) {
    var r = Number(RegExp.$1).toString(16);
    if (r.length == 1) r = "0"+r;
    var g = Number(RegExp.$2).toString(16);
    if (g.length == 1) g = "0"+g;
    var b = Number(RegExp.$3).toString(16);
    if (b.length == 1) b = "0"+b;
    return "#"+r+g+b;
  }
  else
  {
    return color;
  }
}

/************* CSS ***************/

function GetHTMLOrCSSStyleValue(element, attrName, cssPropertyName)
{
  var prefs = GetPrefs();
  var IsCSSPrefChecked = prefs.getBoolPref("editor.use_css");
  var value;
  if (IsCSSPrefChecked && IsHTMLEditor())
    value = element.style.getPropertyValue(cssPropertyName);

  if (!value)
    value = element.getAttribute(attrName);

  if (!value)
    return "";

  return value;
}

/************* Miscellaneous ***************/
// Clone simple JS objects
function Clone(obj) 
{ 
  var clone = {};
  for (var i in obj)
  {
    if( typeof obj[i] == 'object')
      clone[i] = Clone(obj[i]);
    else
      clone[i] = obj[i];
  }
  return clone;
}

function GetCSSPropertyValueForSelection(property)
{
  var value = "";
  try {
    if (!gAtomService) GetAtomService();
    var propAtom = gAtomService.getAtom(property);

    value = GetCurrentEditor().getCSSPropertyValueForSelection(propAtom);
  }
  catch(e) {}

  return value;
}

function ListAvailableCharSets()
{
  try {
    var availCharsetDict     = [];
    var rdf = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService); 
    var kNC_Root = rdf.GetResource("NC:DecodersRoot");
    var kNC_name = rdf.GetResource("http://home.netscape.com/NC-rdf#Name");
    var rdfDataSource = rdf.GetDataSource("rdf:charset-menu"); 
    var rdfContainer = Components.classes["@mozilla.org/rdf/container;1"].getService(Components.interfaces.nsIRDFContainer);

    rdfContainer.Init(rdfDataSource, kNC_Root);
    var availableCharsets = rdfContainer.GetElements();
    var charset;

    for (var i = 0; i < rdfContainer.GetCount(); i++) {
      charset = availableCharsets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      availCharsetDict[i] = new Array(2);
      availCharsetDict[i][0] = readRDFString(rdfDataSource, charset, kNC_name);
      availCharsetDict[i][1] = charset.Value;
    }
    return availCharsetDict;
  }
  catch (e) { return null; }
}

function ExplodeElement(node)
{
  var child = node.firstChild;
  var parent = node.parentNode;
  if (!parent)
    return;
  while (child)
  {
    var tmp = child.nextSibling;
    parent.insertBefore(child, node);
    child = tmp;
  }
  var brNode = document.createElement("br");
  parent.insertBefore(brNode, node);
  parent.removeChild(node);
}

function NormalizeURL(url)
{
  if (!GetScheme(url) && !IsUrlAboutBlank(url))
  {
    var k = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

    var noBackSlashUrl = url.replace(/\\\"/g, "\"");
    var c0 = noBackSlashUrl[0];
    var c1 = noBackSlashUrl[1]
    if (c0 == '/' ||
        ( ((c0 >= 'a' && c0 <= 'z') || (c0 >= 'A' && c0 <= 'Z')) && c1 == ":"))
    {
      // this is an absolute path
      k.initWithPath(url);
    }
    else
    {
      // First, get the current dir for the process...
      var dirServiceProvider = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIDirectoryServiceProvider);
      var p = new Object();
      var currentProcessDir = dirServiceProvider.getFile("CurWorkD", p).path;
      k.initWithPath(currentProcessDir);

      // then try to append the relative path
      try {
        k.appendRelativePath(url);
      }
      catch (e) {
        dump("### Can't understand the filepath\n");
        return "about:blank";
      }
      var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
      var fileHandler = ioService.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
      url = fileHandler.getURLSpecFromFile(k);
    }
  }
  return url;
}

function IsXHTMLDocument()
{
  var doctype = GetCurrentEditor().document.doctype;
  return (doctype.publicId == "-//W3C//DTD XHTML 1.0 Transitional//EN" ||
          doctype.publicId == "-//W3C//DTD XHTML 1.0 Strict//EN");
}

function IsStrictDTD()
{
  var doctype = GetCurrentEditor().document.doctype;
  return (doctype.publicId.lastIndexOf("Strict") != -1);
}

function IsCSSDisabledAndStrictDTD()
{
  var prefs = GetPrefs();
  var IsCSSPrefChecked = prefs.getBoolPref("editor.use_css");
  return !IsCSSPrefChecked && IsStrictDTD();
}

