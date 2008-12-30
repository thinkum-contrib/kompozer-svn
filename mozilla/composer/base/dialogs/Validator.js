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

var gBrowserStatusHandler;
const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
const nsIWebProgress = Components.interfaces.nsIWebProgress;
const nsIWebNavigation = Components.interfaces.nsIWebNavigation;

function nsBrowserStatusHandler(elt, callerURL)
{
  this.init(elt, callerURL);
}

nsBrowserStatusHandler.prototype = 
{
  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
    {
      return this;
    }
    throw Components.results.NS_NOINTERFACE;
  },

  init : function(elt, url)
  {
    this.browser = elt;
    this.url = url;
  },

  destroy : function()
  {
    this.browser = null;
    this.url = null;
  },

  onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
  {
    if (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK &&
        aStateFlags & nsIWebProgressListener.STATE_STOP)
      {
        var doc = this.browser.contentDocument;
        var fileUploadField = doc.getElementById("uploaded_file");
        fileUploadField.value = this.url;

        var gPrefs = GetPrefs();

        // subtile hack to be able to load inline the HTML validator
        // **and** show all other http requests in external browser
        gPrefs.setBoolPref("network.protocol-handler.expose-all", true);
        doc.forms[0].submit();
        gPrefs.setBoolPref("network.protocol-handler.expose-all", false);

        aWebProgress.removeProgressListener(this, nsIWebProgress.NOTIFY_STATE_NETWORK);
      }
  },

  onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
  {
  },

  onLocationChange : function(aWebProgress, aRequest, aLocation)
  {
  },

  onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage)
  {
  },

  onSecurityChange : function(aWebProgress, aRequest, aState)
  {
  }
}

function StartUp()
{
  var isLocalFile = false;
  if ("arguments" in window && window.arguments.length >= 2)
    isLocalFile = window.arguments[1];

  var URL2Validate = window.arguments[0];

  gDialog.validatorBrowser = document.getElementById("validatorBrowser");

  SetWindowLocation();

  var applyButton = document.documentElement.getButton("extra1");
  if (isLocalFile)
  {
    applyButton.setAttribute("hidden", true);
    try {
      gBrowserStatusHandler = new nsBrowserStatusHandler(gDialog.validatorBrowser, URL2Validate);
      var interfaceRequestor = gDialog.validatorBrowser.docShell.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
      var webProgress = interfaceRequestor.getInterface(nsIWebProgress);
      webProgress.addProgressListener(gBrowserStatusHandler, nsIWebProgress.NOTIFY_STATE_NETWORK);
    }
    catch (e)
    {
      alert("Error opening a mini-nav window"); 
      dump(e+"\n");
      window.close();
      return;
    }
    //gDialog.validatorBrowser.loadURI("http://validator.w3.org/file-upload.html");
    gDialog.validatorBrowser.loadURI("http://validator.w3.org/#validate_by_upload"); // Kaze
  }
  else
  {
    // turn on extra1 to be "Revalidate"
    if (applyButton)
    {
      applyButton.label = GetString("Revalidate");
      applyButton.setAttribute("accesskey", GetString("RevalidateAccessKey"));
    }

    var publishData = CreatePublishDataFromUrl(URL2Validate);
    if (!publishData || publishData.notInSiteData)
      var url = URL2Validate;
    else
      url = publishData.browseUrl + publishData.docDir + publishData.filename;

    var validatorURL = "http://validator.w3.org/check?uri=" + url + "&doctype=Inline";

    gDialog.validatorBrowser.loadURI(validatorURL);
  }
}

function onClose()
{
  SaveWindowLocation();
  return true;
}

function Revalidate()
{
  gDialog.validatorBrowser.reloadWithFlags(nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
}
