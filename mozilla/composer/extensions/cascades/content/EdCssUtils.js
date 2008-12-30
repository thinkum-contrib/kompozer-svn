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
 * The Original Code is BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel.glazman@disruptive-innovations.com>, Original author
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

var CssUtils = {
	getStyleSheets: function CssUtils_getStyleSheets(aDoc)
	{
		return aDoc.styleSheets;
	},

  _enumerateStyleSheet: function CssUtils__enumerateStyleSheet(aSheet, aCallback)
  {
    if (aCallback(aSheet))
      return;
    var rules = aSheet.cssRules;
    for (var j = 0; j < rules.length; j++)
    {
      var rule = rules.item(j);
      switch (rule.type)
      {
      	case CSSRule.IMPORT_RULE:
      	  this._enumerateStyleSheet(rule.styleSheet, aCallback);
      	  break;
      	case CSSRule.MEDIA_RULE:
      	  this._enumerateStyleSheet(rule, aCallback);
      	  break;
      	default:
      	  break;
      }

    }
  },

  enumerateStyleSheets: function CssUtils_enumerateStyleSheets(aDocument, aCallback)
  {
  	var stylesheetsList = aDocument.styleSheets;
    for (var i = 0; i < stylesheetsList.length; i++)
    {
      var sheet = stylesheetsList.item(i);
      this._enumerateStyleSheet(sheet, aCallback);
    }
  },

  getComputedStyle: function CssUtils_getComputedStyle(aElt)
  {
  	return aElt.ownerDocument.defaultView.getComputedStyle(aElt, "");
  },

  findClassesInSelector: function CssUtils_findClassesInSelector(aSelector)
  {
    return aSelector.match( /\.-?([_a-z]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))([_a-z0-9-]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))*/gi );
  },

  findIdsInSelector: function CssUtils_findClassesInSelector(aSelector)
  {
    return aSelector.match( /#-?([_a-z]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))([_a-z0-9-]|[\200-\377]|((\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?)|\\[^\r\n\f0-9a-f]))*/gi );
  },

  getCssHintsFromDocument: function CssUtils_getAllClassesFromDocument(aDocument, aDetector)
  {
    var classList = [];
  
    function enumerateClass(aSheet)
    {
      var cssRules = aSheet.cssRules;
      for (var i = 0; i < cssRules.length; i++)
      {
        var rule = cssRules.item(i);
        if (rule.type == CSSRule.STYLE_RULE)
        {
          var selectorText = rule.selectorText;
          var matches = aDetector(selectorText);
          if (matches)
            for (var j = 0; j < matches.length; j++)
              classList.push(matches[j].substr(1));
        }
      }
      return false;
    }
  
    CssUtils.enumerateStyleSheets(aDocument, enumerateClass);

    return classList;
  },

  getAllClassesForDocument: function CssUtils_getAllClassesForDocument(aDocument)
  {
    return this.getCssHintsFromDocument(aDocument, this.findClassesInSelector);
  },

  getAllIdsForDocument: function CssUtils_getAllClassesForDocument(aDocument)
  {
    return this.getCssHintsFromDocument(aDocument, this.findIdsInSelector);
  },

  getAllLocalRulesForSelector: function CssUtils_getAllRulesForSelector(aDocument, aSelector)
  {
    var ruleList = [];
  
    function enumerateRules(aSheet)
    {
      if (aSheet.ownerNode instanceof HTMLStyleElement)
      {
        var cssRules = aSheet.cssRules;
        for (var i = 0; i < cssRules.length; i++)
        {
          var rule = cssRules.item(i);
          if (rule.type == CSSRule.STYLE_RULE)
          {
            var selectorText = rule.selectorText;
            if (selectorText == aSelector)
              ruleList.push({rule:rule, index:i});
          }
        }
        return false;
      }
      return true;
    }
  
    CssUtils.enumerateStyleSheets(aDocument, enumerateRules);

    return ruleList;
  },

  deleteAllLocalRulesForSelector: function CssUtils_deleteAllLocalRulesForSelector(aDocument, aSelector, aDeclarations)
  {
    var ruleList = this.getAllLocalRulesForSelector(aDocument, aSelector);
    var l = ruleList.length;
    for (var i = 0; i < l; i++)
    {
      var rule = ruleList[i].rule;
      var parentRule = rule.parentRule;
      var parentStyleSheet = rule.parentStyleSheet;
      if (rule.type == CSSRule.STYLE_RULE && !parentRule)
      {
        if (aDeclarations)
        {
          for (var j = 0; j < aDeclarations.length; j++)
            rule.style.removeProperty(aDeclarations[j].property);
          if (!rule.style.length)
            parentStyleSheet.deleteRule(ruleList[i].index);
        }
        else
          parentStyleSheet.deleteRule(ruleList[i].index);
      }
      this.reserializeEmbeddedStylesheet(parentStyleSheet);
    }
  },

  getStyleSheetForScreen: function CssUtils_getStyleSheetForScreen(aDocument)
  {
    var styleElements = aDocument.getElementsByTagName("style");
    var stylesheet = null;
    if (styleElements.length)
    {
      // try to find a stylesheet for the correct media
      for (var i = 0; !stylesheet && i < styleElements.length; i++)
      {
        var styleElement = styleElements[i];
        if (styleElement.hasAttribute("media"))
        {
          var mediaAttr = styleElement.getAttribute("media");
          if (mediaAttr.indexOf("screen") != -1||
              mediaAttr.indexOf("all") != -1)
            stylesheet = styleElement.sheet;
        }
        else
          stylesheet = styleElement.sheet;
      }
    }
    if (!stylesheet)
    {
      var styleElement = aDocument.createElement("style");
      styleElement.setAttribute("type", "text/css");
      var textNode = aDocument.createTextNode("/* created by BlueGriffon */");
      styleElement.appendChild(textNode);
      aDocument.getElementsByTagName("head")[0].appendChild(styleElement);
      stylesheet = styleElement.sheet;
    }
    return stylesheet;
  },

  addRuleForSelector: function CssUtils_addRuleForSelector(aDocument, aSelector, aDeclarations)
  {
    this.deleteAllLocalRulesForSelector(aDocument, aSelector, aDeclarations);
    var ruleList = this.getAllLocalRulesForSelector(aDocument, aSelector);

    if (!ruleList || !ruleList.length)
    {
      var stylesheet = this.getStyleSheetForScreen(aDocument);
      var str = stylesheet.ownerNode.textContent;
      str += "\n" + aSelector + " {";
      for (var j = 0; j < aDeclarations.length; j++)
      {
        var property = aDeclarations[j].property;
        var value = aDeclarations[j].value;
        var priority = aDeclarations[j].priority;
        str += "\n  " + property + ": " +
               value +
               (priority ? " !important;" : ";");
      }
      str += "\n}\n";
      stylesheet.ownerNode.firstChild.data = str;
      return;
    }

    var rule = ruleList[ruleList.length -1].rule;
    for (var j = 0; j < aDeclarations.length; j++)
    {
        var property = aDeclarations[j].property;
        var value = aDeclarations[j].value;
        var priority = aDeclarations[j].priority;
        rule.style.setProperty(property,
                               value,
                               priority);
    }

    this.reserializeEmbeddedStylesheet(rule.parentStyleSheet);
  },

  reserializeEmbeddedStylesheet: function CssUtils_reserializeEmbeddedStylesheet(aSheet)
  {
    var cssRules = aSheet.cssRules;
    var str = "";
    for (var i = 0; i < cssRules.length; i++)
    {
      var rule = cssRules[i];
      switch (rule.type)
      {
        case CSSRule.CHARSET_RULE:
        case CSSRule.IMPORT_RULE:
          str += (i ? "\n" : "") + rule.cssText;
          break;
        case CSSRule.STYLE_RULE:
          {
            str += (i ? "\n" : "") + rule.selectorText + " {";
            var declarations = rule.style;
            for (var j = 0; j < declarations.length; j++)
            {
              var property = declarations.item(j);
              var value = declarations.getPropertyValue(property);
              var priority = declarations.getPropertyPriority(property);
              str += "\n  " + property + ": " +
                     value +
                     (priority ? ";" : " !important;");
            }
          }
          break;
        default:
          break;
      }
      str += "\n}\n";
    }
    var styleElt = aSheet.ownerNode;
    var child = styleElt.firstChild;
    while (child)
    {
      var tmp = child.nextSibling;
      styleElt.removeChild(child);
      child = tmp;
    }
    var textNode = styleElt.ownerDocument.createTextNode(str);
    styleElt.appendChild(textNode);
  },

  getUseCSSPref: function()
  {
    try {
      var useCSS = GetPrefs().getIntPref("bluegriffon.css.policy");
      return useCSS;
    }
    catch(e) { dump("Cannot get preference bluegriffon.css.policy; defaulting to HTML attributes") }

    return 0;
  }
};

// Kaze: this function should rather be in ComposerCommands.js
function GetEditorClasses(aElt) {
  var e = aElt;
  var display = CssUtils.getComputedStyle(e).getPropertyValue("display");
  while (e && display == "inline" && e.className == "") {
    e = e.parentNode;
    display = CssUtils.getComputedStyle(e).getPropertyValue("display");
  }
  return {
    classes: e.className,
    node: e
  };
}
