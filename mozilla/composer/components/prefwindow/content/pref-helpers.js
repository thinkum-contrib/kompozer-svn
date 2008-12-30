/*
 * ***** BEGIN LICENSE BLOCK *****
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
 *   kompozer.net
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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
 * and other provisions required by the LGPL or the GPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** -->
 */

var gActiveDeck;

function Startup() {
  ChooseDeck(document.getElementById("helperDeckSelector").firstChild);
}

function ChooseDeck(item) {
  var index = item.parentNode.parentNode.selectedIndex;
  document.getElementById("helperAppsDeck").selectedIndex = index;
  gActiveDeck = item.value;
  //setTimeout(EnableUI, 100);
  /*
   *if (document.getElementById("helperUseSystem-" + gActiveDeck).value)
   *  setTimeout(onUseSystemHelper, 100);
   *else
   *  setTimeout(onUseCustomHelper, 100);
   */
}

function onUseSystemHelper() {
  //document.getElementById("helperPath-" + gActiveDeck).setAttribute("disabled", "true");
  //document.getElementById("helperArgs-" + gActiveDeck).setAttribute("disabled", "true");
  //document.getElementById("filePicker-" + gActiveDeck).setAttribute("disabled", "true");
}

function onUseCustomHelper() {
  //document.getElementById("helperPath-" + gActiveDeck).removeAttribute("disabled");
  //document.getElementById("helperArgs-" + gActiveDeck).removeAttribute("disabled");
  //document.getElementById("filePicker-" + gActiveDeck).removeAttribute("disabled");
}

function EnableUI() {
  var disable = (document.getElementById("helperUseSystem-" + gActiveDeck).value);
  document.getElementById("helperPath-" + gActiveDeck).disabled = disable;
  document.getElementById("helperArgs-" + gActiveDeck).disabled = disable;
  document.getElementById("filePicker-" + gActiveDeck).disabled = disable;
}

function onFilePicker() {
  const filePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(filePicker);
  fp.init(window, null, filePicker.modeOpen);
  //fp.appendFilter("", filePicker.filterApps); // Kaze: not working on Linux?!?
  var res = fp.show();
  if (res == filePicker.returnOK)
    document.getElementById("helperPath-" + gActiveDeck).value = fp.file.path;
}

function resetFileFilter(button) {
  var textElt = button.previousSibling;
  var prefStr = textElt.getAttribute("prefstring");

  // TODO: implement a real 'reset()' instead of this crap
  var filter = prefStr.replace("extensions.sitemanager.filter.", "");
  var prefValue = "";

  if (filter == "html")
    prefValue = "htm, html, xhtml";
  else if (filter == "css")
    prefValue = "css";
  else if (filter == "images")
    prefValue = "ico, jpg, jpeg, png, gif, bmp";
  else if (filter == "media")
    prefValue = "ogg, ogm, mpeg, mpg, mp3, mp4, mov, wma, wmv, avi";
  else if (filter == "text")
    prefValue = "txt, ht*, js, xml, asp, jsp, php*";

  textElt.value = prefValue;
}

