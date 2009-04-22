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
 *   Daniel Glazman  (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
 *   Fabien Cazenave (kaze@kompozer.net)
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

// Modified markup cleaner code
var gMarkupCleaner = {
  // main
  cleanupDocument: function() {
    var theDocument = GetCurrentEditor().document;
    var treeWalker = theDocument.createTreeWalker(theDocument.documentElement,
          NodeFilter.SHOW_ELEMENT,
          this.acceptNode,
          true);
    if (treeWalker) {
      var theNode = treeWalker.nextNode(), tmpNode;
      var editor = GetCurrentEditor();
      editor.beginTransaction();
      
      while (theNode) {
        var tagName = theNode.nodeName.toLowerCase();            
        if (tagName == "ul" || tagName == "ol") {
          var liNode = theNode.previousSibling;
          while (liNode && liNode.nodeName.toLowerCase() != "li")
            liNode = liNode.previousSibling;
          
          tmpNode = treeWalker.nextNode();
          if (liNode) {
            editor.deleteNode(theNode);
            editor.insertNodeAfter(theNode, liNode, null);
            this.IncreaseReport(gMarkupCleanerData.nestedListsReport);
          }
          theNode = tmpNode;
        }
        else if (tagName == "br") {
          tmpNode = treeWalker.nextNode();
          var parentTagName = theNode.parentNode.nodeName.toLowerCase();
          if (parentTagName != "td" && parentTagName != "th") {
            editor.deleteNode(theNode)
            this.IncreaseReport(gMarkupCleanerData.trailinBRReport);
          }
          theNode = tmpNode;
        }
        else if (tagName == "td" || tagName == "th") {
          if (theNode.hasAttribute("align") || theNode.hasAttribute("valign")) {
            editor.removeAttribute(theNode, "align");
            editor.removeAttribute(theNode, "valign");
            this.IncreaseReport(gMarkupCleanerData.emptyCellsReport);
          }
          theNode = treeWalker.nextNode();
        }
        // <Kaze>
        else if (tagName == "style") {
          this.correctStyle(theNode);
          theNode = treeWalker.nextNode();
        }
        else if (theNode.hasAttribute("style") || theNode.hasAttribute("href") || theNode.hasAttribute("src")) {
          this.correctStyle(theNode);
          this.correctURL(theNode, "href");
          this.correctURL(theNode, "src");
          theNode = treeWalker.nextNode();
        }
        // </Kaze>
        else {
          tmpNode = treeWalker.nextNode();
          editor.deleteNode(theNode);
          this.IncreaseReport(gMarkupCleanerData.emptyBlocksReport);
          theNode = tmpNode;
        }
      }
      
      // <Kaze> remove empty <ul> and <ol> blocks if requested
      // this should be done in the TreeWalker but I'm lazy... TBD later.
      if (gMarkupCleanerData.emptyBlocks) {
        var nodeList = theDocument.getElementsByTagName("ul");
        for (var i=0; i<nodeList.length; i++) {
          tmpNode = nodeList[i];
          if (OnlyWhiteTextNodesStartingAtNode(tmpNode.firstChild, true) &&
              !(tmpNode.hasAttribute("id")) && !(tmpNode.hasAttribute("class")) )  {
            editor.deleteNode(tmpNode);
            this.IncreaseReport(gMarkupCleanerData.emptyBlocksReport);
          }
        }
        nodeList = theDocument.getElementsByTagName("ol");
        for (i=0; i<nodeList.length; i++) {
          tmpNode = nodeList[i];
          if (OnlyWhiteTextNodesStartingAtNode(tmpNode.firstChild, true) &&
              !(tmpNode.hasAttribute("id")) && !(tmpNode.hasAttribute("class")) )  {
            editor.deleteNode(tmpNode);
            this.IncreaseReport(gMarkupCleanerData.emptyBlocksReport);
          }
        }
      }
      // </Kaze>

      editor.endTransaction();
    }
    return;
  },

  acceptNode: function(node) { // TreeWalker
    // TBD : useless test below
    if (node.nodeType == Node.ELEMENT_NODE)
    {
      var tagName = node.nodeName.toLowerCase();
      switch (tagName)
      {
        case "br":
          //~ if (/* gMarkupCleanerData.trailinBRCheckbox.checked && */
          if (gMarkupCleanerData.trailinBR &&
              OnlyWhiteTextNodesStartingAtNode(node.nextSibling, false))
            return NodeFilter.FILTER_ACCEPT;
          break;
      
        case "ul":
        case "ol":
          //~ if (gMarkupCleanerData.nestedListsCheckbox.checked)
          if (gMarkupCleanerData.nestedLists) {
            var parentTagName = node.parentNode.nodeName.toLowerCase();
            if (parentTagName == "ul" || parentTagName == "ol")
              return NodeFilter.FILTER_ACCEPT;
          }
          // Kaze: <ul> and <ol> should be considered as blocks, too
          // but it would mess the 'cleanupDocument' function - TBD later.
          break;
    
        case "p":
        case "div":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
        case "dl":
        case "dt":
        case "dd":
        case "li":
        case "tr":
        case "pre":
        case "address":
        case "blockquote":
          // Kaze: added <dl>, <dt>, <dd>, <li>, <tr>, <pre>, <address>, <blockquote>
          //~ if (/* gMarkupCleanerData.emptyBlocksCheckbox.checked && */
          // Kaze: a block isn't empty if it has an id/class attribute (templates...)
          if (gMarkupCleanerData.emptyBlocks &&
              OnlyWhiteTextNodesStartingAtNode(node.firstChild, true) &&
              !(node.hasAttribute("id")) && !(node.hasAttribute("class")) ) // Kaze
            return NodeFilter.FILTER_ACCEPT;
          break;
        
        case "td":
        case "th":
          //~ if (/* gMarkupCleanerData.emptyCellsCheckbox.checked && */
          if (gMarkupCleanerData.emptyCells &&
              OnlyWhiteTextNodesStartingAtNode(node.firstChild, true))
            return NodeFilter.FILTER_ACCEPT;
          break;
          
        // Kaze
        case "style":
          //~ if (gMarkupCleanerData.localUrlsCheckbox.checked)
          if (gMarkupCleanerData.localUrls)
            return NodeFilter.FILTER_ACCEPT;
          break;
      }
      // Kaze
      //~ if (/* gMarkupCleanerData.localUrlsCheckbox.checked && */
    if (gMarkupCleanerData.localUrls &&
          (node.hasAttribute("href") || node.hasAttribute("src") || node.hasAttribute("style")) )
        return NodeFilter.FILTER_ACCEPT;
      //~ if (gMarkupCleanerData.rgbColorsCheckbox.checked && node.hasAttribute("style"))
        //~ return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  },


  // self-stolen from URL Cleaner ;-)
  correctURL: function(node, attr) {
    if (node.hasAttribute(attr)) {
      var tmp1 = node.getAttribute(attr);
      var tmp2 = MakeRelativeUrl(tmp1);
      if (tmp1 != tmp2) {
        node.setAttribute(attr, tmp2);
        this.IncreaseReport(gMarkupCleanerData.localUrlsReport);
      }
    }
    return;
  },
  
  correctStyle: function(node) {
    var tmp;
    var modified = false;
    
    // get style property text
    var source = null;
    var isStyleNode = (node.nodeName.toLowerCase() == "style");
    if (isStyleNode)
      source = node.innerHTML;
    else if (node.hasAttribute("style"))
      source = node.getAttribute("style");
    if (!source)
      return;
    
    // MakeRelativeURLs(source)
    var fileNodes = source.match(/"file:\/\/[^"]+|url\(file:\/\/[^\)]+/g);
    if (fileNodes) for (var i = 0; i < fileNodes.length; i++) {
      fileNodes[i] = fileNodes[i].replace(/^"|^url\(/, '');
      tmp = MakeRelativeUrl(fileNodes[i]);
      if (tmp != fileNodes[i]) {
        source = source.replace(fileNodes[i], tmp);
        this.IncreaseReport(gMarkupCleanerData.localUrlsReport);
        modified = true;
      }
    }
    if (!modified)
      return;
    
    // update node
    if (isStyleNode) {
      var children = node.childNodes;
      for (var j = children.length-1; j >= 0; j--)
        node.removeChild(children[j]);
      var cssNode = document.createTextNode(source);
      node.appendChild(cssNode);
      node = treeWalker.nextNode();
    }
    else
      node.setAttribute("style", tmp);
    return;
  },

  // UI functions
  Startup: function() {
    gMarkupCleanerData.nestedListsCheckbox = document.getElementById("nestedListsCheckbox");
    gMarkupCleanerData.trailinBRCheckbox   = document.getElementById("trailinBRCheckbox");
    gMarkupCleanerData.emptyBlocksCheckbox = document.getElementById("emptyBlocksCheckbox");
    gMarkupCleanerData.emptyCellsCheckbox  = document.getElementById("emptyCellsCheckbox");
    gMarkupCleanerData.localUrlsCheckbox   = document.getElementById("localUrlsCheckbox");
    
    gMarkupCleanerData.nestedListsReport   = document.getElementById("nestedListsReport");
    gMarkupCleanerData.trailinBRReport     = document.getElementById("trailinBRReport");
    gMarkupCleanerData.emptyBlocksReport   = document.getElementById("emptyBlocksReport");
    gMarkupCleanerData.emptyCellsReport    = document.getElementById("emptyCellsReport");
    gMarkupCleanerData.localUrlsReport     = document.getElementById("localUrlsReport");
  },

  IncreaseReport: function(report) {
    if (report) {
      var reportValue = Number(report.value) + 1;
      report.value = reportValue;
    }
  },

  ClearReport: function(report, checkbox) {
    if (report) {
      if (checkbox && checkbox.checked)
        report.setAttribute("value", "0");
      else
        report.setAttribute("value", " ");
    }
  },

  RunCleanup: function(silentMode) {
    this.ClearReport(gMarkupCleanerData.nestedListsReport, gMarkupCleanerData.nestedListsCheckbox);
    this.ClearReport(gMarkupCleanerData.trailinBRReport,   gMarkupCleanerData.trailinBRCheckbox);
    this.ClearReport(gMarkupCleanerData.emptyBlocksReport, gMarkupCleanerData.emptyBlocksCheckbox);
    this.ClearReport(gMarkupCleanerData.emptyCellsReport,  gMarkupCleanerData.emptyCellsCheckbox);
    this.ClearReport(gMarkupCleanerData.localUrlsReport,   gMarkupCleanerData.localUrlsCheckbox);
    
    gMarkupCleanerData.nestedLists = gMarkupCleanerData.nestedListsCheckbox.checked;
    gMarkupCleanerData.trailinBR   = gMarkupCleanerData.trailinBRCheckbox.checked;
    gMarkupCleanerData.emptyBLocks = gMarkupCleanerData.emptyBlocksCheckbox.checked;
    gMarkupCleanerData.emptyCells  = gMarkupCleanerData.emptyCellsCheckbox.checked;
    gMarkupCleanerData.localUrls   = gMarkupCleanerData.localUrlsCheckbox.checked;
      
    this.cleanupDocument();
    window.opener.ResetStructToolbar();
    return false;
  }
};

var gMarkupCleanerData = {

  nestedLists         : true,
  nestedListsReport   : null,
  nestedListsCheckbox : null,
  
  trailinBR           : true,
  trailinBRReport     : null,
  trailinBRCheckbox   : null,
  
  emptyBlocks         : true,
  emptyBlocksReport   : null,
  emptyBlocksCheckbox : null,
  
  emptyCells          : true,
  emptyCellsCheckbox  : null,
  emptyCellsReport    : null,
  
  localUrls           : true,
  localUrlsReport     : null,
  localUrlsCheckbox   : null,
};

// silent mode (to be called before Tidy)
function kzCodeCleanup() {
  // set silent mode
  gMarkupCleanerData.nestedListsReport = null;
  gMarkupCleanerData.trailinBRReport   = null;
  gMarkupCleanerData.emptyBlocksReport = null;
  gMarkupCleanerData.emptyCellsReport  = null;
  gMarkupCleanerData.localUrlsReport   = null;
  
  // should check that in user prefs
  gMarkupCleanerData.nestedLists = true;
  gMarkupCleanerData.trailinBR   = true;
  gMarkupCleanerData.emptyBLocks = true;
  gMarkupCleanerData.emptyCells  = true;
  gMarkupCleanerData.localUrls   = true;
  
  // launch markup cleaner on document
  gMarkupCleaner.cleanupDocument();
  return;
}

// copied from /chrome/comm.jar!/MarkupCleaner.js
function OnlyWhiteTextNodesStartingAtNode(node, acceptOneBR) { 
  var result = true;
  var brOccurences = 0;
  while (node && result)
  {
    if (node.nodeType != Node.TEXT_NODE)
    {
      if (acceptOneBR &&
          node.nodeType == Node.ELEMENT_NODE &&
          node.nodeName.toLowerCase() == "br")
      {
        brOccurences++;
         if (brOccurences > 1)
           result = false;
      }
      else
        result = false;
    }
    else
      result = RegExp( /^\s*$/ ).test(node.data);
    node = node.nextSibling;
  }
  return result;
}
