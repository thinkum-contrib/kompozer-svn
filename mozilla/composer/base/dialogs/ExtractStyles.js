const kIdSeedStr = "abcdefghijklmnopqrestuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function Startup()
{
  var dialogNode = document.getElementById("extractStyleDlg");

  gDialog.okButton          = dialogNode.getButton("accept");
  gDialog.warning           = document.getElementById("warning");
  gDialog.idTextbox         = document.getElementById("idTextbox");
  gDialog.applicationField  = document.getElementById("applicationField");
  gDialog.classCheckbox     = document.getElementById("classCheckbox");
  gDialog.classTextbox      = document.getElementById("classTextbox");
  gDialog.typeCheckbox      = document.getElementById("typeCheckbox");
  gDialog.hoveredCheckbox   = document.getElementById("hoveredCheckbox");

  gDialog.okButton.disabled = true;

  gDialog.firingElement = window.opener.gContextMenuFiringDocumentElement;
  if (gDialog.firingElement.hasAttribute("id"))
  {
    gDialog.idTextbox.value = gDialog.firingElement.getAttribute("id");
    ControlElementId(gDialog.idTextbox);
  }
}

function ControlElementId(e)
{
  var id = e.value;
  id = id.replace(/ /g,"");
  e.value = id;

  if (!id || (id != gDialog.firingElement.getAttribute("id") &&
              GetCurrentEditor().document.getElementById(id)))
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

function ChooseId()
{
  var idStr = "moz_";
  for (var i=0; i<8; i++)
  {
   idStr += kIdSeedStr[Math.floor(Math.random()*52)+1]
  }
  idStr += Math.floor(Math.random()*10000);
  gDialog.idTextbox.value = idStr;
  ControlElementId(gDialog.idTextbox);
}

function CheckOkButtonState()
{
  var applicationField = gDialog.applicationField.value;
  if (applicationField == "" || applicationField == "thisElementOnly")
    ControlElementId(gDialog.idTextbox);
  else
    gDialog.okButton.disabled = (gDialog.classCheckbox.checked &&
                                 !gDialog.classTextbox.value);
}

function ApplicationFieldSelect()
{
  var applicationField = gDialog.applicationField.value;
  var tho = (applicationField == "thisElementOnly")

  SetElementEnabledById("idLabel",          tho);
  SetElementEnabledById("idTextbox",        tho);
  SetElementEnabledById("idChooseButton",   tho);

  SetElementEnabledById("classCheckbox",   !tho);
  SetElementEnabledById("classTextbox",    (!tho && gDialog.classTextbox.checked));
  SetElementEnabledById("typeCheckbox",    !tho);
  SetElementEnabledById("hoveredCheckbox", !tho);

  CheckOkButtonState();
}

function ClassTestSelect()
{
  gDialog.okButton.disabled = (gDialog.classCheckbox.checked && gDialog.classTextbox.value == "");
  SetElementEnabledById("classTextbox", gDialog.classCheckbox.checked);
}

function onAccept()
{
  // aaaah, interesting stuff start here ;-)
  // first, get the context
  var applicationField = gDialog.applicationField.value;
  var selector = "*";

  switch (applicationField)
  {
    case "allElements":
      if (gDialog.typeCheckbox.checked)
        selector =  gDialog.firingElement.nodeName.toLowerCase();
      if (gDialog.classCheckbox.checked)
        selector += "." + gDialog.classTextbox.value;
      if (gDialog.hoveredCheckbox.checked)
        selector += ":hover";
      break;
    case "thisElementOnly":
    default:
      selector = "*#" + gDialog.idTextbox.value;
      break;
  }

  // now, let's try to remove the existing styles for the same selector.
  var doc = GetCurrentEditor().document;
  var stylesheets = doc.styleSheets;
  var insertionPoint = null;

  if (stylesheets)
  {
    var stylesheetsLength = stylesheets.length;
    if (stylesheetsLength)
    {
      // look at all stylesheets attached to the document
      var sheetIndex;
      for (sheetIndex = 0; sheetIndex < stylesheetsLength; sheetIndex++)
      {
        // we can modify only the ones embedded in the document through a
        // STYLE element
        var stylesheet = stylesheets.item(sheetIndex);
        var ownerNode  = stylesheet.ownerNode;
        // warning, chrome stylesheets have no ownerNode...
        if (ownerNode &&
            ownerNode.nodeType == Node.ELEMENT_NODE &&
            ownerNode.nodeName.toLowerCase() == "style")
        {
          insertionPoint = stylesheet;
          // TODO: we _should_ be looking at the medialist...
          var cssRules = stylesheet.cssRules;
          if (cssRules)
          {
            var ruleLength = cssRules.length;
            if (ruleLength)
            {
              var ruleIndex;
              var modified = false;
              for (ruleIndex = 0; ruleIndex < ruleLength; ruleIndex++)
              {
                // we are looking for style rules
                var rule = cssRules.item(ruleIndex);
                if (rule.type == CSSRule.STYLE_RULE)
                {
                  var deleteThisRule = false;
                  // what's its selector ?
                  var selectorText = rule.selectorText;
                  if (selectorText == selector)
                  {
                    // YEP!
                    deleteThisRule = true;
                  }
                  else if (selector[0] == "*" &&
                           selector == "*" + selectorText)
                  {
                    // Yep too!
                    deleteThisRule = true;
                  }
                  if (deleteThisRule)
                  {
                    stylesheet.deleteRule(ruleIndex);
                    ruleIndex--;
                    ruleLength--;
                    modified = true;
                  }
                }
              }
              // let's rely on CaScadeS to serialize the sheet
              if (modified)
                SerializeEmbeddedSheet(stylesheet);
            }
          }
        }
      }
    }
  }

  var insertionPointOwnerNode;
  if (!insertionPoint)
  {
    insertionPointOwnerNode = doc.createElement("style");
    insertionPointOwnerNode.setAttribute("type", "text/css");
    doc.getElementsByTagName("head")[0].appendChild(insertionPointOwnerNode);
  }
  else
    insertionPointOwnerNode = insertionPoint.ownerNode;

  var ruleText = "\n" + selector + "\n{\n";
  var styles = gDialog.firingElement.style;
  if (styles)
  {
    var l = styles.length, i;
    for (i = 0; i < l; i++)
    {
      var property   = styles.item(i);
      var value      = styles.getPropertyValue(property);
      var importance = styles.getPropertyPriority(property);

      ruleText += "  " + property + ": " + value;
      if (importance)
        ruleText += " ! important";
      ruleText += ";\n";
    }
  }
  ruleText += "}\n\n";

  var textNode = doc.createTextNode(ruleText);
  insertionPointOwnerNode.appendChild(textNode);

  gDialog.firingElement.removeAttribute("style");
  gDialog.firingElement.removeAttribute("id");
  gDialog.firingElement.removeAttribute("class");
  switch (applicationField)
  {
    case "allElements":
      if (gDialog.classCheckbox.checked)
        gDialog.firingElement.setAttribute("class", gDialog.classTextbox.value);
      break;
    case "thisElementOnly":
    default:
      gDialog.firingElement.setAttribute("id", gDialog.idTextbox.value);
      break;
  }

  GetCurrentEditor().incrementModificationCount(1);
}






