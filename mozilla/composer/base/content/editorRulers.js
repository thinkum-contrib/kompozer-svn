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
 * The Initial Developer of the Original Code is Linspire Inc..
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman  <glazman@disruptive-innovations.com>, Original author
 *   Fabien Cazenave <kaze@kompozer.net>
 *   John Deal       <bassdeal@yahoo.com>
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

const HTML_NS = "http://www.w3.org/1999/xhtml";

// <Kaze>  this ruler management relies on 4 specific properties:
//   * realXPosition
//   * realYPosition
//   * realWidth
//   * realHeight
//
// these properties are implemented with a patch on the Gecko core, see:
//   * mozilla/dom/public/idl/html/nsIDOMNSHTMLElement.idl
//   * mozilla/content/html/content/src/nsGenericHTMLElement.h
//   * mozilla/content/html/content/src/nsGenericHTMLElement.cpp
//
// this patch used to work properly on Gecko 1.7 but crashes Gecko 1.8.1
// and it should be possible to implement these properties with pure JavaScript
// so let's use this USE_CORE_PATCH constant to test both behaviors.

const USE_CORE_PATCH = false;

// turn this constant to "true" if you want to crash KompoZer ;-)
// </Kaze>

var gRulerRow = null;
var gFiringElement = null;

var gTable     = { obj: null, realWidth: 0,    realHeight: 0 };

var gSeparator = { obj: null, realPosition: 0, realSize: 0, visibleSize: 0 };
var gPrevious  = { obj: null, realPosition: 0, realSize: 0, visibleSize: 0 };
var gNext      = { obj: null, realPosition: 0, realSize: 0, visibleSize: 0 };

var gOriginalX = 0, gOriginalY = 0;

var movingSeparator = false;

var gColumnIndex = 0;

function CleanObjectChildren(aObject)
{
  if (!aObject)
    return;

  var child = aObject.lastChild;
  while (child)
  {
    var tmp = child.previousSibling;
    aObject.removeChild(child);
    child = tmp;
  }
}

function UpdateRulers(elt)
{
  // let's clean up the rulers first
  var hRuler = document.getElementById("hRuler");
  var vRuler = document.getElementById("vRuler");

  // Kaze: return if rulers are collapsed to improve speed
  if (hRuler.parentNode.collapsed) return;

  if (hRuler)
    CleanObjectChildren(hRuler);
  if (vRuler)
    CleanObjectChildren(vRuler);

  var editor = GetCurrentEditor();
  var selection = editor.selection;
  if (selection.rangeCount > 1)
  {
    var range = selection.getRangeAt(0);
    elt = range.startContainer.childNodes[range.startOffset];
  }
  else
    while(elt && !editor.nodeIsBlock(elt))
      elt = elt.parentNode;

  if (hRuler)
    FillHorizontalRuler(hRuler, elt);
  if (vRuler)
    FillVerticalRuler(vRuler, elt);
}

function AddVerticalLength(aDoc, aParent, aText)
{
  var l = aText.length, i;
  var preflexer1 = aDoc.createElementNS(XUL_NS, "spacer");
  var preflexer2 = aDoc.createElementNS(XUL_NS, "spacer");
  preflexer1.setAttribute("flex", "1");
  preflexer2.setAttribute("flex", "1");

  aParent.appendChild(preflexer1);

  for (i = l - 1; i >= 0; i--)
  {
    var c = aText[i];
    var url = "chrome://editor/content/images/v" + c + ".png";
    var newImage = aDoc.createElementNS(XUL_NS, "image");
    newImage.setAttribute("src", url);
    var newHbox = aDoc.createElementNS(XUL_NS, "hbox");
    var flexer1 = aDoc.createElementNS(XUL_NS, "spacer");
    var flexer2 = aDoc.createElementNS(XUL_NS, "spacer");
    flexer1.setAttribute("flex", "1");
    flexer2.setAttribute("flex", "1");

    newHbox.appendChild(flexer1);
    newHbox.appendChild(newImage);
    newHbox.appendChild(flexer2);

    aParent.appendChild(newHbox);
  }

  aParent.appendChild(preflexer2);
}

function AddHorizontalLength(aDoc, aParent, aText)
{
  var flexer1 = aDoc.createElementNS(XUL_NS, "spacer");
  var flexer2 = aDoc.createElementNS(XUL_NS, "spacer");
  flexer1.setAttribute("flex", "1");
  flexer2.setAttribute("flex", "1");

  var newLabel = aDoc.createElementNS(XUL_NS, "label");
  newLabel.setAttribute("value", aText);

  aParent.appendChild(flexer1);
  aParent.appendChild(newLabel);
  aParent.appendChild(flexer2);
}

function FillVerticalRuler(ruler, elt)
{
  // get firing element's document
  var doc = elt.ownerDocument;
  var editor = GetCurrentEditor();
  editor instanceof Components.interfaces.nsITableEditor;

  // table cells are handled differently
  if (elt.nodeName.toLowerCase() == "td" ||
      elt.nodeName.toLowerCase() == "th")
  {
    var tableElt = editor.getElementOrParentByTagName("table", null);
    var rowCount = { value: 0 };
    var colCount = { value: 0 };
    editor.getTableSize(tableElt, rowCount, colCount);

    var rowObj = { value: 0 };
    var colObj = { value: 0 };
    editor.getCellIndexes(cell, rowObj, colObj);

    gFiringElement = elt;

    gColumnIndex = colObj.value;
    if (USE_CORE_PATCH) {
      var bottom = editor.getCellAt(tableElt, 0, gColumnIndex).realYPosition - 2;
    } else {
      // JRD: getBoxObjectFor() should be replaced by getBoundingClientRect() in future Gecko releases.
      bottom = doc.getBoxObjectFor(tableElt).y;
    }

    var minWidthEm = 2;
    for (var i = 0; i < rowCount.value; i++)
    {
      var cell = editor.getCellAt(tableElt, i, gColumnIndex);
      // <Kaze>
      if (!cell) continue;                      // see http://forum.nvudev.org/viewtopic.php?p=16964#16964
      if (cell.hasAttribute("rowspan"))
        i += cell.getAttribute("rowspan") - 1;  // Kaze
      // </Kaze>

      if (USE_CORE_PATCH) {
        var y = cell.realYPosition;
        var h = cell.realHeight;
      } else {
        //y = cell.offsetTop;
        y = cell.offsetTop - GetBodyElement().parentNode.scrollTop; // Kaze
        h = cell.offsetHeight;
      }

      var newSeparator = document.createElementNS(XUL_NS, "vbox");
      newSeparator.setAttribute("class", "rowSeparator");
      var separatorSize = Math.max(y - bottom, 2);
      newSeparator.setAttribute("style", "height: " + separatorSize  + "px; " +
                                         "top: "    + (bottom + 1) + "px;");
      ruler.appendChild(newSeparator);

      var newBox = document.createElementNS(XUL_NS, "vbox");
      hh = GetObjectHeight(cell);
      newBox.setAttribute("class", "rowBox");
      newBox.setAttribute("value", hh);
      newBox.setAttribute("onclick", "SelectRowFromVRuler(this);");
      newBox.setAttribute("cellref", i);
      newBox.setAttribute("style", "height: " + (h - separatorSize + 2) + "px; " +
                                   "vertical-align: middle;" +
                                   "top: "  + (bottom + separatorSize + 1) + "px; " +
                                   "cursor: w-resize;");
      AddVerticalLength(document, newBox, hh + "px");
      ruler.appendChild(newBox);

      if (USE_CORE_PATCH) {
        bottom = y + h;
      } else {
        bottom += h;
      }
    }

    newSeparator = document.createElementNS(XUL_NS, "vbox");
    newSeparator.setAttribute("class", "rowSeparator");
    newSeparator.setAttribute("style", "height: 2px; top: " + (bottom+1) + "px; ");
    ruler.appendChild(newSeparator);

    ruler.style.minWidth = minWidthEm +"em";
  }
  else
  {
    gFiringElement = elt;
    if (USE_CORE_PATCH) {
      y = elt.realYPosition;
      h = elt.realHeight;
    } else {
      //y = elt.offsetTop;
      y = elt.offsetTop - GetBodyElement().parentNode.scrollTop; // Kaze
      h = elt.offsetHeight;
    }

    var t = elt.style.getPropertyValue("top");
    if (t && t != "auto")
    {
      var topGlue = document.createElementNS(XUL_NS, "vbox");
      topGlue.setAttribute("class", "rowGlue");
      topGlue.setAttribute("style", "height: " + (y-4) + "px;" );
      ruler.appendChild(topGlue);
    }

    newSeparator = document.createElementNS(XUL_NS, "vbox");
    newSeparator.setAttribute("class", "rowSeparator");
    newSeparator.setAttribute("style", "height: 2px; top: " + (y-2) + "px;");
    ruler.appendChild(newSeparator);

    newBox = document.createElementNS(XUL_NS, "vbox");
    newBox.setAttribute("class", "rowBox");
    newBox.setAttribute("value", h);
    newBox.setAttribute("style", "height: " + (h+1) + "px; " +
                                 "max-height: " + (h+1) + "px; " +
                                 "top: "  + y + "px;");
    AddVerticalLength(document, newBox, h + "px");
    ruler.appendChild(newBox);
    bottom = y + h;

    newSeparator = document.createElementNS(XUL_NS, "vbox");
    newSeparator.setAttribute("class", "rowSeparator");
    newSeparator.setAttribute("style", "height: 2px; top: " + (bottom+1) + "px;");
    ruler.appendChild(newSeparator);

    var b = elt.style.getPropertyValue("bottom");
    if (t.match( /%/ ) ||
        (b && b != "auto"))
    {
      var bottomGlue = document.createElementNS(XUL_NS, "vbox");
      bottomGlue.setAttribute("class", "rowGlue");
      var springHeight = gFiringElement.ownerDocument.documentElement.realHeight - bottom - 4;
      bottomGlue.setAttribute("style", "top: " + (bottom+4) + "px;" +
                                       "bottom: 0px;" +
                                       "height: " + springHeight + "px;" );
      ruler.appendChild(bottomGlue);
    }
  }
}

function GetNextElement(aNode)
{
  while (aNode && aNode.nodeType != Node.ELEMENT_NODE)
    aNode = aNode.nextSibling;
  return aNode;
}

function FillHorizontalRuler(ruler, elt)
{
  // get firing element's document
  var doc = elt.ownerDocument;

  var editor = GetCurrentEditor();
  while(elt && !editor.nodeIsBlock(elt))
    elt = elt.parentNode;
 
  // table cells are handled differently
  if (elt.nodeName.toLowerCase() == "td" ||
      elt.nodeName.toLowerCase() == "th")
  {
    var row = elt.parentNode;
    gRulerRow = row;
    gFiringElement = elt;
    var cell = GetNextElement(row.firstChild);
    var cellNumber = 0;
    if (USE_CORE_PATCH) {
      var right = cell.realXPosition - 2;
    } else {
      right = cell.offsetLeft;
      //right = elt.offsetLeft - GetBodyElement().parentNode.scrollLeft; // Kaze, not working as expected
    }

    while (cell)
    {
      // Kaze: this won't work if some cells have colspan attributes

      var tagName = cell.nodeName.toLowerCase();
      if (tagName == "td" || tagName == "th")
      {
        if (USE_CORE_PATCH) {
          var x = cell.realXPosition;
          var w = cell.realWidth;
        } else {
          x = cell.offsetLeft;
          //x = cell.offsetLeft - GetBodyElement().parentNode.scrollLeft; // Kaze, not working as expected
          w = cell.clientWidth;
        }

        var newSeparator = document.createElementNS(XUL_NS, "hbox");
        newSeparator.setAttribute("class", "columnSeparator");
        var separatorSize = Math.max(x-right, 4);
        newSeparator.setAttribute("style", "width: " + separatorSize  + "px; " +
                                           "height: 100%; " +
                                           "left: "  + (right + 1) + "px;");
        ruler.appendChild(newSeparator);

        var newBox = document.createElementNS(XUL_NS, "hbox");
        var ww = GetObjectWidth(cell);
        newBox.setAttribute("class", "columnBox");
        newBox.setAttribute("value", ww);
        newBox.setAttribute("onclick", "SelectColumnFromHRuler(this);");
        newBox.setAttribute("cellref", cellNumber++);
        newBox.setAttribute("style", "width: " + (w-separatorSize+4) + "px; " +
                                     "left: "  + (x+separatorSize-1) + "px; " +
                                     "cursor: s-resize;");
        AddHorizontalLength(document, newBox, ww + "px");
        //var newLabel = document.createTextNode(ww + "px");
        //newBox.appendChild(newLabel);
        ruler.appendChild(newBox);
        right = x + w;
      }
      cell = GetNextElement(cell.nextSibling);
    }

    newSeparator = document.createElementNS(XUL_NS, "hbox");
    newSeparator.setAttribute("class", "columnSeparator");
    newSeparator.setAttribute("style", "width: 2px; left: " + (right+1) + "px; ");
    ruler.appendChild(newSeparator);

    editor instanceof Components.interfaces.nsITableEditor;

    gTable.obj = editor.getElementOrParentByTagName("table", null);
    if (USE_CORE_PATCH) {
      gTable.realWidth = gTable.obj.realWidth;
      gTable.realHeight = gTable.obj.realHeight;
    } else {
      gTable.realWidth = gTable.obj.clientWidth;
      gTable.realHeight = gTable.obj.clientHeight;
    }
  }
  else
  {
    gFiringElement = elt;

    // BEGIN HACK!!!!
    var tbody = null;

    if (gFiringElement.nodeName.toLowerCase() == "table")
    {
      tbody = gFiringElement.firstChild;
      while (tbody.nodeName.toLowerCase() != "tbody")
        tbody = tbody.nextSibling;
    }

    if (tbody)
    {
      if (USE_CORE_PATCH) {
        x = tbody.realXPosition;
        w = tbody.realWidth;
      } else {
        x = tbody.offsetLeft;
        w = tbody.clientWidth;
      }
    }
    else
    {
      if (USE_CORE_PATCH) {
        x = elt.realXPosition;
        w = elt.realWidth;
      } else {
        x = elt.offsetLeft;
        w = elt.clientWidth;
      }
    }
    // END HACK!!!!
 
    var l = elt.style.getPropertyValue("left");
    if (l && l != "auto")
    {
      var leftGlue = document.createElementNS(XUL_NS, "hbox");
      leftGlue.setAttribute("class", "columnGlue");
      leftGlue.setAttribute("style", "width: " + (x-2) + "px; text-align: right" );
      newLabel = document.createElementNS(XUL_NS, "label");
      newLabel.setAttribute("value", " ");
      leftGlue.appendChild(newLabel);
      ruler.appendChild(leftGlue);
    }

    newSeparator = document.createElementNS(XUL_NS, "hbox");
    newSeparator.setAttribute("class", "columnSeparator");
    newSeparator.setAttribute("style", "width: 2px; left: " + (x-2) + "px; " );
    ruler.appendChild(newSeparator);

    newBox = document.createElementNS(XUL_NS, "hbox");
    ww = GetObjectWidth(elt);
    newBox.setAttribute("class", "columnBox");
    newBox.setAttribute("value", ww);
    newBox.setAttribute("onclick", "SelectColumnFromHRuler(this);");
    newBox.setAttribute("style", "width: " + (w+1) + "px; " +
                                 "left: "  + (x) + "px;");
    AddHorizontalLength(document, newBox, ww + "px");
    ruler.appendChild(newBox);
    right = x + w;

    newSeparator = document.createElementNS(XUL_NS, "hbox");
    newSeparator.setAttribute("class", "columnSeparator");
    newSeparator.setAttribute("style", "width: 2px; left: " + (right+1) + "px;");
    ruler.appendChild(newSeparator);

    var r = elt.style.getPropertyValue("right");
    if ( l.match( /%/ ) ||
        (r && r != "auto"))
    {
      var rightGlue = document.createElementNS(XUL_NS, "hbox");
      rightGlue.setAttribute("class", "columnGlue");
      rightGlue.setAttribute("style", "left: " + (right+4) + "px; right: 0px;" );
      newLabel = document.createElementNS(XUL_NS, "label");
      newLabel.setAttribute("value", " ");
      rightGlue.appendChild(newLabel);
      ruler.appendChild(rightGlue);
    }
  }

}

function SelectRowFromVRuler(label)
{
  var rowNumber = label.getAttribute("cellref");

  var editor = GetCurrentEditor();
  editor instanceof Components.interfaces.nsITableEditor;

  var tableElt = editor.getElementOrParentByTagName("table", null);
  var cell = editor.getCellAt(tableElt, rowNumber, 0);
  editor.selectElement(cell);
  editor.selectTableRow();
}


function SelectColumnFromHRuler(label)
{
  var colNumber = label.getAttribute("cellref");

  var editor = GetCurrentEditor();
  editor instanceof Components.interfaces.nsITableEditor;

  var tableElt = editor.getElementOrParentByTagName("table", null);
  var cell = editor.getCellAt(tableElt, 0, colNumber);
  editor.selectElement(cell);
  GetCurrentTableEditor().selectTableColumn();
}


function InitiateMoveObjectInRuler(event)
{
  if (!event)
    return;

  if (event.explicitOriginalTarget.nodeName.toLowerCase() == "hbox" &&
      event.explicitOriginalTarget.className == "columnSeparator")
  {
    gOriginalX               = event.clientX;

    gSeparator.obj           = event.explicitOriginalTarget;
    gSeparator.realPosition  = Math.floor(GetObjectLeft(gSeparator.obj));
    gSeparator.realSize      = Math.floor(GetObjectWidth(gSeparator.obj));

    gPrevious.obj = null;
    if (gSeparator.obj.previousSibling &&
        gSeparator.obj.previousSibling.className == "columnBox")
    {
      gPrevious.obj            = gSeparator.obj.previousSibling;
      if (gPrevious.obj)
      {
        gPrevious.realPosition = Math.floor(GetObjectLeft(gPrevious.obj));
        gPrevious.realSize     = Number(gPrevious.obj.getAttribute("value"));
      }
    }

    gNext.obj = null;
    if (gSeparator.obj.nextSibling &&
        gSeparator.obj.nextSibling.className == "columnBox")
    {
      gNext.obj                = gSeparator.obj.nextSibling;
      if (gNext.obj)
      {
        gNext.realPosition     = Math.floor(GetObjectLeft(gNext.obj));
        gNext.realSize         = Number(gNext.obj.getAttribute("value"));
      }
    }

    window.addEventListener("mousemove", MoveObjectInRuler,    false);
    window.addEventListener("mouseup",   EndMoveObjectInRuler, false);
    window.setCursor("w-resize");
  }
  else if (event.explicitOriginalTarget.nodeName.toLowerCase() == "vbox" &&
           event.explicitOriginalTarget.className == "rowSeparator")
  {
    gOriginalY               = event.clientY;
    gSeparator.obj           = event.explicitOriginalTarget;
    gSeparator.realPosition  = Math.floor(GetObjectTop(gSeparator.obj));
    gSeparator.realSize      = Math.floor(GetObjectHeight(gSeparator.obj));

    gPrevious.obj = null;
    if (gSeparator.obj.previousSibling &&
        gSeparator.obj.previousSibling.className == "rowBox")
    {
      gPrevious.obj            = gSeparator.obj.previousSibling;
      if (gPrevious.obj)
      {
        gPrevious.realPosition = Math.floor(GetObjectTop(gPrevious.obj));
        gPrevious.realSize     = Number(gPrevious.obj.getAttribute("value"));
      }
    }

    gNext.obj = null;
    if (gSeparator.obj.nextSibling &&
        gSeparator.obj.nextSibling.className == "rowBox")
    {
      gNext.obj                = gSeparator.obj.nextSibling;
      if (gNext.obj)
      {
        gNext.realPosition     = Math.floor(GetObjectTop(gNext.obj));
        gNext.realSize         = Number(gNext.obj.getAttribute("value"));
      }
    }

    window.addEventListener("mousemove", MoveObjectInRuler,    false);
    window.addEventListener("mouseup",   EndMoveObjectInRuler, false);
    window.setCursor("s-resize");    
  }
}

function MoveObjectInRuler(event)
{
  if (!event || !gSeparator.obj  || movingSeparator)
    return;

  var elt = gSeparator.obj;
  movingSeparator = true;
  if (gSeparator.obj.className == "columnSeparator")
  {
    var difference = event.clientX - gOriginalX;

    gSeparator.obj.style.left = (gSeparator.realPosition + difference) + "px";

    var widthInc = (gFiringElement.nodeName.toLowerCase() == "td" ||
                    gFiringElement.nodeName.toLowerCase() == "th") ? 6 : 1;

    if (gPrevious.obj)
    {
      var newWidth = Math.max(0, gPrevious.realSize    + difference);
      gPrevious.obj.style.width = (newWidth + widthInc) + "px";
      gPrevious.obj.setAttribute("value", newWidth);
      gPrevious.obj.firstChild.nextSibling.setAttribute("value", newWidth + "px");
    }

    if (gNext.obj)
    {
      newWidth = Math.max(0, gNext.realSize    - difference);
      var newX = Math.max(0, gNext.realPosition    + difference);
      gNext.obj.style.width = (newWidth + widthInc) + "px";
      gNext.obj.style.left  = newX + "px";
      gNext.obj.setAttribute("value", newWidth);
      gNext.obj.firstChild.nextSibling.setAttribute("value", newWidth + "px");
    }
  }
  else if (gSeparator.obj.className == "rowSeparator")
  {
    difference = event.clientY - gOriginalY;

    gSeparator.obj.style.top = (gSeparator.realPosition + difference) + "px";

    if (gPrevious.obj)
    {
      var newHeight = Math.max(0, gPrevious.realSize    + difference);
      gPrevious.obj.style.height = (newHeight)  + "px";
      gPrevious.obj.style.maxHeight = (newHeight) + "px";
      gPrevious.obj.style.lineHeight = (newHeight) + "px";
      gPrevious.obj.setAttribute("value", newHeight);
      CleanObjectChildren(gPrevious.obj);
      AddVerticalLength(gPrevious.obj.ownerDocument, gPrevious.obj, newHeight + "px");
    }
    if (gNext.obj)
    {
      newHeight = Math.max(0, gNext.realSize    - difference);
      var newY  = Math.max(0, gNext.realPosition    + difference);
      gNext.obj.style.height = (newHeight) + "px";
      gNext.obj.style.maxHeight = (newHeight) + "px";
      gNext.obj.style.lineHeight = (newHeight) + "px";
      gNext.obj.style.top    = newY + "px";
      gNext.obj.setAttribute("value", newHeight);
      CleanObjectChildren(gNext.obj);
      AddVerticalLength(gNext.obj.ownerDocument, gNext.obj, newHeight + "px");
    }
  }
  movingSeparator = false;
}

function EndMoveObjectInRuler(event)
{
  window.removeEventListener("mousemove", MoveObjectInRuler, false);
  window.removeEventListener("mouseup", EndMoveObjectInRuler, false);

  if (!event)
    return;
  if (!gSeparator.obj)
    return;

  var editor = GetCurrentEditor();
  editor instanceof Components.interfaces.nsITableEditor;
  editor.beginTransaction();

  if (gSeparator.obj.className == "columnSeparator")
  {
    var difference = event.clientX - gOriginalX;

    var tagName = gFiringElement.nodeName.toLowerCase();

    if (tagName == "td" || tagName == "th")
    {
      var tableElt = editor.getElementOrParentByTagName("table", null);
      var rowCountObj = { value: 0 };
      var colCountObj = { value: 0 };
      try {
        editor.getTableSize(tableElt, rowCountObj, colCountObj);
      } catch (e) {}

      var i, cellNumber, cell;
      if (gPrevious.obj)
      {
        cellNumber = gPrevious.obj.getAttribute("cellref");
        for (i = 0; i < rowCountObj.value; i++)
        {
          cell = editor.getCellAt(tableElt, i, cellNumber);
          editor.setAttributeOrEquivalent(cell,
                  "width",
                  Math.max(0, gPrevious.realSize + difference),
                  false);
        }
      }
      else
      {
        var cs = GetComputedStyle(gTable.obj);
        var wi = cs.getPropertyCSSValue("width");
        if (wi.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            wi.primitiveType == CSSPrimitiveValue.CSS_PX)
          SetCSSProperty(gTable.obj, "width", Math.max(0, wi.getFloatValue(5) - difference) + "px");
        else
          SetCSSProperty(gTable.obj, "width", Math.max(0, gTable.realWidth - difference) + "px");

        var dir = cs.getPropertyValue("direction");
        var ml  = cs.getPropertyCSSValue("margin-left");
        if (dir == "ltr" &&
            ml.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            ml.primitiveType == CSSPrimitiveValue.CSS_PX)
        {
          var mlc = Math.floor(ml.getFloatValue(5));
          SetCSSProperty(gTable.obj, "margin-left", Math.max(0, mlc + difference) + "px");
        }
      }

      if (gNext.obj)
      {
        cellNumber = gNext.obj.getAttribute("cellref");
        for (i = 0; i < rowCountObj.value; i++)
        {
          cell = editor.getCellAt(tableElt, i, cellNumber);
          editor.setAttributeOrEquivalent(cell,
                  "width",
                  Math.max(0, gNext.realSize - difference),
                  false);
        }
      }
      else
      {
        cs = GetComputedStyle(gTable.obj);
        wi = cs.getPropertyCSSValue("width");
        if (wi.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            wi.primitiveType == CSSPrimitiveValue.CSS_PX)
          SetCSSProperty(gTable.obj, "width", Math.max(0, wi.getFloatValue(5) + difference) + "px");
        else
          SetCSSProperty(gTable.obj, "width", Math.max(0, gTable.realWidth + difference) + "px");

        dir = cs.getPropertyValue("direction");
        var mr  = cs.getPropertyCSSValue("margin-right");
        if (dir == "rtl" &&
            mr.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            mr.primitiveType == CSSPrimitiveValue.CSS_PX)
        {
          var mrc = Math.floor(mr.getFloatValue(5));
          SetCSSProperty(gTable.obj, "margin-right", Math.max(0, mrc - difference) + "px");
        }
      }
    }
    else
    {
      editor instanceof Components.interfaces.nsIHTMLAbsPosEditor;
      var positionedElement = editor.positionedElement;

      cs = GetComputedStyle(gFiringElement);
      dir = cs.getPropertyValue("direction");

      if (!gPrevious.obj)
      {
        var property = "", counterProperty = "";
        if (positionedElement == gFiringElement)
        {
          property = "left";
          counterProperty = "right";
        }
        else
          property = "margin-left";

        ml = cs.getPropertyCSSValue(property);
        if (dir == "ltr" &&
            ml.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            ml.primitiveType == CSSPrimitiveValue.CSS_PX)
        {
          mlc = Math.floor(ml.getFloatValue(5));
          SetCSSProperty(gFiringElement, property, Math.max(0, mlc + difference) + "px");
          if (counterProperty)
            SetCSSProperty(gFiringElement, counterProperty, "auto");          
        }
        SetCSSProperty(gFiringElement, "width", Math.max(0, gNext.realSize - difference) + "px");
      }
      else if (!gNext.obj)
      {
        var property = "";
        if (positionedElement == gFiringElement)
        {
          property = "right";
          counterProperty = "left";
        }
        else
          property = "margin-right";

        mr = cs.getPropertyCSSValue(property);
        if (dir == "rtl" &&
            mr.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            mr.primitiveType == CSSPrimitiveValue.CSS_PX)
        {
          mrc = Math.floor(mr.getFloatValue(5));
          SetCSSProperty(gFiringElement, property, Math.max(0, mrc - difference) + "px");
          if (counterProperty)
            SetCSSProperty(gFiringElement, counterProperty, "auto");          
        }
        SetCSSProperty(gFiringElement, "width", Math.max(0, gPrevious.realSize + difference) + "px");
      }
    }
  }
  else if (gSeparator.obj.className == "rowSeparator")
  {
    difference = event.clientY - gOriginalY;
    tagName = gFiringElement.nodeName.toLowerCase();

    if (tagName == "td" || tagName == "th")
    {
      tableElt = editor.getElementOrParentByTagName("table", null);
      rowCountObj = { value: 0 };
      colCountObj = { value: 0 };
      try {
        editor.getTableSize(tableElt, rowCountObj, colCountObj);
      } catch (e) {}

      if (gPrevious.obj)
      {
        cellNumber = gPrevious.obj.getAttribute("cellref");
        for (i = 0; i < colCountObj.value; i++)
        {
          cell = editor.getCellAt(tableElt, cellNumber, i);
          editor.setAttributeOrEquivalent(cell,
                  "height",
                  Math.max(0, gPrevious.realSize + difference),
                  false);
        }
      }
      else
      {
        cs = GetComputedStyle(gTable.obj);
        var he = cs.getPropertyCSSValue("height");
        if (he.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            he.primitiveType == CSSPrimitiveValue.CSS_PX)
          SetCSSProperty(gTable.obj, "height", Math.max(0, he.getFloatValue(5) - difference ) + "px");
        else
          SetCSSProperty(gTable.obj, "height", Math.max(0, gTable.realHeight - difference) + "px");
      }
      if (gNext.obj)
      {
        cellNumber = gNext.obj.getAttribute("cellref");
        for (i = 0; i < colCountObj.value; i++)
        {
          cell = editor.getCellAt(tableElt, cellNumber, i);
          editor.setAttributeOrEquivalent(cell,
                  "height",
                  Math.max(0, gNext.realSize - difference),
                  false);
        }
      }
      else
      {
        cs = GetComputedStyle(gTable.obj);
        he = cs.getPropertyCSSValue("height");
        if (he.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
            he.primitiveType == CSSPrimitiveValue.CSS_PX)
          SetCSSProperty(gTable.obj, "height", Math.max(0, he.getFloatValue(5) + difference) + "px");
        else
          SetCSSProperty(gTable.obj, "height", Math.max(0, gTable.realHeight + difference) + "px");
      }
    }
    else
    {
      editor instanceof Components.interfaces.nsIHTMLAbsPosEditor;
      var positionedElement = editor.positionedElement;

      cs = GetComputedStyle(gFiringElement);

      if (!gPrevious.obj)
      {
        var property = "", counterProperty = "";
        if (positionedElement == gFiringElement)
        {
          property = "top";
          counterProperty = "bottom";
        }
        else
          property = "margin-top";

        ml = cs.getPropertyCSSValue(property);
        mlc = Math.floor(ml.getFloatValue(5));
        SetCSSProperty(gFiringElement, property, Math.max(0, mlc + difference) + "px");
        if (counterProperty)
          SetCSSProperty(gFiringElement, counterProperty, "auto");
        SetCSSProperty(gFiringElement, "height", Math.max(0, gNext.realSize - difference) + "px");
      }
      else if (!gNext.obj)
      {
        mr = cs.getPropertyCSSValue(property);
        SetCSSProperty(gFiringElement, "height", Math.max(0, gPrevious.realSize + difference) + "px");
      }
    }

  }

  editor.endTransaction();
  UpdateRulers(gFiringElement);

  gSeparator.obj = null;
  window.setCursor("auto");
}


function SetCSSProperty(elt, property, value)
{
  if (elt)
  {
    var styleAttr = "";
    if (elt.hasAttribute("style"))
      styleAttr = elt.getAttribute("style");
    styleAttr += property + ": " + value + ";" ;
    GetCurrentEditor().setAttribute(elt, "style", styleAttr);
  }
}



function GetComputedStyle(elt)
{
  return GetCurrentEditor().document.defaultView.getComputedStyle(elt, "");
}

function GetObjectWidth(elt)
{
  if (USE_CORE_PATCH) {
    var w = elt.realWidth;
  } else {
    w = elt.clientWidth;
  }
  var computedStyle = GetComputedStyle(elt);
  var computedWidth = computedStyle.getPropertyCSSValue("width");
  if (computedWidth.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
      computedWidth.primitiveType == CSSPrimitiveValue.CSS_PX)
    w = Math.floor(computedWidth.getFloatValue(5));
  else
  {
    var computedPaddingLeft = computedStyle.getPropertyCSSValue("padding-left");
    if (computedPaddingLeft.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
        computedPaddingLeft.primitiveType == CSSPrimitiveValue.CSS_PX)
      w -= Math.floor(computedPaddingLeft.getFloatValue(5));
    var computedPaddingRight = computedStyle.getPropertyCSSValue("padding-right");
    if (computedPaddingRight.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
        computedPaddingRight.primitiveType == CSSPrimitiveValue.CSS_PX)
      w -= Math.floor(computedPaddingRight.getFloatValue(5));
  }

  return w;
}

function GetObjectHeight(elt)
{
  if (USE_CORE_PATCH) {
    var h = elt.realHeight;
  } else {
    h = elt.offsetHeight;
  }
  return h;
}

function GetObjectLeft(elt)
{
  if (USE_CORE_PATCH) {
    var x = elt.realXPosition;
  } else {
    x = elt.offsetLeft;
  }
  var computedStyle = GetComputedStyle(elt);
  var computedLeft = document.defaultView.getComputedStyle(elt, "").getPropertyCSSValue("left");
  if (computedLeft.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
      computedLeft.primitiveType == CSSPrimitiveValue.CSS_PX)
    x = Math.floor(computedLeft.getFloatValue(5));
  else
  {
    var computedPaddingLeft = computedStyle.getPropertyCSSValue("padding-left");
    if (computedPaddingLeft.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
        computedPaddingLeft.primitiveType == CSSPrimitiveValue.CSS_PX)
      x += Math.floor(computedPaddingLeft.getFloatValue(5));
  }
  return x;
}

function GetObjectTop(elt)
{
  if (USE_CORE_PATCH) {
    var y = elt.realYPosition;
  } else {
    y = elt.offsetTop;
  }
  var computedStyle = GetComputedStyle(elt);
  var computedTop = document.defaultView.getComputedStyle(elt, "").getPropertyCSSValue("top");
  if (computedTop.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
      computedTop.primitiveType == CSSPrimitiveValue.CSS_PX)
    y = Math.floor(computedTop.getFloatValue(5));
  else
  {
    var computedPaddingTop = computedStyle.getPropertyCSSValue("padding-top");
    if (computedPaddingTop.cssValueType  == CSSValue.CSS_PRIMITIVE_VALUE &&
        computedPaddingTop.primitiveType == CSSPrimitiveValue.CSS_PX)
      y += Math.floor(computedPaddingTop.getFloatValue(5));
  }
  return y;
}
