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
var gViewedElement = null;
var gEditedElement = null;
var gSourceEditor  = null;
var gSourceEditorModified = false;
    
// source dock: modal editor (browser+textbox) or classic editor (htmlEditor)?
//const kModalSourceDock = false;

// source dock: always edit innerHTML, or edit the full node when possible?
const kAlwaysEditInnerHTML = false;


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

// these elements are considered as blocks
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

  if (IsInHTMLSourceMode()) {
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
  //var tag = gLastFocusNode.nodeName.toLowerCase();

  toolbar.firstChild.removeAttribute("style");

  var button;
  var firstIteration = true;                    // Kaze
  var isFragment = gTabEditor.IsHtmlFragment(); // Kaze
  do {
    tag = element.nodeName.toLowerCase();
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
    if (gEditedElement) // edition in progress
      return;
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
 *   HTML code preview                                                       *
 *                                                                           *
\*****************************************************************************/

function getBrowser() {
  return document.getElementById("SourceBrowser");
  /*
   *if (gEditorEditMode == kEditModeSplit)
   *  return document.getElementById("SourceBrowser");
   *else if (gEditorEditMode == kEditModeSource)
   *  return gSourceContentWindow;
   */
}

function InsertColoredSourceView(editor, source)
{
  var sourceDoc = editor.document;
  // clean source view first
  var bodySourceDoc = sourceDoc.documentElement.firstChild.nextSibling;
  while (bodySourceDoc.lastChild)
    bodySourceDoc.removeChild(bodySourceDoc.lastChild);

  // the following is ugly but working VERY well
  var styleElt = sourceDoc.getElementById("moz_sourceview_css");
  if (!styleElt)
  {
    var heads = sourceDoc.getElementsByTagName("head");
    var headElement;
    if (!heads)
    {
      headElement = sourceDoc.createElement("head");
      bodySourceDoc.parentNode.insertBefore(headElement, bodySourceDoc);
    }
    else
      headElement = heads.item(0);
    var styleElt = sourceDoc.createElement("style");
    styleElt.setAttribute("id", "moz_sourceview_css");
    styleElt.setAttribute("type", "text/css");
    var sheet = sourceDoc.createTextNode('@import url("resource://gre/res/viewsource.css");' +
                                         'ol { margin: 0; margin-left:2em; }' +
                                         'li { *padding-left: 1em; background-color: white; }');
    styleElt.appendChild(sheet);
    headElement.appendChild(styleElt);
  }
  bodySourceDoc.innerHTML = source;
}

function viewDocumentSourceOld() {
  // must have editor if here!
  var editor = GetCurrentEditor();

  // Display the DOCTYPE as a non-editable string above edit area
  var domdoc;
  try { domdoc = editor.document; } catch (e) { dump( e + "\n");}
  if (domdoc)
  {
    var doctypeNode = document.getElementById("doctype-text");
    var dt = domdoc.doctype;
    if (doctypeNode)
    {
      if (dt)
      {
        doctypeNode.collapsed = false;
        var doctypeText = "<!DOCTYPE " + domdoc.doctype.name;
        if (dt.publicId)
          doctypeText += " PUBLIC \"" + domdoc.doctype.publicId;
        if (dt.systemId)
          doctypeText += " "+"\"" + dt.systemId;
        doctypeText += "\">"
        doctypeNode.setAttribute("value", doctypeText);
      }
      // XXX HACK ALERT Glazou
      else if (!kColoredSourceView)
        doctypeNode.collapsed = true;
    }
  }

  // Get the entire document's source string
  var flags = (editor.documentCharacterSet == "ISO-8859-1")
    ? 32768  // OutputEncodeLatin1Entities
    : 16384; // OutputEncodeBasicEntities
  try { 
    var encodeEntity = gPrefs.getCharPref("editor.encode_entity");
    var dontEncodeGT = gPrefs.getBoolPref("editor.encode.noGT");
    switch (encodeEntity) { //OutputEncodeCharacterEntities =
      case "basic"   : flags = 16384;  break; // OutputEncodeBasicEntities
      case "latin1"  : flags = 32768;  break; // OutputEncodeLatin1Entities
      case "html"    : flags = 65536;  break; // OutputEncodeHTMLEntities
      case "unicode" : flags = 262144; break;
      case "none"    : flags = 0;      break;
    }
    if (dontEncodeGT)
      flags |= (1 << 21); // DontEncodeGreatherThan
  } catch (e) { }

  // Kaze: always reformat the HTML code for the "source" view
  //~ try { 
    //~ var prettyPrint = gPrefs.getBoolPref("editor.prettyprint");
    //~ if (prettyPrint)
    //~ {
      flags |= 2;      // OutputFormatted
    //~ }
  //~ } catch (e) {}

  // XXX useless at the moment
  NotifyProcessors(kProcessorsBeforeGettingSource, editor.document);

  flags |= 1 << 5; // OutputRaw
  flags |= 1024;   // OutputLFLineBreak

  if (kColoredSourceView) { // Nvu
    //flags |= 131072; // colored source view

    var mimeType = kHTMLMimeType;
    /*if (IsXHTMLDocument())
      mimeType = kXMLMimeType;*/
    var source = editor.outputToString(mimeType, flags);
    var start = source.search(/\<span class='/i);
    if (start == -1) start = 0;
    gSourceTextEditor.selectAll();
    // gSourceTextEditor.insertText(source.slice(start));

    if (false /*IsXHTMLDocument()*/)
    {
      source = source.replace( /\n$/gi , String(""));
      source = source.slice(start).replace( /\n/gi , String("</li><li>"));
    }
    else
    {
      source = source.replace( /<br>$/gi , String("")).replace( /\n$/gi , String(""));
      source = source.slice(start).replace( /<br>/gi , String("</li><li>")).replace( /\n/gi , String("</li><li>"));
    }

    source = "<ol><li>" + source + "</li></ol>";
    InsertColoredSourceView(gSourceTextEditor, source);

    //InsertColoredSourceView(gSourceTextEditor, source.slice(start));
  }
  else { // Composer
    var source = editor.outputToString(kHTMLMimeType, flags);
    var start = source.search(/<html/i);
    if (start == -1) start = 0;
    gSourceTextEditor.selectAll();
    gSourceTextEditor.insertText(source.slice(start));
  }

  gSourceTextEditor.resetModificationCount();
  gSourceTextEditor.addDocumentStateListener(gSourceTextListener);
  gSourceTextEditor.enableUndo(true);
  gSourceContentWindow.commandManager.addCommandObserver(gSourceTextObserver, "cmd_undo");
  gSourceContentWindow.contentWindow.focus();
  goDoCommand("cmd_moveTop");

  if (false && kColoredSourceView) { // Nvu
    // let's show the preserved selection :-)
    var sourceDoc = gSourceTextEditor.document;
    var startSel  = sourceDoc.getElementById("start-selection");
    var endSel    = sourceDoc.getElementById("end-selection");
    if (startSel)
    {
      var sourceSel = gSourceTextEditor.selection;
      sourceSel.removeAllRanges();
      var range = gSourceTextEditor.document.createRange();
      if (endSel && (endSel != startSel))
      {
        range.setStartBefore(startSel);
        // <Kaze>
        //range.setEndAfter(endSel);
        try { // sometimes 'endSel' is out of bounds
          range.setEndAfter(endSel);
        } catch(e) {
          range.setEndAfter(startSel);
        }
        // </Kaze>
      }
      else
      {
        range.setStartAfter(startSel);
        range.setEndAfter(startSel);
      }
      sourceSel.addRange(range);

      setTimeout("gSourceTextEditor.scrollSelectionIntoView(true)", 100)
    }
    else
      gSourceTextEditor.beginningOfDocument()
  }
}

function onSourceLoad() {
  if (kColoredSourceView) {
    // Looks like calling webNavigation resets the source editor...
    gSourceTextEditor = gSourceContentWindow.getEditor(gSourceContentWindow.contentWindow);
    gSourceTextEditor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
    gSourceContentWindow.removeEventListener("load", onSourceLoad, true);
  }

  // Initialize the source editor
  gSourceTextEditor.resetModificationCount();
  gSourceTextEditor.addDocumentStateListener(gSourceTextListener);
  gSourceTextEditor.enableUndo(true);
  gSourceContentWindow.commandManager.addCommandObserver(gSourceTextObserver, "cmd_undo");
  gSourceContentWindow.contentWindow.focus();
  goDoCommand("cmd_moveTop");
}

function viewDocumentSource() {
  // must have editor if here!
  var editor = GetCurrentEditor();
  var domdoc;
  try { domdoc = editor.document; } catch (e) { dump( e + "\n");}

  // XXX useless at the moment
  NotifyProcessors(kProcessorsBeforeGettingSource, editor.document);

  // Set the document encoding flags
  var flags = (editor.documentCharacterSet == "ISO-8859-1")
            ? 32768  // OutputEncodeLatin1Entities
            : 16384; // OutputEncodeBasicEntities
  try { 
    var encodeEntity = gPrefs.getCharPref("editor.encode_entity");
    var dontEncodeGT = gPrefs.getBoolPref("editor.encode.noGT");
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

  // Insert the entire document's source string in the source editor
  var source = editor.outputToString(kHTMLMimeType, flags);
  var doctypeNode = document.getElementById("doctype-text");

  // View-Source like
  if (kColoredSourceView) {
    doctypeNode.collapsed = true;
    gSourceContentWindow.webNavigation
                        .loadURI("view-source:data:text/html;charset=utf-8," + encodeURIComponent(source),
                                 Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE, null, null, null);
    gSourceContentWindow.makeEditable("text", true); // required to enable caret movement
    gSourceContentWindow.addEventListener("load", onSourceLoad, true);
  }
  // SeaMonkey-like
  else {
    // Display the DOCTYPE as a non-editable string above edit area
    if (domdoc) {
      var dt = domdoc.doctype;
      if (dt) {
        doctypeNode.collapsed = false;
        var doctypeText = "<!DOCTYPE " + domdoc.doctype.name;
        if (dt.publicId)
          doctypeText += " PUBLIC \"" + domdoc.doctype.publicId;
        if (dt.systemId)
          doctypeText += " "+"\"" + dt.systemId;
        doctypeText += "\">"
        doctypeNode.setAttribute("value", doctypeText);
      }
      else 
        doctypeNode.collapsed = true;
    }

    // Remove the DOCTYPE from 'source'
    var start = source.search(/<html/i);
    if (start == -1) start = 0;
    source = source.slice(start);
    gSourceTextEditor.selectAll();
    gSourceTextEditor.insertText(source);
    onSourceLoad(); // Initialize the source editor
  }
}

function viewNodeSource(node) {
  // cancel if the source dock is collapsed
  if (!node || gSourceBrowserDeck.collapsed)
    return;

  highlightNode(null);
  gViewedElement = node;

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

  // hide NVU_NS nodes
  MakePhpAndCommentsInvisible(doc, tmpNode);

  // all our content is held by the data:URI and URIs are internally stored as utf-8 (see nsIURI.idl)
  //gSourceContentWindow.webNavigation
  getBrowser().webNavigation
              .loadURI("view-source:data:text/html;charset=utf-8," + encodeURIComponent(tmpNode.innerHTML),
                       Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE, null, null, null);

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
  var doc = gSourceContentWindow.contentDocument;
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

/*****************************************************************************\
 *                                                                           *
 *   HTML code parsing                                                       *
 *                                                                           *
\*****************************************************************************/

function CancelHTMLSource() { // overrides that in 'comm.jar/editor/content/editor.js'
  // Don't convert source text back into the DOM document
  gSourceTextEditor.resetModificationCount();
  SetEditMode(gPreviousNonSourceEditMode);
}

function FinishHTMLSource() { // overrides that in 'comm.jar/editor/content/editor.js'
  // XXX why the fuck do we need to re-generate gSourceTextEditor?
  //delete(gSourceTextEditor);
  //gSourceTextEditor = newSourceTextEditor();

  // Here we need to check whether the HTML source contains <head> and <body> tags
  // or RebuildDocumentFromSource() will fail.
  if (IsInHTMLSourceMode()) {
    var htmlSource = gSourceTextEditor.outputToString(kTextMimeType, 1024); // OutputLFLineBreak
    if (htmlSource.length > 0) {

      // check <head> node
      var beginHead = htmlSource.indexOf("<head");
      if (beginHead == -1) {
        AlertWithTitle(GetString("Alert"), GetString("NoHeadTag"));
        // cheat to force back to Source Mode
        gEditorEditMode = kEditModeDesign;
        SetEditMode(kEditModeSource);
        throw Components.results.NS_ERROR_FAILURE;
      }

      // check <body> node
      var beginBody = htmlSource.indexOf("<body");
      if (beginBody == -1) {
        AlertWithTitle(GetString("Alert"), GetString("NoBodyTag"));
        // cheat to force back to Source Mode
        gEditorEditMode = kEditModeDesign;
        SetEditMode(kEditModeSource);
        throw Components.results.NS_ERROR_FAILURE;
      }
    }

    // convert source back into DOM document
    RebuildDocumentFromSource();
    SetEditMode(gPreviousNonSourceEditMode);
  }
  else if (gEditedElement) {
    // XXX needs some code cleaning
    editNodeApply();
  }
  gEditedElement = null;
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
      // insert HTML source
      editor.replaceHeadContentsWithHTML(source);
      // update document title (must do this for proper conversion of "escaped" characters)
      var title = "";
      var titlenodelist = editor.document.getElementsByTagName("title");
      if (titlenodelist) {
        var titleNode = titlenodelist.item(0);
        if (titleNode && titleNode.firstChild && titleNode.firstChild.data)
          title = titleNode.firstChild.data;
        if (title == "\n") // XXX HACK glazou
          title = "";
      }
      if (editor.document.title != title)
        SetDocumentTitle(title);
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
        dump(source);
      }
      // insert HTML source
      editor.insertHTML(source);
      MakePhpAndCommentsVisible(node.ownerDocument, node); // show NVU_NS nodes
    }

    //editor.incrementModificationCount(1);
    editor.endTransaction();
  } catch (e) {
    dump(e + "\n");
  }
}

function RebuildDocumentFromSource() {
  var editor = GetCurrentEditor();

  // Only rebuild document if a change was made in source window
  if (IsHTMLSourceChanged())
  {
    dump("rebuilding document from source\n");
    // Reduce the undo count so we don't use too much memory
    //   during multiple uses of source window 
    //   (reinserting entire doc caches all nodes)
    try {
      //editor.transactionManager.maxTransactionCount = 1;
    } catch (e) {}

    editor.beginTransaction();
    try {
      // We are coming from edit source mode,
      //   so transfer that back into the document
      var flags = 1024; // nsIDocumentEncoder::OutputLFLineBreak 
      flags |= 524288;  // nsIDocumentEncoder::OutputLineBreaksWhenClosingLI
      source = gSourceTextEditor.outputToString(kTextMimeType, flags);
      dump(source + "\n");
      editor.rebuildDocumentFromSource(source);

      // Get the text for the <title> from the newly-parsed document
      // (must do this for proper conversion of "escaped" characters)
      var title = "";
      var titlenodelist = editor.document.getElementsByTagName("title");
      if (titlenodelist)
      {
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

    } catch (ex) {
      dump(ex);
    }
    editor.endTransaction();

    // Restore unlimited undo count
    try {
      //editor.transactionManager.maxTransactionCount = -1;
    } catch (e) {}
  }
  else
  {
    dump("no modification done.\n");
  }

  // XXX useless at the moment
  NotifyProcessors(kProcessorsBeforeBackToNormal, editor.document);

  // Clear out the string buffers
  //gSourceContentWindow.commandManager.removeCommandObserver(gSourceTextObserver, "cmd_undo");
  gSourceContentWindow.removeEventListener("blur",     editNodeApply,        true);
  gSourceContentWindow.removeEventListener("keypress", onKeypressSourceDock, true);
  gSourceTextEditor.removeDocumentStateListener(gSourceTextListener);
  gSourceTextEditor.enableUndo(false);
  if (!kColoredSourceView) { // Composer
    gSourceTextEditor.selectAll();
    gSourceTextEditor.deleteSelection(gSourceTextEditor.eNone);
  }
  gSourceTextEditor.resetModificationCount();

  gContentWindow.focus();
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

  if (e.button == 0)
    editNodeStart();
}

function onKeypressSourceDock(e) {
  if (e.keyCode == KeyEvent.DOM_VK_ESCAPE) {
    // cancel default [Esc] behavior because it would cause the editor to blur...
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
  if (!editor) {
    dump("no editor! Can't enable the source dock.");
    return;
  }

  // we're entering the source dock, let's ensure it is visible
  if (gEditorEditMode == kEditModeDesign)
    SetEditMode(kEditModeSplit);

  // we can't edit the whole HTML tree with that source dock
  // so if <html> is selected, edit the <head> node
  if (gViewedElement.tagName.toLowerCase() == "html")
    gViewedElement = gViewedElement.firstChild;

  // for some tags, rather edit a block-level parent node
  if (!kAlwaysEditInnerHTML) {
    var tmpNode = gViewedElement;
    var tagName = gViewedElement.tagName.toLowerCase();
    if (tagName == "thead" || tagName == "tbody" || tagName == "td" || tagName == "th" || tagName == "tr") {
      while(tmpNode && (tmpNode.nodeName.toLowerCase() != "table"))
        tmpNode = tmpNode.parentNode;
    } /*
    else if (tagName == "dt" || tagName == "dd") {
      tmpNode = gViewedElement;
      while(tmpNode && (tmpNode.nodeName.toLowerCase() != "dl"))
        tmpNode = tmpNode.parentNode;
    }
    else if (tagName == "li") {
      var list = ["ol", "ul"];
      tmpNode = gViewedElement;
      while(tmpNode && list.indexOf(tmpNode.nodeName.toLowerCase()) < 0)
        tmpNode = tmpNode.parentNode;
    } */
    if (gViewedElement != tmpNode) {
      gViewedElement = tmpNode;
      SelectFocusNodeAncestor(gViewedElement);
    }
  }

  // focus the editor
  gSourceEditor = getBrowser();
  gSourceEditor.contentWindow.focus();

  // auto-confirm changes when the user clicks outside the source editor
  gSourceEditor.addEventListener("blur",     editNodeApply,        true);

  // cancel default [Esc] behavior because it would cause the editor to blur
  gSourceEditor.addEventListener("keypress", onKeypressSourceDock, true);

  // init globals
  gEditedElement = gViewedElement;
  gSourceEditorModified = false;
  dump("source dock focused\n");
}

function editNodeApply() {
  // use RebuildDocumentFromSource if we're in Source mode
  if (IsInHTMLSourceMode()) {
    dump("updating whole document\n");
    RebuildDocumentFromSource();
    return;
  }

  // detect modifications
  try {
    // XXX
    var srcEditor = gSourceEditor.getEditor(gSourceEditor.contentWindow);
    //var srcEditor = gSourceEditor.getHTMLEditor(gSourceEditor.contentWindow);
    srcEditor instanceof Components.interfaces.nsIPlaintextEditor;
    srcEditor instanceof Components.interfaces.nsIHTMLEditor;
  } catch (e) { dump (e + "\n"); }
  gSourceEditorModified = srcEditor.documentModified;

  // cancel if no modifications found
  if (!gSourceEditorModified) {
    editNodeCancel();
    return;
  }

  // get the current element's HTML markup
  // (= innerHTML for <head|body>, full markup for other elements)
  var html = srcEditor.outputToString(kTextMimeType, 1024).replace(/\s*$/, '');

  // flush changes
  RebuildNodeFromSource(gEditedElement, html);
  editNodeLeave();
  GetCurrentEditor().selection.collapseToStart();
  //GetCurrentEditorElement().contentWindow.focus();

  // get back to Design mode
  SetEditMode(kEditModeDesign);
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
  IsHTMLSourceChanged();

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

  // set the focus to the main window
  //gContentWindow.focus();
  //GetCurrentEditorElement().contentWindow.focus();
  // get back to Design mode
  SetEditMode(kEditModeDesign);
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

