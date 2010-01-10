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
 * The Original Code is KompoZer.
 *
 * The Initial Developer of the Original Code is
 * Fabien Cazenave.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Original author: Fabien Cazenave <kaze@kompozer.net>
 *   Fabien 'kasparov' Rocu <ohsammynator@gmail.com>
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
  gDialog.htmlTree = document.getElementById("htmlTree");
  gDialog.htmlList = document.getElementById("htmlList");
  gDialog.attrTree = document.getElementById("attrTree"); // kasparov
  gDialog.attrList = document.getElementById("attrList"); // kasparov
  gDialog.cssTree  = document.getElementById("cssTree");
  gDialog.cssList  = document.getElementById("cssList");
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
  //var head = window.top.GetHeadElement();
  //if (!head)
    //dump("no <head> found");
  //InitSheetsTree(gDialog.sheetsTree);
  //FillStyleTree(gDialog.sheetsTree);
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
  } catch(e) {
    // for some reason, when DOM explorer is closed and reopen, all global variables are lost for some time
    // so exit in order not to break the kProcessorsWhenSelectionChanges chain
    return;
  }

  if (0) try { // XXX
    // this dump shows that this function is called too often...
    // there's room for improvement here.
    dump("refresh"
        + "\n node = " + node.nodeName
        + "\n gLastSelectedElement = " + gLastSelectedElement.nodeName
    );
  } catch(e) {
    // XXX
    dump(e);
  }

  gLastSelectedElement = node;
  try { // htmlTree is hidden if we're in CSS-only mode
    gDialog.htmlTree.view.selection.clearSelection();
  } catch(e) {}

  //NotifyProcessors(kProcessorsWhenSelectionChanges, element);
  //if ((element == gLastFocusNode) && (oneElementSelected == gLastFocusNodeWasSelected))

  var selectedItem = FillHtmlTree(node);
  FillAttributeTree(node); // kasparov
  FillCssTree(node);
  
  // show the selected node in the HTML tree
  gDialog.htmlTreeDisabled = true;

  try { // htmlTree is hidden if we're in CSS-only mode
    var itemIndex = gDialog.htmlTree.contentView.getIndexOfItem(selectedItem);
    gDialog.htmlTree.view.selection.select(itemIndex);
    gDialog.htmlTree.treeBoxObject.ensureRowIsVisible(itemIndex);

    gDialog.htmlTreeDisabled = false;
  } catch(e) {}
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
 *   Duplicate of /composer/editor/viewSource.js                             *
 *                                                                           *
\*****************************************************************************/

const NODE_SELF        = 0;
const NODE_PARENT      = 1;
const NODE_PREVSIBLING = 2;
const NODE_NEXTSIBLING = 3;
const NODE_FIRSTCHILD  = 4;

function getNeighborElement(node, dir) {
  return window.top.getNeighborElement(node, dir);
}

function selectNeighborElement(dir) {
  return window.top.selectNeighborElement(dir);
}

function SelectFocusNodeAncestor(element, scroll) {
  return window.top.SelectFocusNodeAncestor(element, scroll);
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
  CleanXulTree(gDialog.htmlList);

  // return if we're on a text document
  if (window.parent.gTabEditor.IsTextDocument())
    return;

  // fill HTML tree & array
  var treeitem, container, sibling;
  var selectedItem;
  var firstIteration = true;
  var isFragment = window.parent.gTabEditor.IsHtmlFragment();
  var tag;
  var tmp;
  do {
    tag = element.tagName.toLowerCase();

    // don't create html/head/body treeitems for HTML fragments
    if (isFragment && (tag == "body"))
      break;

    // create treeitem
    treeitem = newHtmlTreeItem(element, tag);
    gElementArray.unshift(element);

    if (firstIteration) { // selected node
      firstIteration = false;
      selectedItem = treeitem;
      // append all children elements
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
    
    // create container if needed (or use gDialog.htmlList as main container)
    if ((tag == "html") || (isFragment && (element.parentNode.tagName.toLowerCase() == "body")))
      container = gDialog.htmlList;
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

function onEditHtmlItem(e) {
  // TODO: use nsObjectPropertiesCommand instead
  window.top.doAdvancedProperties(GetSelectedElement());
}

function GetSelectedElement() {
  if (gDialog.htmlTree.view.selection.count != 1)
    return;

  var index = gDialog.htmlTree.view.selection.currentIndex;

  // XXX disable folding (ugly hack)
  var selectedItem = gDialog.htmlTree.getElementsByTagName("treeitem").item(index);
  if (selectedItem.hasAttribute("open"))
    selectedItem.setAttribute("open", "true");

  return gElementArray[index];
}

/*****************************************************************************\
 *                                                                           *
 *   Attribute tree                                                          *
 *                                                                           *
\*****************************************************************************/

// kasparov
function FillAttributeTree(node) {
  CleanXulTree(gDialog.attrList);
  allAttributes = node.attributes;
  for (var i = 0; i < allAttributes.length; i++ ) {
    if (!allAttributes[i].nodeName.match(/^_moz_.*/) ) {
      var treeitem = addNewAttributeItem(allAttributes[i].nodeName, allAttributes[i].nodeValue);
      gDialog.attrList.appendChild(treeitem);
    }
  }
}

// kasparov
function addNewAttributeItem(name, value) {
  var treeitem  = document.createElementNS(XUL_NS, "treeitem");
  var treerow   = document.createElementNS(XUL_NS, "treerow");
  var attrName  = document.createElementNS(XUL_NS, "treecell");
  var attrValue = document.createElementNS(XUL_NS, "treecell");

  attrName.setAttribute("label", name);
  attrName.setAttribute("value", name);
  treeitem.setAttribute("value", name);
  
  attrValue.setAttribute("label", value);
  attrValue.setAttribute("value", value);

  treerow.appendChild(attrName);
  treerow.appendChild(attrValue);
  treeitem.appendChild(treerow);

  return treeitem;
}

function onEditAttrItem(e) {
  window.top.doAdvancedProperties(GetSelectedElement());
}

/*****************************************************************************\
 *                                                                           *
 *   CSS tree                                                                *
 *                                                                           *
\*****************************************************************************/

function FillCssTree(element) {
  CleanXulTree(gDialog.cssList);

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
    var line = DOMUtils.getRuleLine(rule); // unused at the moment
    var href = rule.parentStyleSheet.href;
    if (!href.match(/^chrome/) && !href.match(/^resource/) && !href.match(/^about/)) {

      // append this stylesheet
      if (href != prevStylesheetUrl) {
        var stylesheetItem = document.createElementNS(XUL_NS, "treeitem");
        var ruleChildren   = document.createElementNS(XUL_NS, "treechildren");
        var treerow        = document.createElementNS(XUL_NS, "treerow");
        var treecell       = document.createElementNS(XUL_NS, "treecell");
        var docUrl = window.top.MakeRelativeUrl(href, baseUrl);
        if (docUrl.length == 0)
          docUrl = href; // not perfect, but better than an empty string
        treecell.setAttribute("label", docUrl);
        treerow.appendChild(treecell);
        stylesheetItem.appendChild(treerow);
        stylesheetItem.setAttribute("container", "true");
        stylesheetItem.setAttribute("open", "true");
        stylesheetItem.appendChild(ruleChildren);
        gDialog.cssList.appendChild(stylesheetItem);
        prevStylesheetUrl = href;
      }

      // append this style rule
      var ruleItem = document.createElementNS(XUL_NS, "treeitem");
      treerow      = document.createElementNS(XUL_NS, "treerow");
      treecell     = document.createElementNS(XUL_NS, "treecell");
      treecell.setAttribute("label", rule.selectorText);
      treerow.appendChild(treecell);
      /* kasparov: adding the line number (disabled at the moment)
      var lineNumber = document.createElementNS(XUL_NS, "treecell");
      lineNumber.setAttribute("label", line);
      treerow.appendChild(lineNumber);
      */
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
    var treeitem = document.createElementNS(XUL_NS, "treeitem");
    treerow      = document.createElementNS(XUL_NS, "treerow");
    treecell     = document.createElementNS(XUL_NS, "treecell");
    treecell.setAttribute("label", "inline style");
    treerow.appendChild(treecell);
    treeitem.appendChild(treerow);
    treeitem.setAttribute("container", "true");
    treeitem.setAttribute("open", "true");
    treeitem.appendChild(newCssPropertyChildren(style, baseUrl));
    gDialog.cssList.appendChild(treeitem);
  }
}

function newCssPropertyChildren(cssText, baseUrl) {
  var properties = PrettyPrintCSS(cssText, baseUrl, false).split("\n");
  var propChildren = document.createElementNS(XUL_NS, "treechildren");
  for (var j = 0; j < properties.length; j++) {
    var propItem = document.createElementNS(XUL_NS, "treeitem");
    var treerow  = document.createElementNS(XUL_NS, "treerow");
    var attr     = document.createElementNS(XUL_NS, "treecell");
    var value    = document.createElementNS(XUL_NS, "treecell");                 // kasparov
    var properties_split = properties[j].split(": ");                            // kasparov
    attr.setAttribute("label", properties_split[0]);                             // kasparov   
    value.setAttribute("label", properties_split[1].replace(/;[\s\r\n]*$/, "")); // kasparov
    treerow.appendChild(attr);
    treerow.appendChild(value);                                                  // kasparov
    propItem.appendChild(treerow);
    propChildren.appendChild(propItem);
  }
  return propChildren;
}

function onEditCssItem(e) {
  // Get the property level in the tree:
  //  * stylesheet properties are on the third level
  //  * inline style properties are on the second level
  var level = 0;
  var view  = gDialog.cssTree.view;
  var sel   = view.selection.currentIndex; // returns -1 if not focused
  if (view.selection.count) {
    var item  = view.getItemAtIndex(sel);
    var tmp   = item;
    while (tmp.parentNode.parentNode.tagName.toLowerCase() == "treeitem") {
      tmp = tmp.parentNode.parentNode;
      level++;
    }
    tmp = item;
    while (tmp.getElementsByTagName("treechildren").length > 0) {
      tmp = tmp.getElementsByTagName("treechildren").item(0).firstChild; 
      level++;
    }
  }

  // Open CSS editor
  if (level >= 2) {
    // stylesheet editor
    window.top.openCascadesDialog();
  }
  else {
    // inline style editor
    window.top.gContextMenuFiringDocumentElement = GetSelectedElement();
    window.top.openDialog("chrome://cascades/content/allProps.xul", 
      "_blank", "chrome,close,titlebar,modal", "all", "Inline Styles", false);
  }
}

// XXX we have to redefine this function here... at least for now.
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
    tmp = window.top.MakeRelativeUrl(fileNodes[i], base); // calling from the sidebar...
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

