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
 * Linspire Inc..
 * Portions created by the Initial Developer are Copyright (C) 2004
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

var gFiringElement = null;
var phpOrPi = null;
var gEditor;
var gDoc;
var gNewNodeRequested = false;

function Startup()
{
  gFiringElement = window.arguments[1];
  var command = "";
  if (window.arguments.length > 2)
    command = window.arguments[2];

  gEditor = GetCurrentEditor();
  if (!gEditor)
    return false;

  var bundle = document.getElementById("dialogBundle");

  gDialog.dialog      = document.getElementById("editPHPorCommentDlg");
  gDialog.elementData = document.getElementById("elementData");

  if (!gFiringElement)
  {
    gNewNodeRequested = true;

    var imageSource = "";
    var innerNode;
    gDoc = gEditor.document;
    if (command == "cmd_insertPHPCode")
    {
      gFiringElement = gDoc.createElementNS(NVU_NS, "php");
      innerNode = gDoc.createProcessingInstruction("php", "");
      imageSource = "chrome://editor/content/images/tag-PHP.gif";
    }
    else
    {
      gFiringElement = gDoc.createElementNS(NVU_NS, "comment");
      innerNode = gDoc.createComment("");
      //imageSource = "chrome://editor/content/images/tag-PI.gif";
      imageSource = "chrome://editor/content/images/tag-comment.gif"; // Kaze
    }
    var image = gDoc.createElement("img");
    image.setAttribute("src", imageSource);
    gFiringElement.appendChild(image);
    gFiringElement.appendChild(innerNode);
    gFiringElement.setAttribute("xmlns", NVU_NS); // Kaze
  }

  phpOrPi = gFiringElement.firstChild.nextSibling;

  var type = gFiringElement.nodeName.toLowerCase();
  var titleString;
  if (type == "php")
    titleString = bundle.getString("editphp");
  else
    titleString = bundle.getString("editcomment");

  gDialog.elementData.value = phpOrPi.data;

  gDialog.dialog.setAttribute("title", titleString);
  SetWindowLocation();
}

function onAccept()
{
  var value = gDialog.elementData.value;
  phpOrPi.data = value;
  gFiringElement.setAttribute("title", value.replace( /\n/g , " "));
  if (gNewNodeRequested)
    gEditor.insertElementAtSelection(gFiringElement, true);
  else // Kaze: mark the current page as modified
    gEditor.incrementModificationCount(1);
}
