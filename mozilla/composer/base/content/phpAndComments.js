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
 * The Original Code is DWT Groker.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), Original author
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
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

//function MakePhpAndCommentsVisible(doc)
function MakePhpAndCommentsVisible(doc, element)
{
  function acceptNode(node)
  {
    //if (node.nodeType == Node.COMMENT_NODE ||
        //node.nodeType == Node.PROCESSING_INSTRUCTION_NODE) {
    if ((node.nodeType == Node.COMMENT_NODE || node.nodeType == Node.PROCESSING_INSTRUCTION_NODE)
      && node.parentNode.getAttribute("xmlns") != NVU_NS) {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  }

  if (!element) element = doc.documentElement; // Kaze
  //var treeWalker = doc.createTreeWalker(doc.documentElement,
  var treeWalker = doc.createTreeWalker(element,
                                        NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
                                        acceptNode,
                                        true);
  if (treeWalker) {
    var anchorNode = treeWalker.nextNode();
    while (anchorNode) {
      var tmp = treeWalker.nextNode();

      var span, text = anchorNode.data;
      var image = doc.createElement("img");
      image.setAttribute("_moz_dummy", "true");
      if (anchorNode.nodeType == Node.COMMENT_NODE)
      {
        span = doc.createElementNS(NVU_NS, "comment");
        image.setAttribute("src", "chrome://editor/content/images/tag-comment.gif");
      }
      else if (anchorNode.nodeType == Node.PROCESSING_INSTRUCTION_NODE)
      {
        if (anchorNode.target == "php")
        {
          span = doc.createElementNS(NVU_NS, "php");
          image.setAttribute("src", "chrome://editor/content/images/tag-PHP.gif");
        }
        else
        {
          span = doc.createElementNS(NVU_NS, "pi");
          image.setAttribute("src", "chrome://editor/content/images/tag-PI.gif");
          text = anchorNode.target + " " + text;
        }
      }

      span.setAttribute("xmlns", NVU_NS);
      span.setAttribute("title", text.replace( /\n/g , " "));
      anchorNode.parentNode.insertBefore(span, anchorNode);
      
      span.appendChild(image);
      span.appendChild(anchorNode);
      
      anchorNode = tmp;
    }
  }
}

//function MakePhpAndCommentsInvisible(doc)
function MakePhpAndCommentsInvisible(doc, element)
{
  function acceptNode(node)
  {
    if (node.nodeType == Node.ELEMENT_NODE &&
        node.namespaceURI == NVU_NS) {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  }

  if (!element) element = doc.documentElement; // Kaze
  //var treeWalker = doc.createTreeWalker(doc.documentElement,
  var treeWalker = doc.createTreeWalker(element,
                                        NodeFilter.SHOW_ELEMENT,
                                        acceptNode,
                                        true);
  if (treeWalker) {
    var anchorNode = treeWalker.nextNode();
    while (anchorNode) {
      var tmp = treeWalker.nextNode();

      var child  = anchorNode.firstChild.nextSibling;
      var parent = anchorNode.parentNode;
      while (child)
      {
        var nextChild = child.nextSibling;
        parent.insertBefore(child, anchorNode);
        child = nextChild;
      }
      parent.removeChild(anchorNode);

      anchorNode = tmp;
    }
  }
}

function EditPIorComment(element)
{
  if (!IsHTMLEditor())
    return;

  window.openDialog("chrome://editor/content/EdPHPorPI.xul", "_blank", "chrome,close,titlebar,modal,resizable=yes", "", element);
  gContentWindow.focus();
}

AddProcessorNotifier(MakePhpAndCommentsVisible,   "beforeBackToNormal");
AddProcessorNotifier(MakePhpAndCommentsInvisible, "beforeGettingSource");
