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
 * The Original Code is Mozilla.org
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
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

var _elementIDs = ["networkProxyType",
                    "networkProxyFTP", "networkProxyFTP_Port",
                    "networkProxyGopher", "networkProxyGopher_Port",
                    "networkProxyHTTP", "networkProxyHTTP_Port", 
                    "networkProxySOCKS", "networkProxySOCKS_Port",
                    "networkProxySOCKSVersion",
                    "networkProxySSL", "networkProxySSL_Port", 
                    "networkProxyNone", "networkProxyAutoconfigURL"];

var gPrefs = null;

function SetUnicharPref(aPrefName, aPrefValue)
{
  if (gPrefs)
  {
    try {
      var str = Components.classes["@mozilla.org/supports-string;1"]
                          .createInstance(Components.interfaces.nsISupportsString);
      str.data = aPrefValue;
      gPrefs.setComplexValue(aPrefName, Components.interfaces.nsISupportsString, str);
    }
    catch(e) {}
  }
}

function GetUnicharPref(aPrefName)
{
  if (gPrefs)
  {
    try {
      return gPrefs.getComplexValue(aPrefName, Components.interfaces.nsISupportsString).data;
    }
    catch(e) {}
  }
  return "";
}

function init()
{
  gPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

  // initialize the default window values...
  for( var i = 0; i < _elementIDs.length; i++ )
  {        
    var elementID = _elementIDs[i];
    var element = document.getElementById(elementID);
    if (!element) break;
    var eltType = element.localName;
    var preftype = element.getAttribute("preftype");
    if (eltType == "radiogroup")
      element.selectedItem = element.getElementsByAttribute('value', gPrefs.getIntPref(element.getAttribute("prefstring")))[0];
    else if (eltType == "checkbox")
      element.checked = gPrefs.getBoolPref(element.getAttribute("prefstring"));
    else if (eltType == "textbox")
    {
      if (preftype == "int")
        element.value = gPrefs.getIntPref(element.getAttribute("prefstring")) ;
      else if (preftype == "string")
        element.value = GetUnicharPref(element.getAttribute("prefstring")) ;
    }
  }
}

function enableField(aCheckbox, aNodeID) 
{ 
   var aField = document.getElementById(aNodeID); 
   if (aCheckbox.checked) 
     aField.removeAttribute("disabled"); 
   else 
     aField.setAttribute("disabled", "true"); 
} 

function savePrefs()
{
  for( var i = 0; i < _elementIDs.length; i++ )
  {
    var elementID = _elementIDs[i];

    var element = document.getElementById(elementID);
    if (!element) break;
    var eltType = element.localName;
    var preftype = element.getAttribute("preftype");

    if (eltType == "radiogroup")
      gPrefs.setIntPref(element.getAttribute("prefstring"), parseInt(element.value));
    else if (eltType == "checkbox")
      gPrefs.setBoolPref(element.getAttribute("prefstring"), element.checked);
    else if (eltType == "textbox")
    {
      if (preftype == "int")
        gPrefs.setIntPref(element.getAttribute("prefstring"), parseInt(element.value) );
      else if (preftype == "string")
        SetUnicharPref(element.getAttribute("prefstring"), element.value );
    }
  }
}

function Startup()
{
  init();
  DoEnabling();
}

function DoEnabling()
{
  var i;
  var ftp = document.getElementById("networkProxyFTP");
  var ftpPort = document.getElementById("networkProxyFTP_Port");
  var gopher = document.getElementById("networkProxyGopher");
  var gopherPort = document.getElementById("networkProxyGopher_Port");
  var http = document.getElementById("networkProxyHTTP");
  var httpPort = document.getElementById("networkProxyHTTP_Port");
  var socks = document.getElementById("networkProxySOCKS");
  var socksPort = document.getElementById("networkProxySOCKS_Port");
  var socksVersion = document.getElementById("networkProxySOCKSVersion");
  var socksVersion4 = document.getElementById("networkProxySOCKSVersion4");
  var socksVersion5 = document.getElementById("networkProxySOCKSVersion5");
  var ssl = document.getElementById("networkProxySSL");
  var sslPort = document.getElementById("networkProxySSL_Port");
  var noProxy = document.getElementById("networkProxyNone");
  var autoURL = document.getElementById("networkProxyAutoconfigURL");
  var autoReload = document.getElementById("autoReload");

  // convenience arrays
  var manual = [ftp, ftpPort, gopher, gopherPort, http, httpPort, socks, socksPort, socksVersion, socksVersion4, socksVersion5, ssl, sslPort, noProxy];
  var auto = [autoURL, autoReload];

  // radio buttons
  var radiogroup = document.getElementById("networkProxyType");

  switch ( radiogroup.value ) {
    case "0":
      for (i = 0; i < manual.length; i++)
        manual[i].setAttribute( "disabled", "true" );
      for (i = 0; i < auto.length; i++)
        auto[i].setAttribute( "disabled", "true" );
      break;
    case "1":
      for (i = 0; i < auto.length; i++)
        auto[i].setAttribute( "disabled", "true" );
      if (!radiogroup.disabled)
        for (i = 0; i < manual.length; i++)
          manual[i].removeAttribute( "disabled" );
      break;
    case "2":
    default:
      for (i = 0; i < manual.length; i++)
        manual[i].setAttribute( "disabled", "true" );
      if (!radiogroup.disabled)
        for (i = 0; i < auto.length; i++)
          auto[i].removeAttribute( "disabled" );
      break;
  }
}

const nsIProtocolProxyService = Components.interfaces.nsIProtocolProxyService;
const kPROTPROX_CID = '{e9b301c0-e0e4-11D3-a1a8-0050041caf44}';

function ReloadPAC() 
{
  var autoURL = document.getElementById("networkProxyAutoconfigURL");
  var pps = Components.classesByID[kPROTPROX_CID]
                       .getService(nsIProtocolProxyService);
  pps.configureFromPAC(autoURL.value);
}   

