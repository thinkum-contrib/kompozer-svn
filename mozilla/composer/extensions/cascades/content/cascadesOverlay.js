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
 * The Original Code is CaScadeS, a stylesheet editor for Composer.
 *
 * The Initial Developer of the Original Code is
 * Daniel Glazman.
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Original author: Daniel Glazman <daniel@glazman.org>
 *   Fabien Cazenave <kaze@kompozer.net>
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

// Kaze: remeber the "expert mode" setting
var kzsExpertMode = true; // reminder
var kzsPrefs = Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.KaZcadeS.");
    
function kzsCheckTitle() {                   // created
  // CaScadeS won't work if the document hasn't been saved yet
  if (IsUrlAboutBlank(GetDocumentUrl()))
    return SaveDocument(true, false, "text/html");
  
  // CaScadeS won't work if the <title> is missing 
  var editor = GetCurrentEditor();
  var docNode = editor.document;
  var headNode = null;
  var titleNode = null;
  try {
    headNode = docNode.getElementsByTagName("head").item(0);
    titleNode = docNode.getElementsByTagName("title").item(0);
  } catch(e) {}
  if (!headNode) {
    headNode = docNode.createElement("head");
    var htmlNode = docNode.getElementsByTagName("html").item(0);
    var bodyNode = docNode.getElementsByTagName("body").item(0);
    htmlNode.insertBefore(headNode, bodyNode);
  }
  if (!titleNode) {
    titleNode = docNode.createElement("title");
    headNode.appendChild(titleNode);
    editor.incrementModificationCount(1);
  }
  return true;
}

function openCascadesDialog() {              // modified
  //~ window.openDialog("chrome://cascades/content/EdCssProps.xul","_blank", "chrome,close,modal,titlebar,resizable=yes");
  //~ window._content.focus();
  if (kzsCheckTitle()) {
    window.openDialog("chrome://cascades/content/EdCssProps.xul", 
      "_blank", "chrome,close,titlebar,modal", "", null);
    window._content.focus();
  }
}

//
// 'Inline Styles' pop-up menu
// taken from editor/StructBarContextMenu.js
function openCSSPropsDialog(item, tab) {     // modified
  // Kaze: corrected to use the localized title
  var title = item.getAttribute("label");

  if (tab) // open the specified tab
    window.openDialog("chrome://cascades/content/" + tab + "Props.xul",
        "_blank", "chrome,close,modal,titlebar", tab, title, false);
  else // no tab specified, using CaScadeS instead
    window.openDialog("chrome://cascades/content/allProps.xul", 
      "_blank", "chrome,close,titlebar,modal", "all", title, false);
  window._content.focus();
}

function EnableExtractInlineStyles() {
  var elt = gContextMenuFiringDocumentElement;
  var style = elt.getAttribute("style");
  var hasInlineStyle = !style;
  SetElementEnabledById("makeCSSRule", style);
}

function ExtractInlineStyles() {
  window.openDialog("chrome://editor/content/ExtractStyles.xul","_blank",
    "chrome,close,modal,titlebar", gContextMenuFiringDocumentElement);
  window._content.focus();
}

function cleanPopup(menuPopup) {
  var child = menuPopup.lastChild;
  while (child)
  {
    var tmp = child.previousSibling;
    menuPopup.removeChild(child);
    child = tmp;
  }
}

function InitIDSelectMenu(menuPopup, fromSidebar) {
  cleanPopup(menuPopup);
  
  //var id = gContextMenuFiringDocumentElement.getAttribute("id");
  var elt = fromSidebar ? window.top.gLastFocusNode : gContextMenuFiringDocumentElement;
  var id = elt.getAttribute("id");
  if (id)
  {
    var menuEntry = document.createElementNS(XUL_NS, "menuitem");
    menuEntry.setAttribute("type",    "radio");
    menuEntry.setAttribute("checked", "true");
    menuEntry.setAttribute("label",   id);
    menuEntry.setAttribute("value",   id);
    menuPopup.appendChild(menuEntry);
  }

  /* <Kaze> switch to BG's CSS utils instead of patching the Gecko core
  var idList = GetCurrentEditor().document.getSelectorList(CSSSelectorQuery.SHOW_ID_SELECTOR);
  if (idList && idList.length)
  {
    if (id)
    {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

    var idListArray  = new Array();
    var idListLength = idList.length;
    for (index = 0; index < idListLength; index++)
      idListArray.push(idList.item(index).substr(1));
    */
  var editor, idListArray;
  if (fromSidebar) {
    editor = GetCurrentEditorFromSidebar();
    idListArray = window.top.CssUtils.getAllIdsForDocument(editor.document);
  } else {
    editor = GetCurrentEditor();
    idListArray = CssUtils.getAllIdsForDocument(editor.document);
  }
  if (idListArray && idListArray.length) {
    if (id) {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

    var idListLength = idListArray.length;
    idListArray.sort();
    var previousId = "";
    for (index = 0; index < idListLength; index++)
    {
      var idEntry = idListArray[index];
      if (idEntry != previousId)
      {
        previousId = idEntry;

        if (idEntry != id)
        {
          menuEntry = document.createElementNS(XUL_NS, "menuitem");
          menuEntry.setAttribute("type",    "radio");
          menuEntry.setAttribute("label",   idEntry);
          menuEntry.setAttribute("value",   idEntry);
          menuPopup.appendChild(menuEntry);
        }
      }
    }
  }
}

function InitClassSelectMenu(menuPopup, fromSidebar) {
  cleanPopup(menuPopup);

  //var classes = gContextMenuFiringDocumentElement.getAttribute("class");
  var elt = fromSidebar ? window.top.gLastFocusNode : gContextMenuFiringDocumentElement;
  var classes = elt.getAttribute("class");
  var classesArray, classesArrayLength;
  if (classes)
  {
    classesArray = classes.split(" ");
    classesArray.sort();
    classesArrayLength = classesArray.length;
    var index;
    for (index = 0; index < classesArrayLength; index++)
    {
      var menuEntry = document.createElementNS(XUL_NS, "menuitem");
      menuEntry.setAttribute("type",    "checkbox");
      menuEntry.setAttribute("checked", "true");
      menuEntry.setAttribute("label",   classesArray[index]);
      menuEntry.setAttribute("value",   classesArray[index]);
      menuPopup.appendChild(menuEntry);
    }
  }


  /* <Kaze> switch to BG's CSS utils instead of patching the Gecko core
  var classList = GetCurrentEditor().document.getSelectorList(CSSSelectorQuery.SHOW_CLASS_SELECTOR);
  if (classList && classList.length)
  {
    if (classesArrayLength)
    {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

    var classListArray  = new Array();
    var classListLength = classList.length;
    for (index = 0; index < classListLength; index++)
      classListArray.push(classList.item(index).substr(1));
    classListArray.sort();
  */
  //var classListArray = CssUtils.getAllClassesForDocument(GetCurrentEditor().document);
  var editor, classListArray;
  if (fromSidebar) {
    editor = GetCurrentEditorFromSidebar();
    classListArray = window.top.CssUtils.getAllClassesForDocument(editor.document);
  } else {
    editor = GetCurrentEditor();
    classListArray = CssUtils.getAllClassesForDocument(editor.document);
  }
  if (classListArray && classListArray.length)
  {
    if (classesArrayLength)
    {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

    var classListLength = classListArray.length;
    var previousClass = "";
    classListArray.sort();
    // </Kaze>
    for (index = 0; index < classListLength; index++)
    {
      var classEntry = classListArray[index];
      if (classEntry != previousClass)
      {
        previousClass = classEntry;

        var found = false;
        if (classesArrayLength)
        {
          var existingClassesIndex;
          for (existingClassesIndex = 0; existingClassesIndex < classesArrayLength; existingClassesIndex++)
            if (classesArray[existingClassesIndex] == classEntry)
            {
              found = true;
              break;
            }
        }
        if (!found)
        {
          menuEntry = document.createElementNS(XUL_NS, "menuitem");
          menuEntry.setAttribute("type",    "checkbox");
          menuEntry.setAttribute("label",   classEntry);
          menuEntry.setAttribute("value",   classEntry);
          menuPopup.appendChild(menuEntry);
        }
      }
    }
  }
}

function onClassSelectChange(fromSidebar) {             // modified
  var menuPopup = document.getElementById("classSelectMenuPopup");
  var resultingClassAttribute = "";
  var classEntry = menuPopup.firstChild;
  while (classEntry)
  {
    if (classEntry.nodeName.toLowerCase() == "menuitem" &&
        classEntry.getAttribute("checked"))
    {
      var value = classEntry.getAttribute("value");
      if (resultingClassAttribute)
        resultingClassAttribute += " ";
      resultingClassAttribute += value;
    }
    classEntry = classEntry.nextSibling;
  }
  // <Kaze>
  var elt    = fromSidebar ? window.top.gLastFocusNode : gContextMenuFiringDocumentElement;
  var editor = fromSidebar ? GetCurrentEditorFromSidebar() : GetCurrentEditor();
  //~ GetCurrentEditor().setAttribute(elt, "class", resultingClassAttribute);
  if (/^[\s]*$/.test(resultingClassAttribute))
    editor.removeAttribute(elt, "class");
  else
    editor.setAttribute(elt, "class", resultingClassAttribute);
  // refresh the structure toolbar
  //gLastFocusNode = null;
  //setTimeout("UpdateStructToolbar();", 100);
  if (fromSidebar)
    window.top.setTimeout("ResetStructToolbar();", 100);
  else
    setTimeout("ResetStructToolbar();", 100);
  // </Kaze>
}

function onIDSelectChange(fromSidebar) {                // modified
  var menuPopup = document.getElementById("idSelectMenuPopup");
  var classEntry = menuPopup.firstChild;
  var resultingID;
  var idEntry = menuPopup.firstChild;
  while (idEntry)
  {
    if (idEntry.nodeName.toLowerCase() == "menuitem" &&
        idEntry.getAttribute("checked"))
    {
      var value = idEntry.getAttribute("value");
      resultingID = value;
      break;
    }
    idEntry = idEntry.nextSibling;
  }
  // <Kaze>
  if (resultingID) {
    var currID = null;
    var elt    = fromSidebar ? window.top.gLastFocusNode : gContextMenuFiringDocumentElement;
    var editor = fromSidebar ? GetCurrentEditorFromSidebar() : GetCurrentEditor();
    if (elt.hasAttribute("id"))
      currID = elt.getAttribute("id");

    if (resultingID == currID) { // user reselects the element's current ID
      // in this case, just remove the current ID attribute
      editor.removeAttribute(elt, "id");
    }
    else {                       // user selects a new ID
      // first, check if an element (or more...) already has this ID
      var currElt;
      while (currElt = editor.document.getElementById(resultingID))
	      editor().removeAttribute(currElt, "id");
      // apply new ID on the selected element
      editor.setAttribute(elt, "id", resultingID);
    }
  }
  // refresh the structure toolbar
  //gLastFocusNode = null;
  //setTimeout("UpdateStructToolbar();", 100);
  if (fromSidebar)
    window.top.setTimeout("ResetStructToolbar();", 100);
  else
    setTimeout("ResetStructToolbar();", 100);
  // </Kaze>
}
