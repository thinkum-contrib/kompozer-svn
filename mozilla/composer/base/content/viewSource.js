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
 * The Original Code is KompoZer, an enhanced version of Mozilla Composer.
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
var gEditedElement = null;
    
// source dock: modal editor (browser+textbox) or classic editor (htmlEditor)?
//const kModalSourceDock = false;

// source dock: always edit innerHTML, or edit the full node when possible?
const kAlwaysEditInnerHTML = false;

// source dock: enable|disable pseudo syntax highlighting?
const kColoredSourceView = true;


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

// these elements are considered as "blocks" for caret movements
const BLOCK_NODENAMES = [
  "body", "div", "table", "ol", "ul", "dl", "object",
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "address"
];

function putCaretWithBR(dir) {
  // get the first block container of the current node
  var block = gLastFocusNode;
  while (BLOCK_NODENAMES.indexOf(block.nodeName.toLowerCase()) < 0)
    block = block.parentNode;
  if (block.nodeName.toLowerCase() == "body")
    return;

  // get the position of the current block in its parent
  var blockSiblings = block.parentNode.childNodes;
  var offset = blockSiblings.length -1;
  while ((offset >= 0) && (blockSiblings[offset] != block))
    offset--;
  if (offset < 0)                   // should never happen...
    return;
  if (dir == NODE_NEXTSIBLING)      // insert after current block
    offset++;
  else if (dir != NODE_PREVSIBLING) // wrong 'dir' param, exit
    return;

  // insert a <br> next to the current block and put the caret there
  var editor = GetCurrentEditor();
  var br = editor.document.createElement("br");
  editor.beginTransaction();
  editor.insertNode(br, block.parentNode, offset);
  editor.selectElement(br);
  editor.selection.collapseToStart();
  editor.endTransaction();

  // ensure the caret is visible
  scrollIntoCenterView(br);
}

function putCaretWithoutBR(dir) {
  // get the first block container of the current node
  var block = gLastFocusNode;
  while (BLOCK_NODENAMES.indexOf(block.nodeName.toLowerCase()) < 0)
    block = block.parentNode;
  if (block.nodeName.toLowerCase() == "body")
    return;

  // select the current block and collapse the selection
  var editor = GetCurrentEditor();
  editor.selectElement(block);
  switch(dir) {
    case NODE_NEXTSIBLING:
      editor.selection.collapseToEnd();
      break;
    case NODE_PREVSIBLING:
      editor.selection.collapseToStart();
      break;
  }
}

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
  if (!editor)
    editor = window.top.GetCurrentEditor();
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

  //if (IsInHTMLSourceMode()) {
  if (gEditorEditMode >= kEditModeSource) {
    document.getElementById("structSpacer").setAttribute("flex", "1"); // Kaze
    // we have destroyed the contents of the status bar and are about to recreate it;
    // but we don't want to do that in Source mode
    return;
  }

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

  toolbar.firstChild.removeAttribute("style");

  var button;
  var firstIteration = true;                    // Kaze
  var isFragment = gTabEditor.IsHtmlFragment(); // Kaze
  do {
    var tag = element.nodeName.toLowerCase();
    if (isFragment && (tag == "body"))
      break;

    // create button
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
    button.addEventListener("mouseover",    newMouseOverListener (element), false);
    button.addEventListener("mouseout",     newMouseOutListener  (element), false);
    button.addEventListener("click",        newMouseClickListener(element), false);

    button.setAttribute("context", "structToolbarContext");
  }
  //var popup = document.getElementById("structToolbarPopup").cloneNode(true);
  //button.setAttribute("type", "menu-button");
  //button.appendChild(popup);
  return button;
}

function openObjectProperties() {
  window.content.focus();
  goDoCommand("cmd_objectProperties");

  // refresh DOM trees
  // TODO: this should be called in every property dialog box, not here
  ResetStructToolbar();
}

function newCommandListener(button, element) {
  return function() {
    /*
     *if (gEditedElement) // edition in progress
     *  return;
     */
    highlightNode(null);
    SelectFocusNodeAncestor(element);
  };
}

function newMouseOverListener(element) {
  return function() {
    //if (!gEditorFocus || gEditedElement) // window not focused or edition in progress
    /*
     *if (gEditedElement) // edition in progress
     *  return;
     */
    highlightNode(element);
  };
}

function newMouseOutListener(element) {
  return function() {
    //if (!gEditorFocus || gEditedElement) // window not focused or edition in progress
    /*
     *if (gEditedElement) // edition in progress
     *  return;
     */
    highlightNode(null);
    //gContentWindow.focus(); // XXX disabled. Why did we add this???
  };
}

function newMouseClickListener(element) {
  return function(event) {
    /*
     *if (gEditedElement)      // edition in progress
     *  return;
     */
    if (event.button == 1) { // middle-click: select first child element
      highlightNode(null);
      gLastFocusNode = element;
      selectNeighborElement(NODE_FIRSTCHILD);
      //highlightNode(null);
      //viewNodeSource(element);
    }
    else if (event.detail == 2) { // double-click: open the property dialog
      highlightNode(null);
      window.content.focus();
      goDoCommand("cmd_objectProperties");
      // refresh DOM trees (XXX the DOM Explorer sidebar isn't refreshed)
      // TODO: this should be called in every property dialog box, not here
      ResetStructToolbar();
    }
  }
}

function newMouseScrollListener(button, element) {
  return function(event) {
    /*
     *if (gEditedElement) // edition in progress
     *  return;
     */
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
 *   HTML Source editor handling                                             *
 *                                                                           *
\*****************************************************************************/

// Switch to edit mode when entering the Source editor
// Note: this is only required for the (now disabled) modal source dock.
function onSourceDockClick(e) {
  // cancel if already in edition mode
  if (gEditedElement)
    return;
  if (e.button == 0)
    InitSourceEditor();
}

// [Esc] cancels HTML Source edition
// Note: could be replaced by a <key> definition now that the modal mode is deprecated.
function onSourceDockKeypress(e) {
  if (e.keyCode == KeyEvent.DOM_VK_ESCAPE) {
    // Cancel default [Esc] behavior because it would cause the editor to blur...
    // which would raise a 'blur' event, thus validating the changes.
    // Note: this is only required for the (now disabled) modal source dock.
    e.preventDefault();  // required in Gecko 1.8
    e.stopPropagation();
    // [Esc] has been pressed, cancel edition
    CancelHTMLSource();
  }
}

// [Alt+Enter] toggles between Design and Split views
function onSourceDockToggle() {
  // This function is triggered when the users presses Alt+Enter:
  // it can be called to enter the source dock (start editing)
  // or to leave the source dock or the source tab (flush changes).
  dump("toggle SourceDock\n");

  //if (IsInHTMLSourceMode())
  if (gEditedElement || gEditorEditMode == kEditModeSource) {
    // we're in Split|Source mode, apply changes and get back to Design|Split mode
    FinishHTMLSource();
    SetEditMode(gPreviousNonSourceEditMode);
  }
  else if (gEditorEditMode == kEditModeDesign) {
    // we're in Design mode, start editing in Split mode
    SetEditMode(kEditModeSplit);
    viewNodeSource(gLastFocusNode);
    // the next [Esc] or [Alt+Enter] will bring us back to Design mode
    gPreviousNonSourceEditMode = kEditModeDesign;
  }
}

// Add event handlers and string buffers when loading the Source editor
function InitSourceEditor() {
  if (kColoredSourceView) {
    // Looks like calling webNavigation resets the source editor...
    gSourceTextEditor = gSourceContentWindow.getEditor(gSourceContentWindow.contentWindow);
    gSourceTextEditor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
    //gSourceTextEditor.rootElement.style.backgroundColor = "#f0f0f0";
    //gSourceTextEditor.rootElement.setAttribute("_moz_sourceview", "true");
    gSourceContentWindow.removeEventListener("load", InitSourceEditor, true);
  }

  // Initialize the source editor
  gSourceTextEditor.resetModificationCount();
  gSourceTextEditor.addDocumentStateListener(gSourceTextListener);
  gSourceTextEditor.enableUndo(true);
  gSourceContentWindow.commandManager.addCommandObserver(gSourceTextObserver, "cmd_undo");
  gSourceContentWindow.contentWindow.focus();
  goDoCommand("cmd_moveTop");

  // show the preserved selection
  if (!gEditedElement)
    removeSelectionMarkers(true);

  // focus the editor
  gSourceContentWindow.contentWindow.focus();

  // add OK/Cancel event handlers
  gSourceContentWindow.addEventListener("blur",     FinishHTMLSource,     true);
  gSourceContentWindow.addEventListener("keypress", onSourceDockKeypress, true);

  // should switch the UI now... TODO later
}
 
// Remove event handlers and string buffers when leaving the Source editor
function ExitSourceEditor() {
  if ((gEditorEditMode == kEditModeSource) && !IsHTMLSourceChanged())
    removeSelectionMarkers();

  //gEditedElement = null;
  try {
    // remove OK/Cancel event handlers
    gSourceContentWindow.removeEventListener("blur",     FinishHTMLSource,     true);
    gSourceContentWindow.removeEventListener("keypress", onSourceDockKeypress, true);

    // clear out the string buffers
    gSourceContentWindow.commandManager.removeCommandObserver(gSourceTextObserver, "cmd_undo");
    gSourceTextEditor.removeDocumentStateListener(gSourceTextListener);
    gSourceTextEditor.enableUndo(false);
    if (!kColoredSourceView) { // Composer
      gSourceTextEditor.selectAll();
      gSourceTextEditor.deleteSelection(gSourceTextEditor.eNone);
    }
    gSourceTextEditor.resetModificationCount();
  } catch(e) {}
}

/*****************************************************************************\
 *                                                                           *
 *   HTML Source preview (dom2text)                                          *
 *                                                                           *
\*****************************************************************************/

function getDocumentEncodingFlags() {
  // XXX should be merged with GetOutputFlags() in ComposerCommands.js
  var flags = (GetCurrentEditor().documentCharacterSet == "ISO-8859-1")
            ? 32768  // OutputEncodeLatin1Entities
            : 16384; // OutputEncodeBasicEntities
  try { 
    var encodeEntity = gPrefs.getCharPref("editor.encode_entity");
    var dontEncodeGT = gPrefs.getBoolPref("editor.encode.noGT"); // XXX not supported yet
    var prettyPrint  = gPrefs.getBoolPref("editor.prettyprint");
    switch (encodeEntity) { //OutputEncodeCharacterEntities =
      case "basic"   : flags = 16384;  break; // OutputEncodeBasicEntities
      case "latin1"  : flags = 32768;  break; // OutputEncodeLatin1Entities
      case "html"    : flags = 65536;  break; // OutputEncodeHTMLEntities
      case "unicode" : flags = 262144; break;
      case "none"    : flags = 0;      break;
    }
    if (prettyPrint)
      flags |= 2;         // OutputFormatted
    if (dontEncodeGT)
      flags |= (1 << 21); // DontEncodeGreatherThan
  } catch (e) { }
  flags |= 1 << 5;        // OutputRaw
  flags |= 1024;          // OutputLFLineBreak
  return flags;
}

function viewDocumentSource() {
  // must have editor if here!
  var editor = GetCurrentEditor();
  var doctype = null;
  try {
    doctype = editor.document.doctype;
  } catch (e) {
    dump(e + "\n");
  }

  // XXX useless at the moment
  NotifyProcessors(kProcessorsBeforeGettingSource, editor.document);

  // Get the current selection
  var sel = editor.selection;
  addSelectionMarkers(sel);

  // Send the entire document's source string to the source editor
  var flags = getDocumentEncodingFlags();
  var source = editor.outputToString(kHTMLMimeType, flags);
  viewSourceInEditor(source, doctype);
}

function viewNodeSource(node) {
  // cancel if the source dock is collapsed
  if (!node || gSourceBrowserDeck.collapsed)
    return;

  // we can't edit the whole HTML tree with that source dock
  // so if <html> is selected, edit the <head> node
  if (node.tagName.toLowerCase() == "html")
    node = node.firstChild;

  // for some tags, rather edit a block-level parent node
  if (!kAlwaysEditInnerHTML) {
    var tagName = node.tagName.toLowerCase();
    //if (tagName == "thead" || tagName == "tbody" || tagName == "td" || tagName == "th" || tagName == "tr") {
    var table = ["thead", "tbody", "tr", "th", "td"];
    if (table.indexOf(tagName) >= 0) {
      while (node && (node.nodeName.toLowerCase() != "table"))
        node = node.parentNode;
    } /*
    else if (tagName == "dt" || tagName == "dd") {
      while (node && (node.nodeName.toLowerCase() != "dl"))
        node = node.parentNode;
    }
    else if (tagName == "li") {
      var list = ["ol", "ul"];
      while (node && list.indexOf(node.nodeName.toLowerCase()) < 0)
        node = node.parentNode;
    } */
  }

  // start editing this node's source
  gEditedElement = node;
  viewNodeSourceWithFormatting(node);
}

function viewNodeSourceWithoutFormatting(node) {
  highlightNode(null);

  // extract and display the syntax highlighted source
  var nodeName = node.nodeName.toLowerCase();
  var doc = node.ownerDocument;
  if (kAlwaysEditInnerHTML || nodeName == "head" || nodeName == "body") {
    // display the node's content
    var tmpNode = node.cloneNode(true);
  }
  else {
    // display the whole node's markup
    node = node.cloneNode(true);
    tmpNode = doc.createElementNS(NS_XHTML, 'div'); // not working well on xhtml documents?
    //tmpNode = doc.createElement('div');
    tmpNode.appendChild(node);
  }

  // hide NVU_NS nodes and send the source to the editor
  MakePhpAndCommentsInvisible(doc, tmpNode);
  viewSourceInEditor(tmpNode.innerHTML);
  delete(tmpNode);
}

function viewNodeSourceWithFormatting(node) {
  var editor = GetCurrentEditor();
  var nodeName = node.nodeName.toLowerCase();
  if (nodeName == "head") {
    var sel = editor.selection;
    sel.removeAllRanges;
    sel.selectAllChildren(node);
  }
  else if (nodeName == "body")
    editor.selectAll();
  else
    editor.selectElement(node);
  highlightNode(null);

  // Send the selected element's source string to the source editor
  var flags = getDocumentEncodingFlags() | 1; // OutputSelectionOnly
  var source = editor.outputToString(kHTMLMimeType, flags);
  //editor.selection.collapseToStart();
  viewSourceInEditor(source);
}

function viewSourceInEditor(source, doctype) {
  var doctypeNode = document.getElementById("doctype-text");

  // View-Source like (pseudo syntax highlighting)
  if (kColoredSourceView) {
    doctypeNode.collapsed = true;
    // all our content is held by the data:URI and URIs are internally stored as utf-8 (see nsIURI.idl)
    gSourceContentWindow.webNavigation
                        .loadURI("view-source:data:text/html;charset=utf-8," + encodeURIComponent(source),
                                 Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE, null, null, null);
    gSourceContentWindow.makeEditable("text", true); // required to enable caret movement
    gSourceContentWindow.addEventListener("load", InitSourceEditor, true);
  }

  // SeaMonkey-like (plaintext editor)
  else {
    if (doctype) {
      // Display the DOCTYPE as a non-editable string above edit area
      doctypeNode.collapsed = false;
      var doctypeText = "<!DOCTYPE " + doctype.name;
      if (doctype.publicId)
        doctypeText += " PUBLIC \"" + doctype.publicId;
      if (doctype.systemId)
        doctypeText += " "+"\"" + doctype.systemId;
      doctypeText += "\">"
      doctypeNode.setAttribute("value", doctypeText);
      // Remove the DOCTYPE from 'source'
      var start = source.search(/<html/i);
      if (start == -1) start = 0;
      source = source.slice(start);
    }
    else 
      doctypeNode.collapsed = true;
    gSourceTextEditor.selectAll();
    gSourceTextEditor.insertText(source);
    InitSourceEditor();
  }
}

/*****************************************************************************\
 *                                                                           *
 *   HTML Source parsing (text2dom)                                          *
 *                                                                           *
\*****************************************************************************/

function CancelHTMLSource() { // overrides that in 'comm.jar/editor/content/editor.js'
  // Don't convert source text back into the DOM document
  dump("Cancel HTML Source\n");
  gSourceTextEditor.resetModificationCount();
  if (gEditedElement) {
    MakePhpAndCommentsVisible(gEditedElement.ownerDocument, gEditedElement);
    if (gPreviousNonSourceEditMode == kEditModeSplit) {
      // locked Split mode: refresh the Source in the editor
      dump("reset Split view\n");
      viewNodeSource(gEditedElement);
      return;
    }
  }
  ExitSourceEditor();
  SetEditMode(gPreviousNonSourceEditMode);
  //removeSelectionMarkers();
}

function FinishHTMLSource() { // overrides that in 'comm.jar/editor/content/editor.js'
  if (IsHTMLSourceChanged()) {
    // Convert the source back into the DOM document
    var htmlSource = gSourceTextEditor.outputToString(kTextMimeType, 1024); // OutputLFLineBreak
    htmlSource = htmlSource.replace(/[\r\n\s]*$/, "");
    if (gEditorEditMode == kEditModeSource) {
      if (htmlSource.length > 0)
        RebuildDocumentFromSource(htmlSource);
    }
    else if (gEditedElement) {
      if (htmlSource.length > 0)
        RebuildNodeFromSource(gEditedElement, htmlSource);
      //if (gPreviousNonSourceEditMode == kEditModeSplit)
        //return; // locked Split mode
      //GetCurrentEditor().selection.collapseToStart();
    }
  }
  gEditedElement = null;
  ExitSourceEditor();
  //SetEditMode(gPreviousNonSourceEditMode);
}

function RebuildNodeFromSource(node, source) {
  // cancel if no editor (should never happen)
  var editor = GetCurrentEditor();
  if (!editor || !node) return;

  // flush changes
  if (source) try {
    var tagName = node.tagName.toLowerCase();
    editor.beginTransaction();
    dump("updating <" + tagName + ">\n");

    if (tagName == "head") {
      // we can't use editor.insertHTML here
      touchExternalStylesheets();
      editor.replaceHeadContentsWithHTML(source);
      checkDocumentTitle();
    }
    else {
      // select the requested element or its content
      if (tagName == "body") {
        editor.selectAll();
      }
      else if (kAlwaysEditInnerHTML) {
        var sel = GetCurrentEditor().selection;
        sel.removeAllRanges;
        sel.selectAllChildren(node);
        // Composer breaks lists if there's a text node between two list items
        if (tagName == "ol" || tagName == "ul")
          source = source.replace(/[\s\r\n]*<li/gi, "<li");
        else if (tagName == "dl") {
          source = source.replace(/[\s\r\n]*<dt/gi, "<dt");
          source = source.replace(/[\s\r\n]*<dd/gi, "<dd");
        }
        dump(source);
      }
      else {
        //SelectFocusNodeAncestor(node);
        editor.selectElement(node);
        // Composer breaks lists if there's a text node between two list items
        if (tagName == "li")
          source = source.replace(/[\s\r\n]*<li/gi, "<li");
        else if (tagName == "dt" || tagName == "dd") {
          source = source.replace(/[\s\r\n]*<dt/gi, "<dt");
          source = source.replace(/[\s\r\n]*<dd/gi, "<dd");
        }
        dump(source + "\n");
      }
      // insert HTML source
      editor.insertHTML(source);
      //MakePhpAndCommentsVisible(node.ownerDocument, node); // show NVU_NS nodes
    }

    //editor.incrementModificationCount(1);
    editor.endTransaction();
  } catch (e) {
    dump(e + "\n");
  }
}

function RebuildDocumentFromSource(source) {
  var editor = GetCurrentEditor();

  // Only rebuild document if a change was made in source window
  if (IsHTMLSourceChanged()) {
    dump("rebuilding document from source\n");
    // Here we need to check whether the HTML source contains <head> and <body> tags
    // or editor.rebuildDocumentFromSource() will fail.
    if (source.length > 0) {
      var alertStrID = null;
      if (source.indexOf("<head") < 0)
        alertStrID = "NoHeadTag";
      else if (source.indexOf("<body") < 0)
        alertStrID = "NoBodyTag";
      if (alertStrID) {
        AlertWithTitle(GetString("Alert"), GetString(alertStrID));
        // cheat to force back to Source Mode
        gEditorEditMode = kEditModeDesign;
        SetEditMode(kEditModeSource);
        throw Components.results.NS_ERROR_FAILURE;
      }
    }

    // Reduce the undo count so we don't use too much memory during multiple
    // uses of source window (reinserting entire doc caches all nodes)
    try {
      editor.transactionManager.maxTransactionCount = 1;
    } catch (e) {}

    // Convert the source back into the DOM document
    editor.beginTransaction();
    try {
      touchExternalStylesheets();
      editor.rebuildDocumentFromSource(source);
      checkDocumentTitle();
    } catch (ex) {
      dump(ex);
    }
    editor.endTransaction();

    // Restore unlimited undo count
    try {
      editor.transactionManager.maxTransactionCount = -1;
    } catch (e) {}
  }
  else {
    dump("no modification done.\n");
  }

  // XXX useless at the moment
  NotifyProcessors(kProcessorsBeforeBackToNormal, editor.document);
  // Clear source editor
  //ExitSourceEditor();
}

function checkDocumentTitle() {
  var editor = GetCurrentEditor();

  // Get the text for the <title> from the newly-parsed document
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
    // XXX Hack Kaze
    title = title.replace(/^[\s]*/, '').replace(/[\s]*$/, '');
  }
  if (editor.document.title != title)
    SetDocumentTitle(title);
}

function touchExternalStylesheets() {
  // Unfortunately, starting with Gecko 1.8, reloading the <head> node
  // adds "*|" strings in all selectors for all external stylesheets.
  // Workaround: touch each external stylesheet before resetting the <head> node.
  var headNode = null;
  try {
    headNode = GetCurrentEditor().document.getElementsByTagName("head").item(0);
  } catch(e) {}
  var linkNodes = headNode.getElementsByTagName("link");
  for (var i = 0; i < linkNodes.length; i++) {
    var linkNode = linkNodes[i];
    if (linkNode.getAttribute("rel").indexOf("stylesheet") != -1) try {
      // touching the external stylesheet will force Composer to reload it
      // when rebuilding the <head> node.
      linkNode.sheet.deleteRule(0);
    } catch(e) {}
  }
}

/*****************************************************************************\
 *                                                                           *
 *   HTML Source utilities (taken from the viewsource component)             *
 *                                                                           *
\*****************************************************************************/

// Copied from wrapLongLines() in
//   /toolkit/components/viewsource/content/viewSource.js
// toggle long-line wrapping
// and set the view_source.wrap_long_lines pref to persist the last state
function wrapLongLines() {     // taken from /toolkit/components/viewsource/
  //var myWrap = window._content.document.body;
  var myWrap = gSourceContentWindow.contentDocument.body;

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

// Copied from highlightSyntax() in
//   /toolkit/components/viewsource/content/viewSource.js
// toggle syntax highlighting
// and set the view_source.syntax_highlight pref to persist the last state
function highlightSyntax() {   // taken from /toolkit/components/viewsource/
  const pageLoaderIface = Components.interfaces.nsIWebPageDescriptor;
  var highlightSyntaxMenu = document.getElementById("cMenu_highlightSyntax");
  var highlightSyntax = (highlightSyntaxMenu.getAttribute("checked") == "true");
  if (gPrefs) try {
    gPrefs.setBoolPref("view_source.syntax_highlight", highlightSyntax);
  } catch (ex) {}

  var PageLoader = gSourceContentWindow.webNavigation.QueryInterface(pageLoaderIface);
  PageLoader.loadPage(PageLoader.currentDescriptor, pageLoaderIface.DISPLAY_NORMAL);
}

// Copied from viewPartialSourceForSelection() in
//   /toolkit/components/viewsource/content/viewPartialSource.js
// view-source of a selection with the special effect of remapping the selection
// to the underlying view-source output
function addSelectionMarkers(selection)
{
  var range = selection.getRangeAt(0);
  //var ancestorContainer = range.commonAncestorContainer;
  //var doc = ancestorContainer.ownerDocument;
  var doc = range.commonAncestorContainer.ownerDocument;
  var ancestorContainer = doc.documentElement;

  var startContainer = range.startContainer;
  var endContainer   = range.endContainer;
  var startOffset    = range.startOffset;
  var endOffset      = range.endOffset;

  /* let the ancestor be an element
  if (ancestorContainer.nodeType == Node.TEXT_NODE ||
      ancestorContainer.nodeType == Node.CDATA_SECTION_NODE)
    ancestorContainer = ancestorContainer.parentNode;

  // for selectAll, let's use the entire document, including <html>...</html>
  // @see DocumentViewerImpl::SelectAll() for how selectAll is implemented
  try {
    if (ancestorContainer == doc.body)
      ancestorContainer = doc.documentElement;
  } catch (e) { }
  */

  // each path is a "child sequence" (a.k.a. "tumbler") that
  // descends from the ancestor down to the boundary point
  var startPath = getPath(ancestorContainer, startContainer);
  var endPath   = getPath(ancestorContainer, endContainer);

  // clone the fragment of interest and reset everything to be relative to it
  // note: it is with the clone that we operate/munge from now on
  //ancestorContainer = ancestorContainer.cloneNode(true);
  startContainer = ancestorContainer;
  endContainer   = ancestorContainer;

  // Only bother with the selection if it can be remapped. Don't mess with
  // leaf elements (such as <isindex>) that secretly use anynomous content
  // for their display appearance.
  var canDrawSelection = ancestorContainer.hasChildNodes();
  if (canDrawSelection) {
    var i;
    for (i = startPath ? startPath.length-1 : -1; i >= 0; i--) {
      startContainer = startContainer.childNodes.item(startPath[i]);
    }
    for (i = endPath ? endPath.length-1 : -1; i >= 0; i--) {
      endContainer = endContainer.childNodes.item(endPath[i]);
    }

    // add special markers to record the extent of the selection
    // note: |startOffset| and |endOffset| are interpreted either as
    // offsets in the text data or as child indices (see the Range spec)
    // (here, munging the end point first to keep the start point safe...)
    var tmpNode;
    if (endContainer.nodeType == Node.TEXT_NODE ||
        endContainer.nodeType == Node.CDATA_SECTION_NODE) {
      // do some extra tweaks to try to avoid the view-source output to look like
      // ...<tag>]... or ...]</tag>... (where ']' marks the end of the selection).
      // To get a neat output, the idea here is to remap the end point from:
      // 1. ...<tag>]...   to   ...]<tag>...
      // 2. ...]</tag>...  to   ...</tag>]...
      if ((endOffset > 0 && endOffset < endContainer.data.length) ||
          !endContainer.parentNode || !endContainer.parentNode.parentNode)
        endContainer.insertData(endOffset, MARK_SELECTION_END);
      else {
        tmpNode = doc.createTextNode(MARK_SELECTION_END);
        endContainer = endContainer.parentNode;
        if (endOffset == 0)
          endContainer.parentNode.insertBefore(tmpNode, endContainer);
        else
          endContainer.parentNode.insertBefore(tmpNode, endContainer.nextSibling);
      }
    }
    else {
      tmpNode = doc.createTextNode(MARK_SELECTION_END);
      endContainer.insertBefore(tmpNode, endContainer.childNodes.item(endOffset));
    }

    if (startContainer.nodeType == Node.TEXT_NODE ||
        startContainer.nodeType == Node.CDATA_SECTION_NODE) {
      // do some extra tweaks to try to avoid the view-source output to look like
      // ...<tag>[... or ...[</tag>... (where '[' marks the start of the selection).
      // To get a neat output, the idea here is to remap the start point from:
      // 1. ...<tag>[...   to   ...[<tag>...
      // 2. ...[</tag>...  to   ...</tag>[...
      if ((startOffset > 0 && startOffset < startContainer.data.length) ||
          !startContainer.parentNode || !startContainer.parentNode.parentNode ||
          startContainer != startContainer.parentNode.lastChild)
        startContainer.insertData(startOffset, MARK_SELECTION_START);
      else {
        tmpNode = doc.createTextNode(MARK_SELECTION_START);
        startContainer = startContainer.parentNode;
        if (startOffset == 0)
          startContainer.parentNode.insertBefore(tmpNode, startContainer);
        else
          startContainer.parentNode.insertBefore(tmpNode, startContainer.nextSibling);
      }
    }
    else {
      tmpNode = doc.createTextNode(MARK_SELECTION_START);
      startContainer.insertBefore(tmpNode, startContainer.childNodes.item(startOffset));
    }
  }
  dump("addSelectionMarkers\n");
  dump("  start: " + startContainer.nodeName + ", " + startOffset + "\n");
  dump("  end: "   +   endContainer.nodeName + ", " +   endOffset + "\n");
}

// Copied from drawSelection() in
//   /toolkit/components/viewsource/content/viewPartialSource.js
// using special markers left in the serialized source, this helper makes the
// underlying markup of the selected fragment to automatically appear as selected
// on the inflated view-source DOM
function removeSelectionMarkers(sourceMode) {
  // find the special selection markers that we added earlier,
  // and draw the selection between the two...
  var findService = null;
  try {
    // get the find service which stores the global find state
    findService = Components.classes["@mozilla.org/find/find_service;1"]
                            .getService(Components.interfaces.nsIFindService);
  } catch(e) { }
  if (!findService)
    return;

  // Kaze: get the proper target window and reset the selection
  var target = sourceMode ? gSourceContentWindow : GetCurrentEditorElement();
  var selection = target.contentDocument.defaultView.getSelection();
  selection.removeAllRanges(); // useless in the ViewSource window but required in Composer

  // cache the current global find state
  var matchCase     = findService.matchCase;
  var entireWord    = findService.entireWord;
  var wrapFind      = findService.wrapFind;
  var findBackwards = findService.findBackwards;
  var searchString  = findService.searchString;
  var replaceString = findService.replaceString;

  // setup our find instance
  //var findInst = getBrowser().webBrowserFind;
  var findInst = target.webBrowserFind;
  findInst.matchCase     = true;
  findInst.entireWord    = false;
  findInst.wrapFind      = true;
  findInst.findBackwards = false;

  // ...lookup the start mark
  findInst.searchString = MARK_SELECTION_START;
  var startLength = MARK_SELECTION_START.length;
  findInst.findNext();

  //var contentWindow = getBrowser().contentDocument.defaultView;
  //var selection = contentWindow.getSelection();
  var range = selection.getRangeAt(0);
  var startContainer = range.startContainer;
  var startOffset    = range.startOffset;

  // ...lookup the end mark
  findInst.searchString = MARK_SELECTION_END;
  var endLength = MARK_SELECTION_END.length;
  findInst.findNext();

  var endContainer = selection.anchorNode;
  var endOffset    = selection.anchorOffset;

  // reset the selection that find has left
  selection.removeAllRanges();

  // delete the special markers now...
  endContainer.deleteData(endOffset, endLength);
  startContainer.deleteData(startOffset, startLength);
  dump("removeSelectionMarkers\n");
  dump("  start: " + startContainer.nodeName + ", " + startOffset + ":" + startLength + "\n");
  dump("  end: "   +   endContainer.nodeName + ", " +   endOffset + ":" +   endLength + "\n");

  // show the selection
  try {
    if (startContainer == endContainer)
      endOffset -= startLength; // has shrunk if on same text node...
    range.setEnd(endContainer, endOffset);
    selection.addRange(range);
  } catch(e) { return; }

  // scroll the selection into view:
  // the default behavior of the selection is to scroll at the end of
  // the selection, whereas in this situation, it is more user-friendly
  // to scroll at the beginning. So we override the default behavior here
  try {
    //getBrowser().docShell
    target.docShell
          .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
          .getInterface(Components.interfaces.nsISelectionDisplay)
          .QueryInterface(Components.interfaces.nsISelectionController)
          .scrollSelectionIntoView(Components.interfaces.nsISelectionController.SELECTION_NORMAL,
                                   Components.interfaces.nsISelectionController.SELECTION_ANCHOR_REGION,
                                   true);
  }
  catch(e) { }

  // restore the current find state
  findService.matchCase     = matchCase;
  findService.entireWord    = entireWord;
  findService.wrapFind      = wrapFind;
  findService.findBackwards = findBackwards;
  findService.searchString  = searchString;
  findService.replaceString = replaceString;

  findInst.matchCase     = matchCase;
  findInst.entireWord    = entireWord;
  findInst.wrapFind      = wrapFind;
  findInst.findBackwards = findBackwards;
  findInst.searchString  = searchString;
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

