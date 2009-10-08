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
 * Contributor(s):
 *   Vivien Nicolas <21@vingtetun.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

const Cc = Components.classes;
const Ci = Components.interfaces;
const PHP_CONV_CID = Components.ID("{aa33d030-4e80-4ae3-88b0-6139142c9691}");

const nsBinaryInputStream = Components.Constructor(
                              "@mozilla.org/binaryinputstream;1",
                              "nsIBinaryInputStream", "setInputStream");

const nsConverter = Components.Constructor(
                              "@mozilla.org/intl/scriptableunicodeconverter",
                              "nsIScriptableUnicodeConverter");

/*
 * This component is required on GNU/Linux to open local PHP files in Composer.
 *
 * By default, Composer will refuse to open PHP files because they don't have a text/html MIME type;
 * so let's use a stream I/O to 'convert' an application/x-php MIME type to a text/html one.
 *
 * This component could also be used for text/html files to get rid of the awful
 * hack that is applied to mozilla/content in order to display PHP and comment
 * nodes in the main edition window.
 *
 * Besides, we could use this to edit text/plain files with pseudo syntax highlighting
 * directly in an HTML editor tab.
 * Adding ["text/plain", "*"] to the MIME table works on some Linux distros:
 * e.g. it works on Ubuntu Jaunty but not on Ubuntu Hardy.
 * Last but not least, I'm not sure it would work on Windows and MacOS X.
 * To be tested.
 */

function phpStreamConverter() {
  var _listener = null;
  var _data = "";
  var _path = "";

  this.asyncConvertData = function(aFromType, aToType, aListener, aCtx) {
    _listener = aListener;
  };
  
  this.convert = function (aFromStream, aFromType, aToType, aCtx) {
    return aFromStream;
  };

  this.onStartRequest = function (aRequest, aCtx) {
    var channel = aRequest.QueryInterface(Ci.nsIChannel);

    // Hack the content type under which the document is seen by Composer
    // XXX is there a way to know its charset right now?
    channel.contentType = "text/html";
    _path = channel.URI.path;

    _listener.onStartRequest(channel, aCtx);
  };

  this.onDataAvailable = function (aRequest, aCtx, aInputStream, aOffset, aCount) {
    var binaryInputStream = new nsBinaryInputStream(aInputStream);
    _data += binaryInputStream.readBytes(binaryInputStream.available());
  };
  
  this.onStopRequest = function (aRequest, aCtx, aStatusCode) {
    var hasBodyNode = _data.match(/<html/i) && _data.match(/<head/i) && _data.match(/<body/i);

    /* don't open this file with Composer if no <html|head|body> nodes are found
    if (!hasBodyNode) {
      dump ("no <body> node, exiting\n");
      _data = null;
      var channel = aRequest.QueryInterface(Ci.nsIChannel);
      var stream = converter.convertToInputStream(_data);
      _listener.onDataAvailable(channel, aCtx, stream, 0, stream.available());
      _listener.onStopRequest(channel, aCtx, aStatusCode);
      throw Components.results.NS_ERROR_INVALID_ARG;
      return;
    } */

    // get the current stream charset
    // XXX ugly hack, there *has* to be another way!
    var charset = "UTF-8";
    var tmp = _data.match(/charset=([^"\s]*)/i);
    if (tmp && tmp.length > 1)
      charset = tmp[1];
    else try { // no charset found, get the default one (user pref)
      const nsPrefService = Components.interfaces.nsIPrefService;
      const nsStringPref = Components.interfaces.nsISupportsString;
      charset = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(nsPrefService)
                          .getBranch(null)
                          .getComplexValue("editor.custom_charset", nsStringPref)
                          .data;
    } catch(e) {}

    // apply the proper character set
    var converter = new nsConverter();
    converter.charset = charset;
    _data = converter.ConvertToUnicode(_data);

    // Do whatever you want with _data!
    // this is also where we could get rid of the awful hack in mozilla/content
    // to display comment/php nodes in the main window

    if (hasBodyNode) { // this document should be editable in Composer
      // quick hack to support short tags in PHP files
      _data = _data.replace(/<%/g, "<?php").replace(/%>/g, "?>");
      // TODO: check PHP prologs
    }
    else {             // this document is not editable in Composer
      // experimental, ugly hack: embed '_data' in an HTML document
      var fileName = _path.substring(_path.lastIndexOf("/") + 1, _path.length);
      _data = _data.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // TODO: syntax highlighting
      _data = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'
            + '<html xmlns="http://www.w3.org/1999/xhtml">\n'
            + '<head>\n'
            + '  <meta http-equiv="content-type" content="text/html; charset="' + charset + '" />\n'
            + '  <meta id="_moz_text_document" />\n'
            + '  <title>' + fileName + '</title>\n'
            + '</head>\n'
            + '<body>\n'
            + '  <pre>' + _data + '</pre>\n'
            + '</body>\n'
            + '</html>';
    }

    // Serialise the result back into Composer
    var channel = aRequest.QueryInterface(Ci.nsIChannel);
    var stream = converter.convertToInputStream(_data);
    _listener.onDataAvailable(channel, aCtx, stream, 0, stream.available());
    _listener.onStopRequest(channel, aCtx, aStatusCode);
  };
};

var phpStreamConverterFactory = {
  createInstance: function (aOuter, iid) {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;

    if (iid.equals(Ci.nsISupports) ||
        iid.equals(Ci.nsIStreamConverter) ||
        iid.equals(Ci.nsIStreamListener) ||
        iid.equals(Ci.nsIRequestObserver))
      return new phpStreamConverter();

    throw Components.results.NS_ERROR_INVALID_ARG;
  }
};

var phpReaderModule = {
  registerSelf: function (aComponentManager, aFileSpec, aLocation, aType) {
    aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);

    // Add the handle types here if needed
    const PHP_TYPES = [
      [ "application/x-php",        "php"  ],
      [ "application/x-httpd-php",  "php"  ],
      [ "application/x-httpd-php3", "php3" ],
      [ "application/x-httpd-php4", "php4" ],
    ];

    var catman = Cc["@mozilla.org/categorymanager;1"]
                 .getService(Ci.nsICategoryManager);

    // Add the PHP type to the category manager
    for (var i in PHP_TYPES) {
      var [type, ext] = PHP_TYPES[i];
      var conversion  = '?from=' + type + '&to=*/*';

      catman.deleteCategoryEntry("ext-to-type-mapping", ext, true);
      catman.addCategoryEntry("ext-to-type-mapping", ext, aType, false, true);

      catman.deleteCategoryEntry("@mozilla.org/streamconv;1", conversion,
                                 true);
      catman.addCategoryEntry("@mozilla.org/streamconv;1", 
                              conversion, ext + " to HTML stream converter",
                              false, true);

      aComponentManager.registerFactoryLocation(
        PHP_CONV_CID,
        "PHP Stream Converter",
        "@mozilla.org/streamconv;1" + conversion,
        aFileSpec,
        aLocation,
        aType);
    }
  },

  unregisterSelf: function (aComponentManager, aFileSpec, aLocation) {
  },

  getClassObject: function (aComponentManager, cid, iid) {
    if (cid.equals(PHP_CONV_CID))
      return phpStreamConverterFactory;

    if (!iid.equals(Ci.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function (aComponentManager) {
    return true;
  }
};

/* entry point */
function NSGetModule (aComponentManager, aFileSpec) {
  return phpReaderModule;
};

