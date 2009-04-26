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
 * The Original Code is Mozilla.org
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998-2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
 *   Fabien Cazenave (Kaze) http://fabiwan.kenobi.free.fr/
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
 
/* Implementations of nsIControllerCommand for composer commands */

function initEditorContextMenuItems(aEvent)
{
  var shouldShowEditPage = !gContextMenu.onImage && !gContextMenu.onLink && !gContextMenu.onTextInput && !gContextMenu.inDirList;
  gContextMenu.showItem( "context-editpage", shouldShowEditPage );

  var shouldShowEditLink = gContextMenu.onSaveableLink; 
  gContextMenu.showItem( "context-editlink", shouldShowEditLink );

  // Hide the applications separator if there's no add-on apps present. 
  gContextMenu.showItem("context-sep-apps", gContextMenu.shouldShowSeparator("context-sep-apps"));
}
  
function initEditorContextMenuListener(aEvent)
{
  var popup = document.getElementById("contentAreaContextMenu");
  if (popup)
    popup.addEventListener("popupshowing", initEditorContextMenuItems, false);
}

addEventListener("load", initEditorContextMenuListener, false);

/* GLAZOU: this function seems unused. Commenting out */
/*
function editDocument(aDocument)      
{
  if (!aDocument)
    aDocument = window._content.document;

  editPage(aDocument.URL, window, false); 
}
*/

/* GLAZOU: this function seems unused in stdalone editor. Commenting out */
/*
function editPageOrFrame()
{
  var focusedWindow = document.commandDispatcher.focusedWindow;

  // if the uri is a specific frame, grab it, else use the frameset uri 
  // and let Composer handle error if necessary
  var url = getContentFrameURI(focusedWindow);
  editPage(url, window, false)
}
*/

function NewEditorTab()
{
  var prefs = GetPrefs();
  var preferredDoctype = "html";
  var strictness = false;
  try {
    preferredDoctype= pref.getCharPref("editor.default.doctype");
  } catch(e) { }
  try {
    strictness = pref.getBoolPref("editor.default.strictness");
  } catch(e) { }
  document.getElementById("tabeditor").newBlankTab(preferredDoctype, strictness);
}

// Any non-editor window wanting to create an editor with a URL
//   should use this instead of "window.openDialog..."
// We must always find an existing window with requested URL
// (When calling from a dialog, "launchWindow" is dialog's "opener"
//   and we need a delay to let dialog close)
function editPage(url, launchWindow, delay, newTab)
{
  // Always strip off "view-source:" and #anchors
  url = url.replace(/^view-source:/, "").replace(/#.*/, "");

  // User may not have supplied a window
  if (!launchWindow) {
    if (window) {
      launchWindow = window;
    } else {
      dump("No window to launch an editor from!\n");
      return;
    }
  }

  // if the current window is a browser window, then extract the current charset menu setting from the current 
  // document and use it to initialize the new composer window...

  var wintype = document.firstChild.getAttribute('windowtype');
  var charsetArg;

  if (launchWindow && (wintype == "navigator:browser") && launchWindow.content.document)
    charsetArg = "charset=" + launchWindow.content.document.characterSet;

  try {
    // <Kaze> the original code has been moved to CheckWindowsForUrlMatch
    // Is there a Composer window we can use?
    var win = CheckAllTabsForUrlMatch(url, launchWindow, newTab); // patched
    //var win = CheckWindowsForUrlMatch(url, launchWindow, newTab); // original behavior
    if (win) {
      if (win != launchWindow)
        win.focus();
      return;
    }
    // </Kaze>
    
    // Create new Composer window
    if (delay)
      launchWindow.delayedOpenWindow("chrome://editor/content", "chrome,all,dialog=no", url);
    else
      launchWindow.openDialog("chrome://editor/content", "_blank", "chrome,all,dialog=no", url, charsetArg);

  } catch(e) {}
}

function createURI(urlstring)
{
  try {
    var ioserv = Components.classes["@mozilla.org/network/io-service;1"]
               .getService(Components.interfaces.nsIIOService);
    return ioserv.newURI(urlstring, null, null);
  } catch (e) {}

  return null;
}

function CheckAllTabsForUrlMatch(url, launchWindow, newTab) { // created
// adapted to retrieve the passed url in open tabs
// returns the window handler

  var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
  var windowManagerInterface = windowManager.QueryInterface( Components.interfaces.nsIWindowMediator);
  var enumerator = windowManagerInterface.getEnumerator( "composer:html" );
  var emptyWindow;

  while ( enumerator.hasMoreElements() ) {
    var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
    if ( win && win.IsWebComposer()) {
      var tabeditor = win.document.getElementById("tabeditor")
      var edited = tabeditor.checkIfUrlIsAlreadyEdited(url);
      if (edited) {
        // We found an editor with our url
        tabeditor.selectedPanel = edited;
        launchWindow.document.getElementById("tabeditor").stopWebNavigation();
        return win;
      }
      if (!emptyWindow && win.PageIsEmptyAndUntouched())
        emptyWindow = win;
    }
  }

  if (newTab) {
    // we have a window we can use to add a new tab
    document.getElementById("tabeditor").editURL(url, false, false, false);
    return launchWindow;
  }

  if (emptyWindow) {
    // we have an empty window we can use
    if (emptyWindow.IsInHTMLSourceMode())
      emptyWindow.SetEditMode(emptyWindow.PreviousNonSourceDisplayMode);
    emptyWindow.EditorLoadUrl(url);
    emptyWindow.SetSaveAndPublishUI(url);
    return emptyWindow;
  }

  // new Composer window needed
  return null;
}

function CheckWindowsForUrlMatch(url, launchWindow, newTab) { // created, unused
// mostly taken from the original 'editPage' function
// returns the window handler
  var uri = createURI(url, null, null);

  var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
  var windowManagerInterface = windowManager.QueryInterface( Components.interfaces.nsIWindowMediator);
  var enumerator = windowManagerInterface.getEnumerator( "composer:html" );
  var emptyWindow;
  while ( enumerator.hasMoreElements() )
  {
    var win = enumerator.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
    if ( win && win.IsWebComposer())
    {
      if (!newTab && CheckOpenWindowForURIMatch(uri, win))
      {
        // We found an editor with our url
        //~ win.focus();
        return win;
      }
      if (!emptyWindow && win.PageIsEmptyAndUntouched())
      {
        emptyWindow = win;
      }
    }
  }

  if (newTab && win)
  {
    win.document.getElementById("tabeditor").editURL(url, false, false, false);
    //~ win.focus();
    return win;
  }

  if (emptyWindow)
  {
    // we have an empty window we can use
    if (emptyWindow.IsInHTMLSourceMode())
      emptyWindow.SetEditMode(emptyWindow.PreviousNonSourceDisplayMode);
    emptyWindow.EditorLoadUrl(url);
    //~ emptyWindow.focus();
    emptyWindow.SetSaveAndPublishUI(url);
    return emptyWindow;
  }

  // new Composer window needed
  return null;
}

function CheckOpenWindowForURIMatch(uri, win) { // unused (only called by CheckWindowsForURIMatch)
// Kaze: this function isn't used any more. Might still be usefull for Mozilla Composer.
  try {
    var contentWindow = win.content;  // need to QI win to nsIDOMWindowInternal?
    var contentDoc = contentWindow.document;
    var htmlDoc = contentDoc.QueryInterface(Components.interfaces.nsIDOMHTMLDocument);
    var winuri = createURI(htmlDoc.URL);
    return winuri.equals(uri);
  } catch (e) {}
  
  return false;
}

function NewTemplate()
{
  document.getElementById("tabeditor").newTemplateTab();
}

function NewEditorFromTemplate()
{
  // XXX not implemented
}

function NewEditorFromDraft()
{
  // XXX not implemented
}
