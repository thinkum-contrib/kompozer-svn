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
 * The Original Code is Nvu.
 *
 * The Initial Developer of the Original Code is
 * Linspire Inc., Inc.
 * Portions created by the Initial Developer are Copyright (C) 1998-2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
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

const kTemplateStylesheet = "chrome://editor/content/EditorTemplates.css";
const kTemplateAttr       = "template";
const kTemplateRefAttr    = "templateref";
const kEditableAttr       = "editable";

function EditorInitInsertTemplateMenu()
{
  var enabled = GetCurrentEditor().document.documentElement.hasAttribute("template");
  SetElementEnabledById("insertTemplateElementsMenu", enabled);
}

function InsertEditableArea(aFromContextMenu)
{
  if (aFromContextMenu)
  {
    var elt = gContextMenuFiringDocumentElement;
    if (elt.getAttribute("id"))
    {
      GetCurrentEditor().setAttribute(elt, kEditableAttr, "true");
      return;
    }
  }
  window.openDialog("chrome://editor/content/EditableArea.xul", "_blank", "chrome,close,titlebar,modal",
                    aFromContextMenu);
}

function RemoveEditableArea()
{
  // no need to check if the element is editable, the context menu is
  // enabled only if it is...
  var elt = gContextMenuFiringDocumentElement;
  while (elt && !elt.hasAttribute(kEditableAttr))
    elt = elt.parentNode;
  elt.removeAttribute(kEditableAttr);
  elt.removeAttribute("optional");
  elt.removeAttribute("repeatable");
  elt.removeAttribute("movable");
  // and that's all... We preserve the ID just in case
}

function WarnIfDocumentIsTemplate()
{
  if (CurrentDocumentIsTemplate()) {
    // yes!!! let the user know about it
        AlertWithTitle(GetString("Alert"), GetString("DocumentIsTemplate"));
  }
}

function MakeDocumentBecomeATemplate()
{
  var e = GetCurrentEditor();
  if (e) {
    var d = e.document.documentElement;
    if (d)
      e.setAttribute(d, kTemplateAttr, "true");
  }
}

function MakeTemplateBecomeANormalDocument()
{
  var e = GetCurrentEditor();
  if (e) {
    var d = e.document.documentElement;
    if (d)
      e.removeAttribute(d, kTemplateAttr, "true");
  }
}

function MakeDocumentBecomeATemplateRef()
{
  var e = GetCurrentEditor();
  if (e) {
    e instanceof Components.interfaces.nsIHTMLTemplateEditor;
    e.isDocumentBasedOnTemplate = true;
    var doc = e.document;
    var d = doc.documentElement;
    if (d)
    {
      d.removeAttribute(kTemplateAttr, "true");
      d.setAttribute("templateref", doc.URL);

      SetDocumentURI(GetIOService().newURI("about:blank", e.documentCharacterSet, null));
      UpdateWindowTitle();
      e.resetModificationCount();
    }
  }
}

function TweakTemplateContextMenu()
{
  var e = GetCurrentEditor();
  if (e) {
    var d = e.document.documentElement;
    var isTemplate =  (d && d.getAttribute(kTemplateAttr));
    if (d)
    {
      var elt = gContextMenuFiringDocumentElement;
      var isEditable = false;
      while (!isEditable  && elt && elt.nodeName.toLowerCase() != "html")
      {
        isEditable = (elt.getAttribute(kEditableAttr) == "true");
        elt = elt.parentNode;
      }
      SetElementEnabledById("makeEditableContextMenu", !isEditable);
      SetElementEnabledById("removeEditableContextMenu", isEditable);
    }
  }
}

function CurrentDocumentIsTemplate()
{
  var e = GetCurrentEditor();
  var d = e.document.documentElement;
  return (d && d.getAttribute(kTemplateAttr));
}

function CurrentDocumentIsTemplateRef()
{
  var e = GetCurrentEditor();
  var d = e.document.documentElement;
  return (d && d.getAttribute(kTemplateRefAttr));
}

function TweakComposerEditMenu()
{
  SetElementEnabledById("menu_detachTemplate", CurrentDocumentIsTemplateRef());
}

function DetachFromTemplate()
{
  var editor = GetCurrentEditor();
  editor instanceof Components.interfaces.nsIHTMLTemplateEditor;
  editor.isDocumentBasedOnTemplate = true;
  editor.beginTransaction();

  var rootElt = editor.document.documentElement;
  if (rootElt)
    editor.removeAttribute(rootElt, kTemplateRefAttr);

  function acceptNode(node)
  {
    if (node.hasAttribute(kEditableAttr)) {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  }

  var treeWalker = editor.document.createTreeWalker(rootElt,
                                                NodeFilter.SHOW_ELEMENT,
                                                acceptNode,
                                                true);
  if (treeWalker) {
    var theNode = treeWalker.nextNode();
    while (theNode) {
      editor.removeAttribute(theNode, kEditableAttr);

      if (theNode.hasAttribute("idref"))
        editor.removeAttribute(theNode, "idref");
      if (theNode.hasAttribute("optional"))
        editor.removeAttribute(theNode, "optional");
      if (theNode.hasAttribute("repeatable"))
        editor.removeAttribute(theNode, "repeatable");
      if (theNode.hasAttribute("movable"))
        editor.removeAttribute(theNode, "movable");
      if (theNode.hasAttribute("idref"))
        editor.removeAttribute(theNode, "idref");

      theNode = treeWalker.nextNode();
    }
  }

  editor.endTransaction();
}
