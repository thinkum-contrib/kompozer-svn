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
 * Fabien Cazenave.
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Original author: Fabien Cazenave <kaze@kompozer.net>
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

var gDialog;
var gLastSelectedElement;
var gLastSelectedStyle;
var gLastHoveredIndex;
var gLastHoveredCell;

// Event listeners
window.addEventListener("keypress", keyNavigation, true);
window.top.AddProcessorNotifier(UpdateDomTrees, kProcessorsWhenSelectionChanges);
//window.top.AddProcessorNotifier(UpdateHtmlTree, kProcessorsWhenSelectionChanges);

function domStartup() {
  gDialog.htmlTree     = document.getElementById("htmlTree");
  gDialog.elementList  = document.getElementById("elementList");
  gDialog.cssTree      = document.getElementById("cssTree");
  gDialog.styleList    = document.getElementById("styleList");
  //gDialog.sheetsTree   = document.getElementById("stylesheetsTree");
  gDialog.treeDeck     = document.getElementById("domTreeDeck");
  gDialog.domPanel     = document.getElementById("domPanel");
  gDialog.domPanelText = document.getElementById("domPanel-text");
  gDialog.htmlTreeDisabled = false;
  gLastSelectedElement = null;
  gLastSelectedStyle   = null;
  gLastHoveredCell     = null;
  gLastHoveredIndex    = -1;

  // HTML tree
  var element = window.top.gLastFocusNode;
  if (!element) try {
    element = GetCurrentEditorFromSidebar().rootElement; // <body>
  } catch(e) {}
  UpdateDomTrees(element);

  // CSS tree
  //var head = GetHeadElement();
  //if (!head)
    //alert("no <head> found");
  //InitSheetsTree(gDialog.sheetsTree);
  //FillStyleTree(gDialog.sheetsTree);
}

function onSelectDomTree(tabbox) {
  //gDialog.treeDeck.selectedIndex = tabbox.selectedIndex;
  const classList = ["html", "css", "split"];
  gDialog.treeDeck.setAttribute("class", classList[tabbox.selectedIndex]);
}

function keyNavigation(event) {
  var keycode = event.keyCode;
  if (event.altKey)
    return;

  switch(keycode) {
    case KeyEvent.DOM_VK_LEFT:
      selectNeighborElement(NODE_PARENT);
      break;
    case KeyEvent.DOM_VK_UP:
      selectNeighborElement(NODE_PREVSIBLING);
      break;
    case KeyEvent.DOM_VK_DOWN:
      selectNeighborElement(NODE_NEXTSIBLING);
      break;
    case KeyEvent.DOM_VK_RIGHT:
      selectNeighborElement(NODE_FIRSTCHILD);
      break;
    default:
      return;
  }
  event.stopPropagation();
}

//function UpdateHtmlTree(node) {
function UpdateDomTrees(node) {
  try {
    if (!node || node == gLastSelectedElement)
      return;
  } catch(e){
    // for some reason, when DOM explorer is closed and reopen, all global variables are lost for some time
    // so exit in order not to break the kProcessorsWhenSelectionChanges chain
    return;
  }

  if (0) try { // XXX
    // this dialog shows that this function is called too often...
    // there's room for improvement here.
    alert("refresh"
        + "\n node = " + node.nodeName
        + "\n gLastSelectedElement = " + gLastSelectedElement.nodeName
    );
  } catch(e){
    alert(e);
  }

  gLastSelectedElement = node;
  gDialog.htmlTree.view.selection.clearSelection();

  //NotifyProcessors(kProcessorsWhenSelectionChanges, element);
  //if ((element == gLastFocusNode) && (oneElementSelected == gLastFocusNodeWasSelected))

  var selectedItem = FillHtmlTree(node);
  FillCssTree(node);
  
  // show the selected node in the HTML tree
  gDialog.htmlTreeDisabled = true;

  var itemIndex = gDialog.htmlTree.contentView.getIndexOfItem(selectedItem);
  gDialog.htmlTree.view.selection.select(itemIndex);
  gDialog.htmlTree.treeBoxObject.ensureRowIsVisible(itemIndex);

  gDialog.htmlTreeDisabled = false;
}

function CleanXulTree(treechildren) {
  var elt = treechildren.firstChild;
  var tmp;
  while (elt) {
    tmp = elt.nextSibling;
    treechildren.removeChild(elt);
    elt = tmp;
  }
}

/*****************************************************************************\
 *                                                                           *
 *   HTML tree                                                               *
 *                                                                           *
\*****************************************************************************/

function FillHtmlTree(element) {
  // reset HTML array & tree
  delete gElementArray;
  gElementArray = new Array();
  CleanXulTree(gDialog.elementList);

  // fill HTML tree & array
  var treeitem, container, sibling;
  var selectedItem;
  var firstIteration = true;
  var tag;
  var tmp;
  do {
    // create treeitem
    tag = element.tagName.toLowerCase();
    treeitem = newHtmlTreeItem(element, tag);
    gElementArray.unshift(element);

    if (firstIteration) { // selected node
      firstIteration = false;
      selectedItem = treeitem;
      // append all child elements
      //if (treeitem.hasAttribute("container")) {
      if (tag != "head" && getNeighborElement(element, NODE_FIRSTCHILD)) {
        container = document.createElementNS(XUL_NS, "treechildren");
        tmp = getNeighborElement(element, NODE_FIRSTCHILD);
        if (tmp) do {
          container.appendChild(newHtmlTreeItem(tmp), treeitem)
          gElementArray.push(tmp);
        } while (tmp = getNeighborElement(tmp, NODE_NEXTSIBLING))
        treeitem.appendChild(container);
        treeitem.setAttribute("container", "true");
        treeitem.setAttribute("open", "true");
      }
    } else {
      treeitem.appendChild(container);
      treeitem.setAttribute("container", "true");
      treeitem.setAttribute("open", "true");
    }
    
    // create container
    if (tag == "html")
      container = gDialog.elementList;
    else
      container = document.createElementNS(XUL_NS, "treechildren");
    container.appendChild(treeitem);

    // add element siblings
    tmp = element;
    while (tmp = getNeighborElement(tmp, NODE_NEXTSIBLING)) {
      container.appendChild(newHtmlTreeItem(tmp), treeitem)
      gElementArray.push(tmp);
    }
    tmp = element;
    while (tmp = getNeighborElement(tmp, NODE_PREVSIBLING)) {
      container.insertBefore(newHtmlTreeItem(tmp), treeitem)
      gElementArray.unshift(tmp);
      treeitem = treeitem.previousSibling;
    }

    // next parent node
    element = element.parentNode;
  } while (tag != "html");

  return selectedItem;
}

function newHtmlTreeItem(element, tag) {
  // user prefs instead of constants?
  var ShowId    = true;
  var ShowClass = true;
  var ShowAttrs = true;
  /* try {
    ShowId    = kzsPrefs.getBoolPref("ShowId");
    ShowClass = kzsPrefs.getBoolPref("ShowClass");
    ShowAttrs = kzsPrefs.getBoolPref("ShowAttrs");
  } catch (e) {}; */

  // Create tree element
  var treeitem = document.createElementNS(XUL_NS, "treeitem");
  var treerow  = document.createElementNS(XUL_NS, "treerow");
  var treecell = document.createElementNS(XUL_NS, "treecell");

  var tagId = "";
  if (ShowId && element.hasAttribute("id"))
    tagId = "#" + element.getAttribute("id");
  if (ShowClass && element.hasAttribute("class"))
    tagId += ' class="' + element.getAttribute("class") + '"';

  if (!tag) tag = element.nodeName.toLowerCase();
  treecell.setAttribute("label", tag + tagId);
  treecell.setAttribute("value", tag);
  treeitem.setAttribute("value", tag);
  //if (element.hasAttribute("style"))
    //treecell.setAttribute("properties", "inlineStyle");

  treerow.appendChild(treecell);
  treeitem.appendChild(treerow);
  //if (getNeighborElement(element, NODE_FIRSTCHILD));
    //treeitem.setAttribute("container", "true");

  return treeitem;
}

function onSelectHtmlItem(e) {
  if (gDialog.htmlTreeDisabled)
    return;

  e.stopPropagation(); // useless

  var selectedElement = GetSelectedElement();
  window.top.highlightNode(null);
  window.top.SelectFocusNodeAncestor(selectedElement, true);

  // XXX sandbox
  //StyleRuleView(selectedElement);
}

function onMouseOverHtmlItem(e) {
  // get hovered item index
  var row = {};
  var col = {};
  var obj = {};
  // see: mozilla/browser/components/bookmarks/content/bookmarksTree.xml
  gDialog.htmlTree.treeBoxObject.getCellAt(e.clientX, e.clientY, row, col, obj);
  var index = row.value;

  // store this index to try to spare a few cycles...
  if (index == gLastHoveredIndex)
    return;
  gLastHoveredIndex = index;

  // apply 'hover' property on the hovered treecell
  if (gLastHoveredCell)
    gLastHoveredCell.removeAttribute("properties");
  var treecell = gDialog.htmlTree.getElementsByTagName("treecell").item(index);
  if (treecell)
    treecell.setAttribute("properties", "hover");
  gLastHoveredCell = treecell;

  // highlight hovered element and ensure it's visible
  var element = gElementArray[index];
  window.top.highlightNode(element);
  window.top.scrollIntoCenterView(element);
}

function onMouseOutHtmlItem() {
  if (gLastHoveredCell)
    gLastHoveredCell.removeAttribute("properties");
  gLastHoveredCell = null;

  window.top.highlightNode(null);
  window.top.scrollIntoCenterView(GetSelectedElement());
}

function onOpenHtmlItem(e) {
  var selectedElement = GetSelectedElement();
  window.top.doAdvancedProperties(selectedElement);
}

function GetSelectedElement() {
  if (gDialog.htmlTree.view.selection.count != 1)
    return;

  var index = gDialog.htmlTree.view.selection.currentIndex;

  // XXX disable folding (ugly hack)
  var selectedItem = gDialog.htmlTree.getElementsByTagName("treeitem").item(index);
  if (selectedItem.hasAttribute("open"))
    selectedItem.setAttribute("open", "true");

  // debug
  //document.getElementById("domLabel").setAttribute("value", gElementArray[index].tagName);

  return gElementArray[index];
}


/*****************************************************************************\
 *                                                                           *
 *   CSS tree                                                                *
 *                                                                           *
\*****************************************************************************/

function FillCssTextBox(element) {
  // display all style rules that apply to the selected element
  // reference: mozilla/layout/inspector/public/inIDOMUtils.idl
  var DOMUtils = Components.classes["@mozilla.org/inspector/dom-utils;1"]
                           .getService(Components.interfaces["inIDOMUtils"]);
  var rules = DOMUtils.getCSSStyleRules(element);
  var count = rules.Count();

  var baseUrl;
  var tmp = "";
  for (var i = 0; i < count; i++) {
    var rule = rules.GetElementAt(i);
    var line = DOMUtils.getRuleLine(rule);
    var href = rule.parentStyleSheet.href;
    if (!href.match(/^chrome/) && !href.match(/^resource/)) {
      //tmp += MakeRelativeUrl(href, baseUrl) + ", line " + line + "\n";
      tmp += MakeRelativeUrl(href, baseUrl) + "\n";
      tmp += PrettyPrintCSS(rule.cssText, baseUrl, true) + "\n";
    }
  }

  if (element.hasAttribute("style"))
    tmp += element.getAttribute("style");

  //document.getElementById("domLabel").setAttribute("value", tmp);
  gDialog.domPanelText.value = tmp;
}

function FillCssTree(element) {
  CleanXulTree(gDialog.styleList);

  // display all style rules that apply to the selected element
  // reference: mozilla/layout/inspector/public/inIDOMUtils.idl
  var DOMUtils = Components.classes["@mozilla.org/inspector/dom-utils;1"]
                           .getService(Components.interfaces["inIDOMUtils"]);
  var rules = DOMUtils.getCSSStyleRules(element);
  var count = rules.Count();

  var baseUrl;
  var tmp = "";
  var prevStylesheetUrl = null;
  for (var i = 0; i < count; i++) {
    var rule = rules.GetElementAt(i);
    var line = DOMUtils.getRuleLine(rule);
    var href = rule.parentStyleSheet.href;
    if (!href.match(/^chrome/) && !href.match(/^resource/) && !href.match(/^about/)) {

      // append this stylesheet
      if (href != prevStylesheetUrl) {
        var stylesheetItem = document.createElementNS(XUL_NS, "treeitem");
        var ruleChildren   = document.createElementNS(XUL_NS, "treechildren");
        var treerow        = document.createElementNS(XUL_NS, "treerow");
        var treecell       = document.createElementNS(XUL_NS, "treecell");
        treecell.setAttribute("label", MakeRelativeUrl(href, baseUrl));
        treerow.appendChild(treecell);
        stylesheetItem.appendChild(treerow);
        stylesheetItem.setAttribute("container", "true");
        stylesheetItem.setAttribute("open", "true");
        stylesheetItem.appendChild(ruleChildren);
        gDialog.styleList.appendChild(stylesheetItem);
        prevStylesheetUrl = href;
      }

      // append this style rule
      var ruleItem     = document.createElementNS(XUL_NS, "treeitem");
      treerow          = document.createElementNS(XUL_NS, "treerow");
      treecell         = document.createElementNS(XUL_NS, "treecell");
      treecell.setAttribute("label", rule.selectorText);
      treerow.appendChild(treecell);
      ruleItem.appendChild(treerow);
      ruleItem.setAttribute("container", "true");
      ruleItem.setAttribute("open", "true");
      ruleChildren.appendChild(ruleItem);

      // append all properties
      ruleItem.appendChild(newCssPropertyChildren(rule.cssText, baseUrl));
    }
  }

  // append inline styles, if any
  if (element.hasAttribute("style")) {
    var style = element.getAttribute("style");
    var treeitem     = document.createElementNS(XUL_NS, "treeitem");
    treerow          = document.createElementNS(XUL_NS, "treerow");
    treecell         = document.createElementNS(XUL_NS, "treecell");
    treecell.setAttribute("label", "inline style");
    treerow.appendChild(treecell);
    treeitem.appendChild(treerow);
    treeitem.setAttribute("container", "true");
    treeitem.setAttribute("open", "true");
    treeitem.appendChild(newCssPropertyChildren(style, baseUrl));
    gDialog.styleList.appendChild(treeitem);
  }
}

function newCssPropertyChildren(cssText, baseUrl) {
  var properties = PrettyPrintCSS(cssText, baseUrl, false).split("\n");
  var propChildren = document.createElementNS(XUL_NS, "treechildren");
  for (var j = 0; j < properties.length; j++) {
    var propItem = document.createElementNS(XUL_NS, "treeitem");
    treerow      = document.createElementNS(XUL_NS, "treerow");
    treecell     = document.createElementNS(XUL_NS, "treecell");
    treecell.setAttribute("label", properties[j]);
    treerow.appendChild(treecell);
    propItem.appendChild(treerow);
    propChildren.appendChild(propItem);
  }
  return propChildren;
}

// CSS sandbox

/*
 *function FillCssTree(sheetsTree) {
 *  // remove all entries in the tree
 *  //CleanSheetsTree(sheetsTree);
 *
 *  // Look for the stylesheets attached to the current document
 *  // Get them from the STYLE and LINK elements because of async sheet loading :
 *  // the LINK element is always here while the corresponding sheet might be
 *  // delayed by network
 *  var headNode = GetHeadElement();
 *  if ( headNode && headNode.hasChildNodes() ) {
 *    var ssn = headNode.childNodes.length;
 *    objectsArray = new Array();
 *    if (ssn) {
 *      var i;
 *      gInsertIndex = -1;
 *      for (i=0; i<ssn; i++) {
 *        var ownerNode = headNode.childNodes[i];
 *        AddSheetEntryToTree(sheetsTree, ownerNode); 
 *      }
 *    }
 *  }
 *}
 *
 *function onSelectCssItem(e) {
 *  // get the selected tree item (if any)
 *  //var selectedItem = getSelectedItem(gDialog.sheetsTree);
 *  var selectedItem = getSelectedItem(gDialog.cssTree);
 *
 *  if (!objectsArray)
 *    return;
 *  // look for the object in objectsArray corresponding to the
 *  // selectedItem
 *  var i, l = objectsArray.length;
 *  var cssElt = null;
 *  var type   = null;
 *  if (selectedItem) {
 *    for (i=0; i<l; i++) {
 *      if (objectsArray[i].xulElt == selectedItem) {
 *        type   = objectsArray[i].type;
 *        cssElt = objectsArray[i].cssElt;
 *        break;
 *      }
 *    }
 *  }
 *
 *  if (!cssElt) return;
 *  if (type != STYLE_RULE) return;
 *
 *  if (gLastSelectedStyle) {
 *    var tmp = gLastSelectedStyle.getElementsByTagName("treechildren").item(0);
 *    gLastSelectedStyle.removeChild(tmp);
 *    gLastSelectedStyle.removeAttribute("container");
 *    gLastSelectedStyle.removeAttribute("open");
 *  }
 *  gLastSelectedStyle = selectedItem;
 *
 *  var properties = PrettyPrintCSS(cssElt.cssText, null, true);
 *  var treechildren = document.createElementNS(XUL_NS, "treechildren");
 *  var rules = PrettyPrintCSS(cssElt.cssText).split("\n");
 *  for (i=0; i<rules.length; i++) {
 *    var treeitem = document.createElementNS(XUL_NS, "treeitem");
 *    var treerow  = document.createElementNS(XUL_NS, "treerow");
 *    var treecell = document.createElementNS(XUL_NS, "treecell");
 *    treecell.setAttribute("label", rules[i]);
 *    treerow.appendChild(treecell);
 *    treeitem.appendChild(treerow);
 *    treechildren.appendChild(treeitem);
 *  }
 *  selectedItem.setAttribute("container", "true");
 *  selectedItem.setAttribute("open", "true");
 *  selectedItem.appendChild(treechildren);
 *}
 *
 *function onMouseOverCssItem(e) {
 *  // get hovered item index
 *  var row = {};
 *  var col = {};
 *  var obj = {};
 *  // see: mozilla/browser/components/bookmarks/content/bookmarksTree.xml
 *  gDialog.cssTree.treeBoxObject.getCellAt(e.clientX, e.clientY, row, col, obj);
 *  var index = row.value;
 *  if (index < 0)
 *    return;
 *
 *  // get hovered CSS rule
 *  var selectedItem = gDialog.cssTree.contentView.getItemAtIndex(index);
 *  var cssElt = null;
 *  if (selectedItem) {
 *    var i, l = objectsArray.length;
 *    for (i=0; i<l; i++) {
 *      if (objectsArray[i].xulElt == selectedItem) {
 *        cssElt = objectsArray[i].cssElt;
 *        break;
 *      }
 *    }
 *  }
 *
 *  // debug
 *  if (!cssElt) return;
 *  var properties = PrettyPrintCSS(cssElt.cssText, null, true);
 *  var selector   = cssElt.selectorText;
 *  gDialog.domPanelText.value = properties;
 *  document.getElementById("domLabel").setAttribute("value", selector);
 *
 *  //panel.openPopup(); // Gecko 1.9 only :-(
 *  return;
 *
 *  gDialog.domPanelText.value = cssElt.cssText;
 *  gDialog.domPanel.openPopup();
 *}
 *
 *function onMouseOutCssItem(e) {
 *  return;
 *  gDialog.domPanel.hidePopup();
 *}
 */

// These functions are already defined in editorUtilities.js
// but they don't work here
// TODO: find out why and remove this piece of shit

function GetHeadElement() {
  var editor = GetCurrentEditorFromSidebar();
  try {
    var headList = editor.document.getElementsByTagName("head");
    return headList.item(0);
  } catch (e) {}

  return null;
}

function GetDocumentBaseUrl() {
  var editorDoc = GetCurrentEditorFromSidebar().document;
  try {
    var docUrl;

    // if document supplies a <base> tag, use that URL instead 
    var baseList = editorDoc.getElementsByTagName("base");
    if (baseList) {
      var base = baseList.item(0);
      if (base)
        docUrl = base.getAttribute("href");
    }
    if (!docUrl) {
      //docUrl = GetDocumentUrl();
      docUrl = editorDoc.QueryInterface(Components.interfaces.nsIDOMHTMLDocument).URL;
    }

    //if (!window.top.IsUrlAboutBlank(docUrl))
    if (!docUrl.match(/^about/))
      return docUrl;
  } catch (e) {
    alert(e);
  }
  return "";
}

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
  //// XXX Should we use GetCurrentEditor().documentCharacterSet for 2nd param ?
  //var docPath = IOService.newURI(docUrl,   GetCurrentEditor().documentCharacterSet, null).path;
  //var urlPath = IOService.newURI(inputUrl, GetCurrentEditor().documentCharacterSet, null).path;
  // XXX Should we use GetCurrentEditor().documentCharacterSet for 2nd param ?
  var docPath = IOService.newURI(docUrl,   GetCurrentEditorFromSidebar().documentCharacterSet, null).path;
  var urlPath = IOService.newURI(inputUrl, GetCurrentEditorFromSidebar().documentCharacterSet, null).path;

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

// already defined but same problem
function PrettyPrintCSS(cssText, base, fullDeclaration) {
  var i, tmp;
  if (!cssText || !cssText.length) return ""; // Kaze
  
  // Make Hex Colors
  var colors = cssText.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g);
  if (colors) for (i = 0; i < colors.length; i++) {
    tmp = ConvertRGBColorIntoHEXColor(colors[i]);
    if (tmp != colors[i])
      cssText = cssText.replace(colors[i], tmp);
  }
  
  // Make relative URLs
  var fileNodes = cssText.match(/"file:\/\/[^"]+|url\(file:\/\/[^\)]+/g);
  if (fileNodes) for (var i = 0; i < fileNodes.length; i++) {
    fileNodes[i] = fileNodes[i].replace(/^"|^url\(/, '');
    tmp = MakeRelativeUrl(fileNodes[i], base);
    if (tmp != fileNodes[i])
      cssText = cssText.replace(fileNodes[i], tmp);
  }
  
  // indent
  var gIndent = "  ";
  if (fullDeclaration) {
    cssText = cssText.replace(/;[\s]*/g, ";\n" + gIndent)
                     .replace(/\{[\s]*/, "{\n" + gIndent)
                     .replace(/[\s]*\}/, "\n}");
  } 
  else { // output the content only
    cssText = cssText.replace(/^.*\{[\s]*/, '').replace(/[\s]*\}[\s]*$/, '') /* remove selector   */
                                               .replace(/;[\s]*/g, ";\n");   /* multi-line output */
  }
  
  // remove -moz-* artefacts
  cssText = cssText.replace(/[\s]*-moz-background-[^;]*;/g, "");
  cssText = cssText.replace(/([\s]*background-position:[\s]*)([^\s]+);/g, "$1 $2 $2;");
  cssText = cssText.replace(/([\s]*border:[\s]*)[^;]*none[^;]*;/g, "$1 none;");
  cssText = cssText.replace(/\s0pt/g, " 0");
  cssText = cssText.replace(/[\s]*$/g, "");
  
  return cssText; 
}

