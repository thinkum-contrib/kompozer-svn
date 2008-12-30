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

var gIsFromContextMenu = false;

function Startup()
{
  if ("arguments" in window && window.arguments.length >= 1)
    gIsFromContextMenu = window.arguments[0];

  var dialogNode = document.getElementById("insertEditableAreaDlg");

  gDialog.okButton       = dialogNode.getButton("accept");
  gDialog.warning        = document.getElementById("warning");
  gDialog.editableAreaId = document.getElementById("editableAreaId");
  gDialog.typeRadio      = document.getElementById("typeRadio");
  gDialog.areaType       = document.getElementById("areaType");
  gDialog.optional       = document.getElementById("optionalCheckbox");
  gDialog.repeatable     = document.getElementById("repeatableCheckbox");
  gDialog.movable        = document.getElementById("movableCheckbox");

  gDialog.okButton.disabled = true;

  if (gIsFromContextMenu)
  {
    gDialog.areaType.setAttribute("hidden", "true");
  }
}

function ControlAreaId(e)
{
  var id = e.value;
  id = id.replace(/ /g,"");
  e.value = id;

  if (!id ||
      GetCurrentEditor().document.getElementById(id))
  {
    // oops, it already exists!
    gDialog.okButton.disabled = true;
    // show the warning if and only if the id is not empty
    if (id)
      gDialog.warning.removeAttribute("hidden");
  }
  else
  {
    gDialog.okButton.disabled = false;
    gDialog.warning.setAttribute("hidden", true);
  }
}

function onAccept()
{
  var id   = gDialog.editableAreaId.value;
  if (gIsFromContextMenu)
  {
    var e = window.opener.gContextMenuFiringDocumentElement;
    GetCurrentEditor().setAttribute(e, "id", id);
    if (gDialog.optional.checked)
      GetCurrentEditor().setAttribute(e, "optional", "true");
    if (gDialog.repeatable.checked)
      GetCurrentEditor().setAttribute(e, "repeatable", "true");
    if (gDialog.movable.checked)
      GetCurrentEditor().setAttribute(e, "movable", "true");
    // attribute "editable" *must* be the last one
    GetCurrentEditor().setAttribute(e, "editable", "true");
  }
  else
  {
    var type = gDialog.typeRadio.selectedItem.value;
    var htmlstring;
    var optionalStr   = gDialog.optional.checked   ? 'optional="true"' : '';
    var repeatableStr = gDialog.repeatable.checked ? 'repeatable="true"' : '';
    var movableStr    = gDialog.movable.checked    ? 'movable="true"' : '';
    switch (type) {
      case "flow":
        htmlstring = '<span editable="true"' +
                     optionalStr + repeatableStr + movableStr +
                     'id="' +
                     id +
                     '">' +
                     id +
                     '</span>';
        break;
      case "block":
        htmlstring = '<div editable="true"' +
                     optionalStr + repeatableStr + movableStr +
                     'id="' +
                     id +
                     '">' +
                     id +
                     '</div>';
        break;
    }

    try {
      GetCurrentEditor().insertHTML(htmlstring);
    } catch (e) {}
  }

  SaveWindowLocation();

  return true;  
}