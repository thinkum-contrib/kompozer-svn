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


// reference to the currently viewed/edited node
var gViewedElement = null;
var gEditedElement = null;
var gSourceEditor  = null;
var gSourceEditorModified = false;
    
// source dock: modal editor (browser+textbox) or classic editor (htmlEditor)?
const kModalSourceDock = false;

/*****************************************************************************\
 *                                                                           *
 *   DOM navigation                                                          *
 *                                                                           *
\*****************************************************************************/

const NODE_SELF        = 0;
const NODE_PARENT      = 1;
const NODE_PREVSIBLING = 2;
const NODE_NEXTSIBLING = 3;
const NODE_FIRSTCHILD  = 4;

function getNeighborElement(node, dir) {
  function notAnElement(node) {
    if (!node)
      return;
    if (node.nodeType != Node.ELEMENT_NODE)
      return true;
    if (node.tagName.toLowerCase() == "br")
      return true;
  }

  var element = node;
  if (element) switch (dir) {

    case NODE_PARENT:
      element = node.parentNode;
      break;

    case NODE_PREVSIBLING:
      element = node.previousSibling;
      while (notAnElement(element))
        element = element.previousSibling;
      break;

    case NODE_NEXTSIBLING:
      element = node.nextSibling;
      while (notAnElement(element))
        element = element.nextSibling;
      break;

    case NODE_FIRSTCHILD:
      var tag = element.tagName.toLowerCase();
      if (tag == "comment" || tag == "php")
        return null;
      element = node.firstChild;
      while (notAnElement(element))
        element = element.nextSibling;
      break;
  }
  return element;
}

function selectNeighborElement(dir) {
  var node = getNeighborElement(gLastFocusNode, dir);
  SelectFocusNodeAncestor(node, true);
}

function SelectFocusNodeAncestor(element, scroll) {  // overrides that in 'comm.jar/editor/content/editor.js'
  if (!element)
    return;

  var tag = element.tagName.toLowerCase();
  var editor = GetCurrentEditor();
  if (editor) switch(tag) {

    case "html":  // not selectable: display the HTML source and exit
      viewNodeSource(element);
      return;

    case "head":  // not selectable: update the structToolbar and exit
      UpdateStructToolbar(element);
      viewNodeSource(element);
      return;

    case "body":  // not selectable: select <body> content instead
      editor.selectAll();
      break;

    default:      // select element and ensure it's visible
      editor.selectElement(element);
      if (scroll)
        scrollIntoCenterView(element);
  }
  ResetStructToolbar();
}

/*****************************************************************************\
 *                                                                           *
 *   Enhanced StructToolbar                                                  *
 *                                                                           *
\*****************************************************************************/

// display a border around hovered element nodes
const kHoveredElementStyle = "-moz-outline: 2px dashed navy !important;";
var   gHoveredElementStyle = "";
var   gHoveredElement      = null;

function UpdateStructToolbar(node) {         // overrides that in 'comm.jar/editor/content/editor.js'
                                             // optional 'node' parameter
  var editor = GetCurrentEditor();
  if (!editor) return;

  // Kaze: use the optional 'node' parameter if provided
  var element, oneElementSelected;
  if (node) {
    oneElementSelected = node;
  } else {
    var mixed = GetSelectionContainer();
    if (!mixed) return;
    //element = mixed.node;
    node = mixed.node;
    oneElementSelected = mixed.oneElementSelected;
  }

  element = node;
  if (!element) return;

  NotifyProcessors(kProcessorsWhenSelectionChanges, element);

  if ((element == gLastFocusNode) && (oneElementSelected == gLastFocusNodeWasSelected))
    return;

  gLastFocusNode = element;
  //gLastFocusNodeWasSelected = mixed.oneElementSelected;
  gLastFocusNodeWasSelected = oneElementSelected;

  var toolbar = document.getElementById("structToolbar");
  if (!toolbar) return;
  var childNodes = toolbar.childNodes;
  var childNodesLength = childNodes.length;
  // We need to leave the <label> to flex the buttons to the left
  // so, don't remove the last child at position length - 1
  for (var i = childNodesLength - 2; i >= 0; i--)
    toolbar.removeChild(childNodes.item(i));

  toolbar.removeAttribute("label");

  if (IsInHTMLSourceMode()) {
    document.getElementById("structSpacer").setAttribute("flex", "1"); // Kaze
    // we have destroyed the contents of the status bar and are about to recreate it;
    // but we don't want to do that in Source mode
    return;
  }

  // XXX XXX
  // if (true) {
  // Kaze: don't mess with the rulers if they aren't displayed
  if (!document.getElementById("hRuler").parentNode.collapsed) {
    UpdateRulers(element);
    if (!gScrollListener)
      gScrollListener        = GetCurrentEditor().document.addEventListener("scroll", UpdateRulerRequestListener, false);
    if (!gResizeListener)
      gResizeListener        = window.addEventListener("resize", UpdateRulerRequestListener, false);
    if (!gEditorUpdatedListener)
      gEditorUpdatedListener = GetCurrentEditor().document.addEventListener("editorViewUpdated", UpdateRulerRequestListener, false);
  }

  //var bodyElement = GetBodyElement();
  var isFocusNode = true;
  var tmp;
  //var tag = gLastFocusNode.nodeName.toLowerCase();

  toolbar.firstChild.removeAttribute("style");

  var button;
  var firstIteration = true; // Kaze
  do {
    tag = element.nodeName.toLowerCase();

    button = newStructToolbarButton(element, tag);
    toolbar.insertBefore(button, toolbar.firstChild);

    if (isFocusNode && oneElementSelected) {
      button.setAttribute("checked", "true");
      isFocusNode = false;
    }
    if (firstIteration) {
      // Kaze: the fist button should take all the available space
      //       to ease the use of the mouse wheel
      document.getElementById("structSpacer").setAttribute("flex", "0");
      button.setAttribute("flex", "1");
      firstIteration = false;
    }
    tmp = element;
    element = element.parentNode;
  } while (tag != "html");
  //} while (tag != "body" && tag != "head" && tag != "html");
  //} while (tmp != bodyElement);
  
  // display the source if the previewer is not collapsed
  //viewPartialSourceForFragment(gLastFocusNode);
  //viewNodeSource(gLastFocusNode); // faster and nicer but requires to patch the trunk to escape NvuNS nodes
  viewNodeSource(node);
}

function newStructToolbarButton(element, tag) {
  // user prefs instead of constants?
  var ShowId    = true;
  var ShowClass = true;
  var ShowAttrs = true;
  /* try {
    ShowId    = kzsPrefs.getBoolPref("ShowId");
    ShowClass = kzsPrefs.getBoolPref("ShowClass");
    ShowAttrs = kzsPrefs.getBoolPref("ShowAttrs");
  } catch (e) {}; */

  // Get element ID and class list to add them in the button label
  //  - other attributes are displayed in the tooltip
  var attrName, attrValue, attref;
  var attr = element.attributes;
  var hasStyle = false;
  var ttip = "";
  var tagId = "";
  if (!tag) tag = element.nodeName.toLowerCase();
  if (attr && tag != "php" && tag != "comment") for (attref = 0; attref < attr.length; attref++) {
    attrName  = attr[attref].nodeName;
    attrValue = attr[attref].value;
    if (ShowId && (attrName == "id"))
      tagId = '#' + attrValue + tagId;
      //tagId = ' id="' + attrValue + '"' + tagId;
    else if (ShowClass && (attrName == "class"))
      tagId += ' class="' + attrValue + '"';
    else if (ShowAttrs && !(/^_moz/).test(attrName))
      ttip += attrName + '="' + attrValue + '" ';
    if (attrName == "style")
      hasStyle = true;
  }
  
  // Create button
  var button = document.createElementNS(XUL_NS, "toolbarbutton");
  button.className = "struct-button";
  button.setAttribute("label", "<" + tag + tagId + ">");
  button.setAttribute("value", tag);
  if (ttip != "")
    button.setAttribute("tooltiptext", ttip);
  if (hasStyle)
    button.setAttribute("style", "font-style: italic;");

  // Add event handlers and context menu
  button.addEventListener("command",        newCommandListener    (button, element), false);
  button.addEventListener("DOMMouseScroll", newMouseScrollListener(button, element), false);

  if (tag != "html" && tag != "head") {
    button.addEventListener("contextmenu",  newContextmenuListener(button, element), false);
    button.addEventListener("click",        newMouseClickListener(element), false);
    button.addEventListener("mouseover",    newMouseOverListener (element), false);
    button.addEventListener("mouseout",     newMouseOutListener  (element), false);

    button.setAttribute("context", "structToolbarContext");
  }
  //var popup = document.getElementById("structToolbarPopup").cloneNode(true);
  //button.setAttribute("type", "menu-button");
  //button.appendChild(popup);
  return button;
}

function newCommandListener(button, element) {
  return function() {
    if (gEditedElement) // edition in progress
      return;
    highlightNode(null);
    SelectFocusNodeAncestor(element);
  };
}

function newMouseOverListener(element) {
  return function() {
    if (!gEditorFocus || gEditedElement) // window not focused or edition in progress
      return;
    highlightNode(element);
  };
}

function newMouseOutListener(element) {
  return function() {
    if (!gEditorFocus || gEditedElement) // window not focused or edition in progress
      return;
    highlightNode(null);
    gContentWindow.focus();
  };
}

function newMouseClickListener(element) {
  return function(event) {
    if (gEditedElement)      // edition in progress
      return;
    if (event.button == 1) { // middle-click: select first child element
      highlightNode(null);
      gLastFocusNode = element;
      selectNeighborElement(NODE_FIRSTCHILD);
      //highlightNode(null);
      //viewNodeSource(element);
    }
  }
}

function newMouseScrollListener(button, element) {
  return function(event) {
    if (gEditedElement) // edition in progress
      return;
    var dir = (event.detail > 0) ? NODE_NEXTSIBLING : NODE_PREVSIBLING;
    var tmp = getNeighborElement(element, dir);
    if (!tmp)
      return;
    SelectFocusNodeAncestor(tmp, true);
  }
}

function highlightNode(element) {
  // to be called on StructToolbar button click/mouseover

  if (gHoveredElement) {
    // an element is already hovered, remove the border
    if (gHoveredElementStyle.length)
      gHoveredElement.setAttribute("style", gHoveredElementStyle);
    else
      gHoveredElement.removeAttribute("style");
  }

  gHoveredElement = element;

  if (element) {
    // store the element's inner style and display a border around it
    gHoveredElementStyle = element.hasAttribute("style") ? element.getAttribute("style") : "";
    gHoveredElement.setAttribute("style", gHoveredElementStyle + kHoveredElementStyle);
  } else
    gHoveredElementStyle = "";

  return;
}

/*****************************************************************************\
 *                                                                           *
 *   HTML code preview                                                       *
 *                                                                           *
\*****************************************************************************/

function getBrowser() {
  return document.getElementById("SourceBrowser");
}

function onViewSourceContextMenu() {
  var tag = gViewedElement.tagName.toLowerCase();
  var node = (tag != "html" && tag != "head" && tag != "body") ? "false" : "true";
  var head = (tag == "html" || tag == "head") ? "false" : "true";
  var body = (tag == "body") ? "false" : "true";
  document.getElementById("vMenu_editHead").setAttribute("hidden", head);
  document.getElementById("vMenu_editBody").setAttribute("hidden", body);
  document.getElementById("vMenu_editNode").setAttribute("hidden", node);

  // wrap long lines?
  if (gPrefs) try {
    var wrap = gPrefs.getBoolPref("view_source.wrap_long_lines");
    if (wrap)
      document.getElementById('cMenu_wrapLongLines').setAttribute("checked", "true");
  } catch (ex) {}
}

function viewNodeSource(node) {
  // cancel if the source dock is collapsed
  if (!node || gSourceBrowserDeck.collapsed)
    return;

  highlightNode(null);
  gViewedElement = node;

  // clone the fragment of interest and reset everything to be relative to it
  // note: it is with the clone that we operate/munge from now on
  node = node.cloneNode(true);

  // extract and display the syntax highlighted source
  var doc = node.ownerDocument;
  tmpNode = doc.createElementNS(NS_XHTML, 'div');
  tmpNode.appendChild(node);

  // hide NVU_NS nodes
  MakePhpAndCommentsInvisible(doc, tmpNode);

  // all our content is held by the data:URI and URIs are internally stored as utf-8 (see nsIURI.idl)
  var loadFlags = Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;
  getBrowser().webNavigation
              .loadURI("view-source:data:text/html;charset=utf-8," + encodeURIComponent(tmpNode.innerHTML),
                       loadFlags, null, null, null);

  delete(tmpNode);
}

function viewPartialSourceForFragment(node) {
  gTargetNode = node;
  if (gTargetNode && gTargetNode.nodeType == Node.TEXT_NODE)
    gTargetNode = gTargetNode.parentNode;

  // walk up the tree to the top-level element (e.g., <math>, <svg>)
  /*
   *var topTag;
   *if (context == 'mathml')
   *  topTag = 'math';
   *else
   *  throw 'not reached';
   *var topNode = gTargetNode;
   *while (topNode && topNode.localName != topTag)
   *  topNode = topNode.parentNode;
   *if (!topNode)
   *  return;
   */
  var topNode = gTargetNode;

  // serialize
  //const gViewSourceCSS = 'resource://gre/res/viewsource.css';
  var title = "";
  //var title = getViewSourceBundle().getString("viewMathMLSourceTitle");
  //var wrapClass = gWrapLongLines ? ' class="wrap"' : '';
  var source =
    '<html>'
  + '<head><title>' + title + '</title>'
  + '<link rel="stylesheet" type="text/css" href="' + gViewSourceCSS + '">'
  //+ '<style type="text/css">'
  //+ '#target { border: dashed 1px; background-color: lightyellow; }'
  //+ '</style>'
  + '</head>'
  + '<body id="viewsource" class="wrap"'
  +        ' onload="document.title=\''+title+'\';document.getElementById(\'target\').scrollIntoView(true)">'
  + '<pre>'
  + getOuterMarkup(topNode, 0)
  + '</pre></body></html>'
  ; // end

  // display
  var doc = getBrowser().contentDocument;
  doc.open("text/html", "replace");
  doc.write(source);
  doc.close();
}

function getOuterMarkup(node, indent) {
  var newline = '';
  var padding = '';
  var str = '';
  if (node == gTargetNode) {
    gStartTargetLine = gLineCount;
    str += '</pre><pre id="target">';
  }

  switch (node.nodeType) {
  case Node.ELEMENT_NODE: // Element
    // to avoid the wide gap problem, '\n' is not emitted on the first
    // line and the lines before & after the <pre id="target">...</pre>
    if (gLineCount > 0 &&
        gLineCount != gStartTargetLine &&
        gLineCount != gEndTargetLine) {
      newline = '\n';
    }
    gLineCount++;
    if (gDebug) {
      newline += gLineCount;
    }
    for (var k = 0; k < indent; k++) {
      padding += ' ';
    }
    str += newline + padding
        +  '&lt;<span class="start-tag">' + node.nodeName + '</span>';
    for (var i = 0; i < node.attributes.length; i++) {
      var attr = node.attributes.item(i);
      if (!gDebug && attr.nodeName.match(/^[-_]moz/)) {
        continue;
      }
      str += ' <span class="attribute-name">'
          +  attr.nodeName
          +  '</span>=<span class="attribute-value">"'
          +  unicodeTOentity(attr.nodeValue)
          +  '"</span>';
    }
    if (!node.hasChildNodes()) {
      str += '/&gt;';
    }
    else {
      str += '&gt;';
      var oldLine = gLineCount;
      str += getInnerMarkup(node, indent + 2);
      if (oldLine == gLineCount) {
        newline = '';
        padding = '';
      }
      else {
        newline = (gLineCount == gEndTargetLine) ? '' : '\n';
        gLineCount++;
        if (gDebug) {
          newline += gLineCount;
        }
      }
      str += newline + padding
          +  '&lt;/<span class="end-tag">' + node.nodeName + '</span>&gt;';
    }
    break;
  case Node.TEXT_NODE: // Text
    var tmp = node.nodeValue;
    tmp = tmp.replace(/(\n|\r|\t)+/g, " ");
    tmp = tmp.replace(/^ +/, "");
    tmp = tmp.replace(/ +$/, "");
    if (tmp.length != 0) {
      str += '<span class="text">' + unicodeTOentity(tmp) + '</span>';
    }
    break;
  default:
    break;
  }

  if (node == gTargetNode) {
    gEndTargetLine = gLineCount;
    str += '</pre><pre>';
  }
  return str;
}

// toggle long-line wrapping
// and set the view_source.wrap_long_lines pref to persist the last state
function wrapLongLines() {     // taken from /toolkit/components/viewsource/
  //var myWrap = window._content.document.body;
  var myWrap = getBrowser().contentDocument.body;

  if (myWrap.className == '')
    myWrap.className = 'wrap';
  else
    myWrap.className = '';

  // since multiple viewsource windows are possible, another window could have affected the pref,
  // so instead of determining the new pref value via the current pref value, we use myWrap.className  
  if (gPrefs) try {
    gPrefs.setBoolPref("view_source.wrap_long_lines", (myWrap.className.length > 0));
  } catch (ex) {}
}

// toggle syntax highlighting
// and set the view_source.syntax_highlight pref to persist the last state
function highlightSyntax() {   // taken from /toolkit/components/viewsource/
  const pageLoaderIface = Components.interfaces.nsIWebPageDescriptor;
  var highlightSyntaxMenu = document.getElementById("cMenu_highlightSyntax");
  var highlightSyntax = (highlightSyntaxMenu.getAttribute("checked") == "true");
  if (gPrefs) try {
    gPrefs.setBoolPref("view_source.syntax_highlight", highlightSyntax);
  } catch (ex) {}

  var PageLoader = getBrowser().webNavigation.QueryInterface(pageLoaderIface);
  PageLoader.loadPage(PageLoader.currentDescriptor, pageLoaderIface.DISPLAY_NORMAL);
}

/*****************************************************************************\
 *                                                                           *
 *   HTML code editor                                                        *
 *                                                                           *
\*****************************************************************************/

function onClickSourceDock(e) {
  // cancel if already in edition mode
  if (gEditedElement)
    return;

  dump("click\n");
  if (e.button == 0)
    editNodeStart();
    //editNodeToggle();
}

function onKeypressSourceDock(e) {
  if (e.keyCode == KeyEvent.DOM_VK_ESCAPE) {
    // cancel default [Esc] behavior because it would cause gSourceEditor to blur...
    // which would raise a 'blur' event, thus validating the changes.
    e.preventDefault();  // required in Gecko 1.8
    e.stopPropagation();
    // [Esc] has been pressed, cancel edition
    editNodeCancel();
  }
}

function editNodeStart() {
  // cancel if no editor (should never happen)
  var editor = GetCurrentEditor();
  if (!editor) return;

  // we're entering the source dock, let's ensure it is visible
  SetEditMode(kEditModeSplit);

  // we can't edit the whole HTML tree with that source dock
  // so if <html> is selected, edit the <head> node
  if (gViewedElement.tagName.toLowerCase() == "html")
    gViewedElement = gViewedElement.firstChild;

  if (kModalSourceDock) { // modal editor
    // create gSourceEditor textbox dynamically:
    // looks like it's the easiest way to clear its undo history
    gSourceEditor = document.createElementNS(XUL_NS, "textbox");
    gSourceEditor.setAttribute("flex",      "1");
    gSourceEditor.setAttribute("type",      "text");
    gSourceEditor.setAttribute("multiline", "true");
    gSourceEditor.setAttribute("context",   "editorSourceContext");
    gSourceEditor.setAttribute("oninput",   "gSourceEditorModified = true;");
    gSourceBrowserDeck.appendChild(gSourceEditor);

    // get HTML markup
    var tagName = gViewedElement.tagName.toLowerCase();
    if (tagName == "head" || tagName == "body") {
      gSourceEditor.value = gViewedElement.innerHTML;
    }
    else {
      // hide NVU_NS nodes
      MakePhpAndCommentsInvisible(gViewedElement.ownerDocument, gViewedElement);
      // selected the element and get its HTML code
      var selection;
      SelectFocusNodeAncestor(gViewedElement);
      try {
        selection = editor.outputToString("text/html", 35); // OutputWrap+OutputFormatted+OutputSelectionOnly
      } catch (e) {}
      if (selection)
        selection = (selection.replace(/<body[^>]*>/,"")).replace(/<\/body>/,"");
      if (selection)
        gSourceEditor.value = selection;
    }

    // Set initial focus
    gSourceEditor.focus();
    gSourceEditor.setSelectionRange(0,0);
    gSourceBrowserDeck.selectedIndex = 1;
  }
  else {                  // classic editor
    // much less to do, the HTML markup being already loaded :-)
    gSourceEditor = getBrowser();
    gSourceEditor.contentWindow.focus();
  }

  // auto-confirm changes when the user clicks outside the source editor
  gSourceEditor.addEventListener("blur",     editNodeApply,        true);

  // cancel default [Esc] behavior because it would cause gSourceEditor to blur
  gSourceEditor.addEventListener("keypress", onKeypressSourceDock, true);

  gEditedElement = gViewedElement;
  gSourceEditorModified = false;
  dump("source dock focused\n");
}

function editNodeApply() {
  // get an nsIEditor instance on <editor> if needed
  if (!kModalSourceDock) {
    try {
      //var srcEditor = gSourceEditor.getEditor(gSourceEditor.contentWindow);
      var srcEditor = gSourceEditor.getHTMLEditor(gSourceEditor.contentWindow);
      // XXX remove (at least) one line below
      srcEditor instanceof Components.interfaces.nsIPlaintextEditor;
      srcEditor instanceof Components.interfaces.nsIHTMLEditor;
    } catch (e) { dump (e)+"\n"; }
    gSourceEditorModified = srcEditor.documentModified;
  }

  // cancel if no modifications found
  if (!gSourceEditorModified) {
    editNodeCancel();
    return;
  }

  // cancel if no editor (should never happen)
  var editor = GetCurrentEditor();
  if (!editor || !gEditedElement) return;

  // get the current element's tag name and HTML markup
  var html = null;
  var tagName = gViewedElement.tagName.toLowerCase();
  if (kModalSourceDock) {
    html = gSourceEditor.value.replace(/\s*$/, '');
  }
  else {
    html = srcEditor.outputToString(kTextMimeType, 1024).replace(/\s*$/, '');
    if (tagName == "head")
      html = html.replace(/\s*<head>\s*/, '').replace(/\s*<\/head>\s*/, '');
    else if (tagName == "body") // XXX ugly *temporary* hack
      html = html.replace(/\s*<body>\s*/, '').replace(/\s*<\/body>\s*/, '');
  }

  // flush changes
  dump("updating <" + tagName + ">\n");
  if (html) try {
    if (gViewedElement.tagName.toLowerCase() == "head") {
      // <head> element
      editor.beginTransaction();
      editor.incrementModificationCount(1);
      gEditedElement.innerHTML = html;

      // Update document title
      // (must do this for proper conversion of "escaped" characters)
      var title = "";
      var titlenodelist = editor.document.getElementsByTagName("title");
      if (titlenodelist) {
        var titleNode = titlenodelist.item(0);
        if (titleNode && titleNode.firstChild && titleNode.firstChild.data)
          title = titleNode.firstChild.data;
        // XXX HACK glazou
        if (title == "\n")
          title = "";
      }
      if (editor.document.title != title)
        SetDocumentTitle(title);
      editor.endTransaction();
    }
    else {
      SelectFocusNodeAncestor(gEditedElement);
      editor.insertHTML(html);
      // show NVU_NS nodes
      MakePhpAndCommentsVisible(gEditedElement.ownerDocument, gEditedElement);
    }
  } catch (e) {}
  editNodeLeave();
  GetCurrentEditor().selection.collapseToStart();
}

function editNodeCancel() {
  // this function is triggered when the users presses Esc:
  // it can be called from the source dock or from the source tab
  dump("source dock cancelled\n");

  if (IsInHTMLSourceMode()) {
    // if we're in Source mode, discard changes
    CancelHTMLSource()
  } else {
    // leave source dock without updating the document
    MakePhpAndCommentsVisible(gEditedElement.ownerDocument, gEditedElement);
    editNodeLeave();
  }
}

function editNodeToggle() {
  // this function is triggered when the users presses Alt+Enter:
  // it can be called to enter the source dock (start editing)
  // or to leave the source dock or the source tab (flush changes)

  if (IsInHTMLSourceMode()) // if we're in Source mode, apply changes
    FinishHTMLSource()
  else if (gEditedElement)  // if we're editing an element in the source dock, apply changes
    editNodeApply();
  else                      // if we're not already editing an element, start editing
    editNodeStart();
}

function editNodeLeave() {
  // refresh source dock (might be redundant)
  viewNodeSource(gEditedElement);
  gEditedElement = null;

  // remove OK/Cancel event handlers
  gSourceEditor.removeEventListener("blur",     editNodeApply,        true);
  gSourceEditor.removeEventListener("keypress", onKeypressSourceDock, true);

  // when using the modal editor, destroy the textbox and switch to "view" mode
  if (kModalSourceDock) {
    gSourceBrowserDeck.selectedIndex = 0;
    gSourceBrowserDeck.removeChild(gSourceEditor);
    delete(gSourceEditor);
  }

  // set the focus to the main window
  gContentWindow.focus();
}

/*****************************************************************************\
 *                                                                           *
 *   Auto-scrolling (taken from Firebug)                                     *
 *                                                                           *
\*****************************************************************************/

function scrollIntoCenterView(element, notX, notY) {
  if (!element)
    return;

  var scrollBox = getOverflowParent(element);
  if (!scrollBox)
    return;

  var offset = getClientOffset(element);

  if (!notY) {
    var topSpace = offset.y - scrollBox.scrollTop;
    var bottomSpace = (scrollBox.scrollTop + scrollBox.clientHeight) - (offset.y + element.offsetHeight);

    if (topSpace < 0 || bottomSpace < 0) {
        var centerY = offset.y - (scrollBox.clientHeight/2);
        scrollBox.scrollTop = centerY;
    }
  }

  if (!notX) {
    var leftSpace = offset.x - scrollBox.scrollLeft;
    var rightSpace = (scrollBox.scrollLeft + scrollBox.clientWidth) - (offset.x + element.clientWidth);

    if (leftSpace < 0 || rightSpace < 0) {
        var centerX = offset.x - (scrollBox.clientWidth/2);
        scrollBox.scrollLeft = centerX;
    }
  }
};

function getOverflowParent(element) { // not working yet
  /*
   *for (var scrollParent = element.parentNode; scrollParent; scrollParent = scrollParent.offsetParent)
   *  if (scrollParent.scrollHeight > scrollParent.offsetHeight)
   *    return scrollParent;
   */
  // Kaze: since the above code doesn't work, just return the <html> node
  return GetBodyElement().parentNode;
}

function getClientOffset(elt) {
  function addOffset(elt, coords, view) {
    var p = elt.offsetParent;
    var style = view.getComputedStyle(elt, "");

    if (elt.offsetLeft)
      coords.x += elt.offsetLeft + parseInt(style.borderLeftWidth);
    if (elt.offsetTop)
      coords.y += elt.offsetTop + parseInt(style.borderTopWidth);

    if (p) {
      if (p.nodeType == 1)
        addOffset(p, coords, view);
    }
    else if (elt.ownerDocument.defaultView.frameElement)
      addOffset(elt.ownerDocument.defaultView.frameElement, coords, elt.ownerDocument.defaultView);
  }

  var coords = {x: 0, y: 0};
  if (elt) {
    var view = elt.ownerDocument.defaultView;
    addOffset(elt, coords, view);
  }

  return coords;
};

