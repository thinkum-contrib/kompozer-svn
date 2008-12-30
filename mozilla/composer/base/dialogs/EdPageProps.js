/* 
 * The contents of this file are subject to the Netscape Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/NPL/
 *  
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *  
 * The Original Code is Mozilla Communicator client code, released
 * March 31, 1998.
 * 
 * The Initial Developer of the Original Code is Netscape
 * Communications Corporation. Portions created by Netscape are
 * Copyright (C) 1998-1999 Netscape Communications Corporation. All
 * Rights Reserved.
 * 
 * Contributor(s): 
 *    Charles Manske (cmanske@netscape.com)
 */

var gNewTitle = "";
var gAuthor = "";
var gDescription = "";
var gAuthorElement;
var gDescriptionElement;
var gRootElement;
var gInsertNewAuthor = false;
var gInsertNewDescription = false;
var gTitleWasEdited = false;
var gAuthorWasEdited = false;
var gDescWasEdited = false;
var gTemplateState = false;
var gLanguage;
var gDirection;

var gCharset = "";
var gCharsetWasChanged = false;
var gInitDone = false;

//Cancel() is in EdDialogCommon.js
// dialog initialization code
function Startup()
{
  var editor = GetCurrentEditor();
  if (!editor)
  {
    window.close();
    return;
  }

  gDialog.PageLocation       = document.getElementById("PageLocation");
  gDialog.PageModDate        = document.getElementById("PageModDate");
  gDialog.TitleInput         = document.getElementById("TitleInput");
  gDialog.AuthorInput        = document.getElementById("AuthorInput");
  gDialog.DescriptionInput   = document.getElementById("DescriptionInput");
  gDialog.isTemplate         = document.getElementById("isTemplate");
  gDialog.isFromTemplate     = document.getElementById("isFromTemplate");
  gDialog.active_languages   = document.getElementById("active_languages");
  gDialog.useCustomDirection = document.getElementById("useCustomDirection");
  gDialog.active_charset     = document.getElementById("active_charset");

  // Default string for new page is set from DTD string in XUL,
  //   so set only if not new doc URL
  var location = GetDocumentUrl();
  var lastmodString = GetString("Unknown");

  if (!IsUrlAboutBlank(location))
  {
    // NEVER show username and password in clear text
    gDialog.PageLocation.setAttribute("value", StripPassword(location));

    // Get last-modified file date+time
    // TODO: Convert this to local time?
    var lastmod;
    try {
      lastmod = editor.document.lastModified;  // get string of last modified date
    } catch (e) {}
    // Convert modified string to date (0 = unknown date or January 1, 1970 GMT)
    if(Date.parse(lastmod))
    {
      try {
        const nsScriptableDateFormat_CONTRACTID = "@mozilla.org/intl/scriptabledateformat;1";
        const nsIScriptableDateFormat = Components.interfaces.nsIScriptableDateFormat;
        var dateService = Components.classes[nsScriptableDateFormat_CONTRACTID]
         .getService(nsIScriptableDateFormat);

        var lastModDate = new Date();
        lastModDate.setTime(Date.parse(lastmod));
        lastmodString =  dateService.FormatDateTime("", 
                                      dateService.dateFormatLong,
                                      dateService.timeFormatSeconds,
                                      lastModDate.getFullYear(),
                                      lastModDate.getMonth()+1,
                                      lastModDate.getDate(),
                                      lastModDate.getHours(),
                                      lastModDate.getMinutes(),
                                      lastModDate.getSeconds());
      } catch (e) {}
    }
  }
  gDialog.PageModDate.value = lastmodString;

  gAuthorElement = GetMetaElement("author");
  if (!gAuthorElement)
  {
    gAuthorElement = CreateMetaElement("author");
    if (!gAuthorElement)
    {
      window.close();
      return;
    }
    gInsertNewAuthor = true;
  }

  gDescriptionElement = GetMetaElement("description");
  if (!gDescriptionElement)
  {
    gDescriptionElement = CreateMetaElement("description");
    if (!gDescriptionElement)
      window.close();

    gInsertNewDescription = true;
  }

  gRootElement = GetCurrentEditor().rootElement;

  InitDialog();

  SetTextboxFocus(gDialog.TitleInput);

  gInitDone = true;

  SetWindowLocation();
}

function InitDialog()
{
  gDialog.TitleInput.value = GetDocumentTitle();

  var gAuthor = TrimString(gAuthorElement.getAttribute("content"));
  if (!gAuthor)
  {
    // Fill in with value from editor prefs
    var prefs = GetPrefs();
    if (prefs) 
      gAuthor = prefs.getCharPref("editor.author");
  }
  gDialog.AuthorInput.value = gAuthor;
  gDialog.DescriptionInput.value = gDescriptionElement.getAttribute("content");

  if (CurrentDocumentIsTemplateRef())
  {
    gDialog.isTemplate.setAttribute("hidden", "true"); 
  }
  else
  {
    gDialog.isFromTemplate.setAttribute("hidden", "true");
    gDialog.isTemplate.checked = CurrentDocumentIsTemplate();
  }

  if (gRootElement.hasAttribute("dir"))
  {
    gDialog.useCustomDirection.value = gRootElement.getAttribute("dir");
  }
  var cssDirection = gRootElement.style.getPropertyValue("direction");
  if (cssDirection)
  {
    gDialog.useCustomDirection.value = cssDirection;
  }
  if (gRootElement.parentNode.hasAttribute("dir"))
  {
    gDialog.useCustomDirection.value = gRootElement.parentNode.getAttribute("dir");
  }
  var cssDirection = gRootElement.parentNode.style.getPropertyValue("direction");
  if (cssDirection)
  {
    gDialog.useCustomDirection.value = cssDirection;
  }

  if (gRootElement.parentNode.hasAttribute("lang"))
  {
    gDialog.active_languages.value = gRootElement.parentNode.getAttribute("lang");
  }

  gCharset = GetCurrentEditor().documentCharacterSet;
  gDialog.active_charset.value = gCharset;
}

function TextboxChanged(ID)
{
  switch(ID)
  {
    case "TitleInput":
      gTitleWasEdited = true;
      break;
    case "AuthorInput":
      gAuthorWasEdited = true;
      break;
    case "DescriptionInput":
      gDescWasEdited = true;
      break;
  }
}

function ValidateData()
{
  gNewTitle = TrimString(gDialog.TitleInput.value);
  gAuthor = TrimString(gDialog.AuthorInput.value);
  gDescription = TrimString(gDialog.DescriptionInput.value);
  gTemplateState = gDialog.isTemplate.checked;
  gLanguage = gDialog.active_languages.value;
  gDirection = gDialog.useCustomDirection.value;
  return true;
}

function onAccept()
{
  if (ValidateData())
  {
    var editor = GetCurrentEditor();
    editor.beginTransaction();

    // Set title contents even if string is empty
    //  because TITLE is a required HTML element
    if (gTitleWasEdited)
      SetDocumentTitle(gNewTitle);
    
    if (gAuthorWasEdited)
      SetMetaElementContent(gAuthorElement, gAuthor, gInsertNewAuthor, false);

    if (gDescWasEdited)
      SetMetaElementContent(gDescriptionElement, gDescription, gInsertNewDescription, false);

    var isTemplate = CurrentDocumentIsTemplate();
    if (gTemplateState && !isTemplate)
    {
      MakeDocumentBecomeATemplate();
    }
    else if (!gTemplateState && isTemplate)
    {
      MakeTemplateBecomeANormalDocument();
    }

    gRootElement.removeAttribute("lang");
    gRootElement.parentNode.removeAttribute("lang");
    if (gLanguage)
      gRootElement.parentNode.setAttribute("lang", gLanguage);

    gRootElement.removeAttribute("dir");
    gRootElement.parentNode.removeAttribute("dir");
    if (gDirection && gDirection != "none")
      editor.setAttributeOrEquivalent(gRootElement.parentNode, "dir", gDirection, false);

    editor.documentCharacterSet = gCharset;

    editor.endTransaction();

    SaveWindowLocation();
    return true; // do close the window
  }
  return false;
}

function ChooseLanguage()
{
  window.openDialog("chrome://communicator/content/pref/pref-languages-add.xul","_blank","modal,chrome,centerscreen,titlebar", "addlangwindow");
}

function ChooseCharset()
{
  window.openDialog("chrome://communicator/content/pref/pref-charset-add.xul","_blank","modal,chrome,centerscreen,titlebar", gCharset);
}

function SelectCharset(charset)
{
  gDialog.active_charset.value = charset;
  gCharset = charset;
}
