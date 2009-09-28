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
 * The Original Code is FireFTP.
 *
 * Contributor(s):
 *   Mime Cuvalo <mimecuvalo@gmail.com>
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

// Note: this 'ftpMozilla' class is taken from FireFTP 0.97.3

function ftpMozilla(observer) {
  this.transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
  this.proxyService     = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService  (Components.interfaces.nsIProtocolProxyService);
  this.cacheService     = Components.classes["@mozilla.org/network/cache-service;1"].getService           (Components.interfaces.nsICacheService);
  this.toUTF8           = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService       (Components.interfaces.nsIUTF8ConverterService);
  this.fromUTF8         = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService   (Components.interfaces.nsIScriptableUnicodeConverter);
  this.observer         = observer;

  var self = this;
  var func = function() { self.keepAlive(); };
  setTimeout(func, 60000);
}

ftpMozilla.prototype = {
  // begin: variables you can set
  host                 : "",
  port                 : 21,
  security             : "",
  login                : "",
  password             : "",
  passiveMode          : true,
  initialPath          : "",             // path we go to first onload
  encoding             : "UTF-8",

  asciiFiles           : new Array(),    // set to the list of extensions we treat as ASCII files when transfering
  fileMode             : 0,              // 0 == auto, 1 == binary, 2 == ASCII
  hiddenMode           : false,          // show hidden files if true
  ipType               : "IPv4",         // right now, either IPv4 or IPv6
  keepAliveMode        : true,           // keep the connection alive with NOOP's
  networkTimeout       : 30,             // how many seconds b/f we consider the connection to be stale and dead
  proxyHost            : "",
  proxyPort            : 0,
  proxyType            : "",
  activePortMode       : false,          // in active mode, if you want to specify a range of ports
  activeLow            : 1,              // low  port
  activeHigh           : 65535,          // high port
  reconnectAttempts    : 40,             // how many times we should try reconnecting
  reconnectInterval    : 10,             // number of seconds in b/w reconnect attempts
  reconnectMode        : true,           // true if we want to attempt reconnecting
  sessionsMode         : true,           // true if we're caching directory data
  timestampsMode       : false,          // true if we try to keep timestamps in sync

  debug                : function() { }, // set to function that will do something with exception messages
  error                : function() { }, // set to function that will deal with errors
  appendLog            : function() { }, // set to function that will deal with log

  errorConnectStr      : "Unable to make a connection.  Please try again.", // set to error msg that you'd like to show for a connection error
  errorXCheckFail      : "The transfer of this file was unsuccessful and resulted in a corrupted file. It is recommended to restart this transfer.",  // an integrity check failure
  passNotShown         : "(password not shown)",                            // set to text you'd like to show in place of password
  // end: variables you can set

  // variables used internally
  isConnected          : false,          // are we connected?
  isReady              : false,          // are we busy writing/reading the control socket?
  isReconnecting       : false,          // are we attempting a reconnect?
  legitClose           : true,           // are we the ones initiating the close or is it a network error
  reconnectsLeft       : 0,              // how many times more to try reconnecting
  networkTimeoutID     : 0,              // a counter increasing with each read and write
  transferID           : 0,              // a counter increasing with each transfer

  controlTransport     : null,
  controlInstream      : null,
  controlOutstream     : null,

  eventQueue           : new Array(),    // commands to be sent
  trashQueue           : new Array(),    // once commands are read, throw them away here b/c we might have to recycle these if there is an error
  doingCmdBatch        : false,

  dataSocket           : null,
  activeCurrentPort    : -1,             // if user specified a range of ports, this is the current port we're using

  listData             : new Array,      // holds data directory data from the LIST command
  featMLSD             : false,          // is the MLSD command available?
  featMDTM             : false,          // is the MDTM command available?
  featXCheck           : null,           // are the XMD5 or XSHA1 commands available?

  welcomeMessage       : "",             // hello world
  fullBuffer           : "",             // full response of control socket
  connectedHost        : "",             // name of the host we connect to plus username
  protPSuccess         : false,          // if we were successful in handshaking a secure connection
  localRefreshLater    : '',
  remoteRefreshLater   : '',
  waitToRefresh        : false,
  transferMode         : "",             // either "A" or "I"
  currentWorkingDir    : "",             // directory that we're currently, uh, working with
  version              : "0.97.3",  // version of this class - used to avoid collisions in cache
  remoteMonths         : "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",         // used in parsing months from list data
  l10nMonths           : new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"), // used in display localized months

  connect : function(reconnect) {
    if (!reconnect) {                                                            // this is not a reconnection attempt
      this.isReconnecting = false;
      this.reconnectsLeft = parseInt(this.reconnectAttempts);

      if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
        this.reconnectsLeft = 1;
      }
    }

    if (!this.eventQueue.length || this.eventQueue[0].cmd != "welcome") {
      this.unshiftEventQueue("welcome", "", "");                                 // wait for welcome message first
    }

    ++this.networkTimeoutID;                                                     // just in case we have timeouts from previous connection
    ++this.transferID;

    try {                                                                        // create a control socket
      var proxyInfo = null;

      if (this.proxyType != "") {                                                // use a proxy
        proxyInfo = this.proxyService.newProxyInfo(this.proxyType, this.proxyHost, this.proxyPort, 0, 30, null);
      }

      if (this.security == "ssl") {                                              // thanks to Scott Bentley. he's a good man, Jeffrey. and thorough.
        this.controlTransport = this.transportService.createTransport(["ssl"],      1, this.host, parseInt(this.port), proxyInfo);
      } else if (!this.security) {
        this.controlTransport = this.transportService.createTransport(null,         0, this.host, parseInt(this.port), proxyInfo);
      } else {
        this.controlTransport = this.transportService.createTransport(["starttls"], 1, this.host, parseInt(this.port), proxyInfo);
      }

      this.controlOutstream = this.controlTransport.openOutputStream(0, 0, 0);
      var controlStream     = this.controlTransport.openInputStream(0, 0, 0);
      this.controlInstream  = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
      this.controlInstream.init(controlStream);

      var self = this;
      var dataListener = {                                                       // async data listener for the control socket
        data            : "",

        onStartRequest  : function(request, context) { },

        onStopRequest   : function(request, context, status) {
          if (!self.isConnected) {                                               // no route to host
            self.appendLog(self.errorConnectStr, 'error', "error");
          }

          self.isConnected = false;

          if (self.dataSocket) {
            self.dataSocket.kill();
          }

          if (self.observer) {
            self.observer.onDisconnected();
            self.observer.onIsReadyChange(true);
          }

          if (!self.legitClose && self.reconnectMode) {                          // try reconnecting
            self.transferMode         = "";

            if (self.reconnectsLeft < 1) {
              self.isReconnecting = false;
              if (self.eventQueue.length && self.eventQueue[0].cmd == "welcome") {
                self.eventQueue.shift();
              }
            } else {
              self.isReconnecting       = true;

              if (self.observer) {
                self.observer.onReconnecting();
              }

              var func = function() { self.reconnect(); };
              setTimeout(func, self.reconnectInterval * 1000);
            }
          } else {
            self.cleanup();
          }
        },

        onDataAvailable : function(request, context, inputStream, offset, count) {
          this.data = self.controlInstream.read(count);                          // read data
          self.readControl(this.data);
        }
      };

      var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
      pump.init(controlStream, -1, -1, 0, 0, false);
      pump.asyncRead(dataListener,null);

    } catch(ex) {
      this.debug(ex);
      this.error(this.errorConnectStr);
      this.cleanup();

      if (this.observer) {
        this.observer.onDisconnected();
      }

      return;
    }
  },

  reconnect : function()  {                                                      // ahhhh! our precious connection has been lost,
    if (!this.isReconnecting) {                                                  // must...get it...back...our...precious
      return;
    }

    --this.reconnectsLeft;

    this.connect(true);
  },

  disconnect : function() {
    this.legitClose = true;                                                      // this close() is ok, don't try to reconnect
    this.cleanup();

    if (!(!this.isConnected && this.eventQueue.length && this.eventQueue[0].cmd == "welcome")) {
      this.unshiftEventQueue("goodbye", "", "");
      this.writeControl("QUIT");
    }

    if (this.dataSocket) {
      this.dataSocket.kill();
    }

    this.kill();
  },

  cleanup : function(isAbort) {
    this.eventQueue         = new Array();
    this.trashQueue         = new Array();
    this.transferMode       = "";
    this.currentWorkingDir  = "";
    this.localRefreshLater  = "";
    this.remoteRefreshLater = "";
    this.waitToRefresh      = false;

    if (!isAbort) {
      this.featMLSD         = false;
      this.featMDTM         = false;
      this.featXCheck       = null;
    }

    ++this.networkTimeoutID;
    ++this.transferID;
  },

  kill : function() {
    try {
      this.controlInstream.close();
    } catch(ex) {
      this.debug(ex);
    }

    try {
      this.controlOutstream.close();
    } catch(ex) {
      this.debug(ex);
    }
  },

  abort : function() {
    this.isReconnecting     = false;

    if (this.dataSocket) {
      this.dataSocket.progressEventSink.bytesTotal = 0;                          // stop uploads
      this.dataSocket.dataListener.bytesTotal      = 0;                          // stop downloads
    }

    this.cleanup(true);

    if (!this.isConnected) {
      return;
    }

    //XXX this.writeControl("ABOR");                                             // ABOR does not seem to stop the connection in most cases
    if (this.dataSocket) {                                                       // so this is a more direct approach
      this.dataSocket.kill();
    }

    this.addEventQueue("aborted");

    if (this.observer) {
      this.observer.onAbort();
    }
  },

  checkTimeout : function(id, cmd) {
    if (this.isConnected && this.networkTimeoutID == id && this.eventQueue.length && this.eventQueue[0].cmd.indexOf(cmd) != -1) {
      this.resetConnection();
    }
  },

  checkDataTimeout : function(download, id, bytes) {
    if (this.isConnected && this.transferID == id && this.dataSocket) {
      if ((download && bytes == this.dataSocket.dataListener.bytesDownloaded)
      || (!download && bytes == this.dataSocket.progressEventSink.bytesUploaded)) {
        this.resetConnection();
        return;
      }

      var self      = this;
      var nextBytes = download ? self.dataSocket.dataListener.bytesDownloaded : self.dataSocket.progressEventSink.bytesUploaded;
      var func = function() { self.checkDataTimeout(download, id, nextBytes); };
      setTimeout(func, this.networkTimeout * 1000);
    }
  },

  resetConnection : function() {
    this.legitClose = false;                                                   // still stuck on a command so
    this.unshiftEventQueue("goodbye", "", "");                                 // try to restart the connection the hard way
    this.writeControl("QUIT");

    if (this.dataSocket) {
      this.dataSocket.kill();
    }

    this.kill();
  },

  keepAlive : function() {
    if (this.isConnected && this.keepAliveMode && this.eventQueue.length == 0) {
      this.addEventQueue("NOOP");
      this.writeControl();
    }

    var self = this;
    var func = function() { self.keepAlive(); };
    setTimeout(func, 60000);
  },

  addEventQueue : function(cmd, parameter, callback, callback2) {                // this just creates a new queue item
    this.eventQueue.push(   { cmd: cmd, parameter: parameter || '', callback: callback || '', callback2: callback2 || '' });
  },

  unshiftEventQueue : function(cmd, parameter, callback) {                       // ditto
    this.eventQueue.unshift({ cmd: cmd, parameter: parameter || '', callback: callback || '' });
  },

  beginCmdBatch : function() {
    this.doingCmdBatch = true;
  },

  writeControlWrapper : function() {
    if (!this.doingCmdBatch) {
      this.writeControl();
    }
  },

  endCmdBatch : function() {
    this.doingCmdBatch = false;
    this.writeControl();
  },

  writeControl : function(cmd) {
    try {
      if (!this.isReady || (!cmd && !this.eventQueue.length)) {
        return;
      }

      var parameter;
      var callback;

      if (!cmd) {
        cmd       = this.eventQueue[0].cmd;
        parameter = this.eventQueue[0].parameter;
        callback  = this.eventQueue[0].callback;
      }

      while (cmd == "aborted" || cmd == "goodbye"                                // these are sort of dummy values
         || (cmd == "TYPE" && this.transferMode      == parameter)               // or if we ignore TYPE if it's unnecessary
         || (cmd == "CWD"  && this.currentWorkingDir == parameter)) {            // or if we ignore CWD if it's unnecessary

        if ((cmd == "TYPE" && this.transferMode      == parameter)
         || (cmd == "CWD"  && this.currentWorkingDir == parameter)) {
          this.trashQueue.push(this.eventQueue[0]);
        }

        this.eventQueue.shift();

        if (this.eventQueue.length) {
          cmd       = this.eventQueue[0].cmd;
          parameter = this.eventQueue[0].parameter;
          callback  = this.eventQueue[0].callback;
        } else {
          return;
        }
      }

      this.isReady          = false;

      if (this.observer) {
        this.observer.onIsReadyChange(false);
      }

      if (!this.passiveMode && cmd == "PASV") {                                  // active mode
        cmd                    = this.ipType == "IPv4" ? "PORT" : "EPRT";
        var security           = this.security && this.protPSuccess;
        var proxy              = { proxyType: this.proxyType, proxyHost: this.proxyHost, proxyPort: this.proxyPort };
        var currentPort        = this.activeCurrentPort == -1 ? this.activeLow : this.activeCurrentPort + 2;
        if (currentPort < this.activeLow || currentPort > this.activeHigh) {
          currentPort = this.activeLow;
        }
        this.activeCurrentPort = currentPort;
        this.dataSocket        = new ftpDataSocketMozilla(security, proxy, "", this.activePortMode ? currentPort : -1);
        this.dataSocket.debug  = this.debug;
        this.dataSocket.error  = this.error;

        var activeInfo         = {};
        activeInfo.cmd         = this.eventQueue[1].cmd;
        activeInfo.ipType      = this.ipType;

        if (this.eventQueue[1].cmd        == "RETR") {
          activeInfo.localPath    = this.eventQueue[1].callback;
          activeInfo.totalBytes   = callback;
        } else if (this.eventQueue[1].cmd == "REST") {
          activeInfo.localPath    = this.eventQueue[2].callback;
          activeInfo.totalBytes   = callback;
          activeInfo.partialBytes = this.eventQueue[1].parameter;
        } else if (this.eventQueue[1].cmd == "STOR") {
          activeInfo.localPath    = this.eventQueue[1].callback;
        } else if (this.eventQueue[1].cmd == "APPE") {
          activeInfo.localPath    = this.eventQueue[1].callback.localPath;
          activeInfo.partialBytes = this.eventQueue[1].callback.remoteSize;
        }

        parameter = this.dataSocket.createServerSocket(activeInfo);
      }

      if (cmd == "PASV" && this.passiveMode && this.ipType != "IPv4") {
        cmd = "EPSV";
      }

      if (cmd == "LIST") {                                                       // don't include path in list command - breaks too many things
        parameter = this.hiddenMode && !this.featMLSD ? "-al" : "";

        if (this.featMLSD) {
          cmd = "MLSD";
        }
      }

      var outputData = cmd + (parameter ? (' ' + parameter) : '') + "\r\n";      // le original bug fix! - thanks to devin

      try {
        outputData   = this.fromUTF8.ConvertFromUnicode(outputData) + this.fromUTF8.Finish();
      } catch (ex) {
        this.debug(ex);
      }

      this.controlOutstream.write(outputData, outputData.length);                // write!

      ++this.networkTimeoutID;                                                   // this checks for timeout
      var self           = this;
      var currentTimeout = this.networkTimeoutID;
      var func           = function() { self.checkTimeout(currentTimeout, cmd); };
      setTimeout(func, this.networkTimeout * 1000);

      if (cmd == "RETR" || cmd == "STOR" || cmd == "APPE") {
        ++this.transferID;
        var currentId    = this.transferID;
        var func         = function() { self.checkDataTimeout(cmd == "RETR", currentId, 0); };
        setTimeout(func, this.networkTimeout * 1000);
      }

      outputData = cmd + (parameter ? (' ' + parameter) : '');                   // write it out to the log

      if (cmd != "PASS") {
        this.appendLog("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"      + outputData,                           'output', "info");
      } else {
        this.appendLog("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PASS " + this.passNotShown, 'output', "info");
      }

    } catch(ex) {
      this.debug(ex);
      this.error(this.errorConnectStr);
    }
  },

  readControl : function(buffer) {
    try {
      //buffer = this.toUTF8.convertStringToUTF8(buffer, this.encoding, 1);
      var tmp = this.toUTF8.convertStringToUTF8(buffer, this.encoding, 1);
      buffer = tmp;
    } catch (ex) {
      this.debug(ex); 
    }

    if ((buffer == "2" && !this.isConnected) || buffer == "\r\n" || buffer == "\n") {
      return;
    }

    var lastLineOfBuffer = buffer.indexOf("\r\n") != -1 ? buffer.split("\r\n") : buffer.split("\n");
    lastLineOfBuffer     = lastLineOfBuffer.filter(this.removeBlanks);

    if (buffer != "2") {                                                         // "2"s are self-generated fake messages
      for (var x = 0; x < lastLineOfBuffer.length; ++x) {                        // add response to log
        var message   = lastLineOfBuffer[x].charAt(lastLineOfBuffer[x].length - 1) == '\r'
                      ? lastLineOfBuffer[x].substring(0, lastLineOfBuffer[x].length - 1) : lastLineOfBuffer[x];
        var errorBlah = lastLineOfBuffer[x].charAt(0) == '4' || lastLineOfBuffer[x].charAt(0) == '5';
        if (!errorBlah) {
          this.appendLog(message, 'input', "info");
        }
      }

      ++this.networkTimeoutID;
    }

    lastLineOfBuffer = lastLineOfBuffer[lastLineOfBuffer.length - 1];            // we are only interested in what the last line says
    var returnCode;

    if ((lastLineOfBuffer.length > 3 && lastLineOfBuffer.charAt(3) == '-') || lastLineOfBuffer.charAt(0) == ' ') {
      if (this.eventQueue[0].cmd == "USER" || this.eventQueue[0].cmd == "PASS") {
        this.welcomeMessage += buffer;                                           // see if the message is finished or not
      }

      this.fullBuffer += buffer;

      return;
    } else {
      buffer          = this.fullBuffer + buffer;
      this.fullBuffer = '';
      returnCode = parseInt(lastLineOfBuffer.charAt(0));                         // looks at first number of number code
    }

    var cmd;  var parameter;    var callback;   var callback2;

    if (this.eventQueue.length) {
      cmd        = this.eventQueue[0].cmd;
      parameter  = this.eventQueue[0].parameter;
      callback   = this.eventQueue[0].callback;
      callback2  = this.eventQueue[0].callback2;

      if (cmd != "LIST"  && cmd != "RETR"  && cmd != "STOR"  && cmd != "APPE"    // used if we have a loss in connection
       && cmd != "LIST2" && cmd != "RETR2" && cmd != "STOR2" && cmd != "APPE2") {
        var throwAway = this.eventQueue.shift();

        if (throwAway.cmd != "USER"    && throwAway.cmd != "PASS"    && throwAway.cmd != "PWD"     && throwAway.cmd != "FEAT"
         && throwAway.cmd != "welcome" && throwAway.cmd != "goodbye" && throwAway.cmd != "aborted" && throwAway.cmd != "NOOP"
         && throwAway.cmd != "REST"    && throwAway.cmd != "SIZE"    && throwAway.cmd != "PBSZ"    && throwAway.cmd != "AUTH" && throwAway.cmd != "PROT") {
          this.trashQueue.push(throwAway);
        }
      }
    } else {
      cmd = "default";                                                           // an unexpected reply - perhaps a 421 timeout message
    }

    switch (cmd) {
      case "welcome":
        this.welcomeMessage = buffer;

        if (returnCode != 2) {
          if (this.observer) {
            this.observer.onConnectionRefused();
          }

          this.cleanup();

          break;
        }

        this.isConnected       = true;                                           // good to go

        if (this.observer) {
          this.observer.onConnected();
        }

        this.isReconnecting    = false;
        this.reconnectsLeft    = parseInt(this.reconnectAttempts);               // setup reconnection settings

        if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
          this.reconnectsLeft = 1;
        }

        this.unshiftEventQueue(  "USER", this.login, "");

        if (this.security) {
          this.unshiftEventQueue("PBSZ", "0",   "");
        }

        if (this.security == "authtls") {
          this.unshiftEventQueue("AUTH", "TLS", "");
        } else if (this.security == "authssl") {
          this.unshiftEventQueue("AUTH", "SSL", "");
        }
        break;

      case "AUTH":
        if (returnCode != 2) {
          this.error(buffer);
          this.isConnected = false;

          this.kill();

          return;
        } else {
          var si = this.controlTransport.securityInfo;
          si.QueryInterface(Components.interfaces.nsISSLSocketControl);
          si.StartTLS();
        }
        break;

      case "PBSZ":
        if (returnCode != 2) {
          this.error(buffer);
          this.isConnected = false;

          this.kill();
          return;
        }
        break;

      case "PROT":
        if (buffer.substring(0, 3) == "534" && parameter == "P") {
          this.appendLog(buffer, 'error', "error");
          this.unshiftEventQueue("PROT", "C", "");
          break;
        }

        if (returnCode != 2) {
          this.error(buffer);
          this.protPSuccess = false;
        } else {
          this.protPSuccess = parameter == "P";
        }
        break;

      case "USER":
      case "PASS":
        if (returnCode == 2) {
          if (this.legitClose) {
            if (this.observer) {
              this.observer.onWelcomed();
            }
          }

          if (this.observer) {
            this.observer.onLoginAccepted();
          }

          if (!this.legitClose) {
            this.recoverFromDisaster();                                          // recover from previous disaster
            break;
          }

          this.legitClose   = false;

          this.unshiftEventQueue("PWD",  "", "");
          this.unshiftEventQueue("FEAT", "", "");
        } else if (cmd == "USER" && returnCode == 3) {
          this.unshiftEventQueue("PASS", this.password, "");
        } else {
          this.cleanup();                                                        // login failed, cleanup variables
          this.error(buffer);
          this.isConnected = false;

          this.kill();

          if (this.observer) {
            var self = this;
            var func = function() { self.observer.onLoginDenied(); };
            setTimeout(func, 0);
          }

          return;
        }
        break;

      case "PASV":
        if (returnCode != 2) {
          this.error(buffer + ": " + this.constructPath(this.currentWorkingDir, this.eventQueue[(this.eventQueue[0].cmd == "REST" ? 1 : 0)].parameter));
          break;
        }

        if (this.passiveMode) {
          var dataHost;
          var dataPort;

          if (this.ipType == "IPv4") {
            buffer           = buffer.substring(buffer.indexOf("(") + 1, buffer.indexOf(")"));
            var re           = /,/g;
            buffer           = buffer.replace(re, ".");                          // parsing the port to transfer to
            var lastDotIndex = buffer.lastIndexOf(".");
            dataPort         = parseInt(buffer.substring(lastDotIndex + 1));
            dataPort        += 256 * parseInt(buffer.substring(buffer.lastIndexOf(".", lastDotIndex - 1) + 1, lastDotIndex));
            dataHost         = buffer.substring(0, buffer.lastIndexOf(".", lastDotIndex - 1));
          } else {
            buffer           = buffer.substring(buffer.indexOf("(|||") + 4, buffer.indexOf("|)"));
            dataPort         = parseInt(buffer);
            dataHost         = this.host;
          }

          var isSecure     = this.security && this.protPSuccess;
          var proxy        = { proxyType: this.proxyType, proxyHost: this.proxyHost, proxyPort: this.proxyPort };

          this.dataSocket       = new ftpDataSocketMozilla(isSecure, proxy, dataHost, dataPort);
          this.dataSocket.debug = this.debug;
          this.dataSocket.error = this.error;

          if (this.eventQueue[0].cmd        == "LIST") {                         // do what's appropriate
            this.dataSocket.connect();
          } else if (this.eventQueue[0].cmd == "RETR") {
            this.dataSocket.connect(false, this.eventQueue[0].callback,           callback);
          } else if (this.eventQueue[0].cmd == "REST") {
            this.dataSocket.connect(false, this.eventQueue[1].callback,           callback, this.eventQueue[0].parameter);
          } else if (this.eventQueue[0].cmd == "STOR") {
            this.dataSocket.connect(true,  this.eventQueue[0].callback,           0,        0);
          } else if (this.eventQueue[0].cmd == "APPE") {
            this.dataSocket.connect(true,  this.eventQueue[0].callback.localPath, 0,        this.eventQueue[0].callback.remoteSize);
          }
        }
        break;

      case "APPE":
      case "LIST":
      case "RETR":
      case "STOR":
        this.eventQueue[0].cmd = cmd + "2";

        if (this.dataSocket.emptyFile) {                                         // XXX empty files are (still) special cases
          this.dataSocket.kill(true);
        }

        if (returnCode == 2) {
          if (this.dataSocket.finished) {
            ++this.transferID;
            this.eventQueue.shift();
            this.trashQueue = new Array();                                       // clear the trash array, completed an 'atomic' set of operations

            if (cmd == "LIST") {
              this.listData = this.parseListData(this.dataSocket.listData, parameter);

              if (typeof callback == "string") {
                eval(callback);                                                  // send off list data to whoever wanted it
              } else {
                callback();
              }
            }

            if (callback2) {                                                     // for transfers
              callback2();
            }

            break;
          } else {
            var self = this;
            var func = function() { self.readControl("2"); };
            setTimeout(func, 500);                                               // give data stream some time to finish up
            return;
          }
        }

        if (returnCode != 1) {
          this.error(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
          this.eventQueue.shift();
          while (this.eventQueue.length && (this.eventQueue[0].cmd == "MDTM" || this.eventQueue[0].cmd == "XMD5" || this.eventQueue[0].cmd == "XSHA1")) {
            this.eventQueue.shift();            
          }
          this.trashQueue = new Array();

          if (this.dataSocket) {
            this.dataSocket.kill();
          }

          break;
        }
        return;

      case "APPE2":
      case "RETR2":
      case "STOR2":
      case "LIST2":
        if (returnCode != 2) {
          this.error(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
          this.eventQueue.shift();
          this.trashQueue = new Array();

          if (this.dataSocket) {
            this.dataSocket.kill();
          }
          break;
        }

        if (this.dataSocket.finished) {
          ++this.transferID;
          this.eventQueue.shift();
          this.trashQueue = new Array();                                         // clear the trash array, completed an 'atomic' set of operations
        }

        if (cmd == "LIST2" && this.dataSocket.finished) {
          this.listData = this.parseListData(this.dataSocket.listData, parameter);

          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }
        } else if (this.dataSocket.finished && callback2) {                      // for transfers
          callback2();
        } else if (!this.dataSocket.finished) {
          var self = this;
          var func = function() { self.readControl("2"); };
          setTimeout(func, 500);                                                 // give data stream some time to finish up
          return;
        }
        break;

      case "SIZE":
        if (returnCode == 2) {                                                   // used with APPE commands to see where to pick up from
          var size = buffer.split(" ").filter(this.removeBlanks);
          size     = parseInt(size[1]);

          for (var x = 0; x < this.eventQueue.length; ++x) {
            if (callback == this.eventQueue[x].cmd) {
              if (callback == "STOR") {
                this.eventQueue[x].cmd      = "APPE";
                this.eventQueue[x].callback = { localPath: this.eventQueue[x].callback,           remoteSize: size };
              } else if (callback == "APPE") {
                this.eventQueue[x].callback = { localPath: this.eventQueue[x].callback.localPath, remoteSize: size };
              } else if (callback == "PASV") {
                this.eventQueue[x].callback = size;
              }

              break;
            }
          }
        } else {                                                                 // our size command didn't work out, make sure we're not doing an APPE
          if (callback != "PASV") {
            for (var x = 0; x < this.eventQueue.length; ++x) {
              if (this.eventQueue[x].cmd == "APPE") {
                this.eventQueue[x].cmd      = "STOR";
                this.eventQueue[x].callback = this.eventQueue[x].callback.localPath;
                break;
              }
            }
          }
          this.appendLog(buffer, 'error', "error");
        }
        break;

      case "XMD5":
      case "XSHA1":
        if (returnCode == 2) {
          var zeHash = buffer.split(" ").filter(this.removeBlanks);
          zeHash     = zeHash[1].replace(/\n|\r/g, "").toLowerCase();

          try {
            var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
            file.initWithPath(callback);
            var cryptoHash = cmd == "XMD5" ? Components.interfaces.nsICryptoHash.MD5 : Components.interfaces.nsICryptoHash.SHA1;
            var fstream    = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            fstream.init(file, 1, 0, false);
            var gHashComp  = Components.classes["@mozilla.org/security/hash;1"].createInstance(Components.interfaces.nsICryptoHash);
            gHashComp.init(cryptoHash);
            gHashComp.updateFromStream(fstream, -1);
            var ourHash    = this.binaryToHex(gHashComp.finish(false)).toLowerCase();
            fstream.close();

            if (ourHash != zeHash) {
              this.error("'" + callback + "' - " + this.errorXCheckFail);
            }
          } catch (ex) {
            this.debug(ex);
          }
        } else {                                                                 // our size command didn't work out, make sure we're not doing an APPE
          this.appendLog(buffer, 'error', "error");
        }
        break;

      case "MDTM":
        if (returnCode == 2) {
          var zeDate = buffer.split(" ").filter(this.removeBlanks);
          zeDate     = zeDate[1];

          try {
            var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
            file.initWithPath(callback);
            file.lastModifiedTime = Date.parse(zeDate.substr(0, 4) + " " + zeDate.substr(4,  2) + " " + zeDate.substr(6,  2) + " "
                                             + zeDate.substr(8, 2) + ":" + zeDate.substr(10, 2) + ":" + zeDate.substr(12, 2) + " GMT");
          } catch (ex) {
            this.debug(ex);
          }
        } else {                                                                 // our size command didn't work out, make sure we're not doing an APPE
          this.appendLog(buffer, 'error', "error");
        }
        break;

      case "RNFR":
      case "REST":
        if (returnCode != 3) {
          if (cmd == "RNFR") {
            this.eventQueue = new Array();
            this.trashQueue = new Array();
          }

          this.error(buffer);                                                    // should still be able to go on without this, just not with resuming
          break;
        }
        break;

      case "MKD":
      case "SITE CHMOD":
      case "RNTO":
      case "DELE":
      case "RMD":
        if (returnCode != 2) {
          this.error(buffer + ": " + this.constructPath(this.currentWorkingDir, parameter));
        } else {
          if (cmd == "RMD") {                                                    // clear out of cache if it's a remove directory
            this.removeCacheEntry(this.constructPath(this.currentWorkingDir, parameter));
          }

          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }
        }

        this.trashQueue = new Array();
        break;

      case "CWD":
        if (returnCode != 2) {                                                   // if it's not a directory
          if (callback && typeof callback == "function") {
            callback(false);
          } else if (this.observer) {
            this.observer.onDirNotFound(buffer);
            this.error(buffer);
          }
        } else {
          this.currentWorkingDir = parameter;

          if (this.observer) {                                                   // else navigate to the directory
            this.observer.onChangeDir(parameter, typeof callback == "boolean" ? callback : "");
          }

          if (callback && typeof callback == "function") {
            callback(true);
          }
        }
        break;

      case "PWD":                                                                // gotta check for chrooted directories
        if (returnCode != 2) {
          this.error(buffer);
        } else {
          buffer = buffer.substring(buffer.indexOf("\"") + 1, buffer.lastIndexOf("\""));              // if buffer is not '/' we're chrooted
          this.currentWorkingDir = buffer;

          if (this.observer) {
            this.observer.onChangeDir(buffer != '/' && this.initialPath == '/' ? buffer : '', false, buffer != '/' || this.initialPath != '/');
          }
        }

        this.trashQueue = new Array();
        break;

      case "FEAT":
        if (returnCode != 2) {
          this.appendLog(buffer, 'error', "error");
        } else {
          buffer = buffer.indexOf("\r\n") != -1 ? buffer.split("\r\n") : buffer.split("\n");

          for (var x = 0; x < buffer.length; ++x) {
            if (buffer[x] && buffer[x][0] == ' ') {
              var feat = buffer[x].substring(1).toUpperCase();
              if (feat == "MDTM") {
                this.featMDTM = true;
              } else if (feat == "MLSD") {
                this.featMLSD = true;
              } else if (feat.indexOf("XSHA1") == 0) {
                this.featXCheck = "XSHA1";
              } else if (feat.indexOf("XMD5") == 0 && !this.featXCheck) {
                this.featXCheck = "XMD5";
              }
            }
          }
        }
        break;

      case "aborted":
        break;

      case "TYPE":
        if (returnCode != 2) {
          this.error(buffer);
        } else {
          this.transferMode = parameter;
        }
        break;
      case "goodbye":                                                            // you say yes, i say no, you stay stop...
      case "NOOP":
      default:
        if (returnCode != 2) {
          this.error(buffer);
        }
        break;
    }

    this.isReady = true;

    if (this.observer) {
      this.observer.onIsReadyChange(true);
    }

    if (this.eventQueue.length && this.eventQueue[0].cmd != "welcome") {         // start the next command
      this.writeControl();
    } else {
      this.refresh();
    }
  },

  refresh : function() {
    if (this.waitToRefresh) {
      var self = this;
      var func = function() { self.refresh(); };
      setTimeout(func, 1000);
      return;
    } else if (this.eventQueue.length) {
      return;
    }

    if (this.localRefreshLater) {
      var dir                 = new String(this.localRefreshLater);
      this.localRefreshLater  = "";

      if (this.observer) {
        this.observer.onShouldRefresh(true, false, dir);
      }
    }

    if (this.remoteRefreshLater) {
      var dir                 = new String(this.remoteRefreshLater);
      this.remoteRefreshLater = "";

      if (this.observer) {
        this.observer.onShouldRefresh(false, true, dir);
      }
    }
  },

  changeWorkingDirectory : function(path, callback) {
    this.addEventQueue("CWD", path, callback);
    this.writeControlWrapper();
  },

  makeDirectory : function(path, callback) {
    this.addEventQueue("CWD", path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    this.addEventQueue("MKD", path.substring(path.lastIndexOf('/') + 1), callback);
    this.writeControlWrapper();
  },

  remove : function(isDirectory, path, callback) {
    if (isDirectory) {
      this.unshiftEventQueue("RMD",    path.substring(path.lastIndexOf('/') + 1), callback);
      this.unshiftEventQueue("CWD",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);

      var self         = this;
      var listCallback = function() { self.removeRecursive(path); };
      this.list(path, listCallback, true, true);
    } else {
      this.unshiftEventQueue("DELE",   path.substring(path.lastIndexOf('/') + 1), callback);
      this.unshiftEventQueue("CWD",    path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    }

    this.writeControlWrapper();
  },

  removeRecursive : function(parent) {                                           // delete subdirectories and files
    var files = this.listData;

    for (var x = 0; x < files.length; ++x) {
      var remotePath = this.constructPath(parent, files[x].leafName);

      if (files[x].isDirectory()) {                                              // delete a subdirectory recursively
        this.unshiftEventQueue("RMD",  remotePath.substring(remotePath.lastIndexOf('/') + 1), "");
        this.unshiftEventQueue("CWD",  parent, true);
        this.removeRecursiveHelper(remotePath);
      } else {                                                                   // delete a file
        this.unshiftEventQueue("DELE", remotePath.substring(remotePath.lastIndexOf('/') + 1), "");
        this.unshiftEventQueue("CWD",  parent, true);
      }
    }
  },

  removeRecursiveHelper : function(remotePath) {
    var self           = this;
    var listCallback   = function() { self.removeRecursive(remotePath); };
    this.list(remotePath, listCallback, true, true);
  },

  rename : function(oldName, newName, callback, isDir) {
    if (isDir) {
      this.removeCacheEntry(oldName);
    }

    this.addEventQueue("RNFR", oldName);                                         // rename the file
    this.addEventQueue("RNTO", newName, callback);
    this.writeControlWrapper();
  },

  changePermissions : function(permissions, path, callback) {
    this.addEventQueue("CWD", path.substring(0, path.lastIndexOf('/') ? path.lastIndexOf('/') : 1), true);
    this.addEventQueue("SITE CHMOD", permissions + ' ' + path.substring(path.lastIndexOf('/') + 1), callback);
    this.writeControlWrapper();
  },

  custom : function(cmd) {
    this.addEventQueue(cmd);
    this.writeControlWrapper();
  },

  list : function(path, callback, skipCache, recursive) {
    if (!skipCache && this.sessionsMode) {
      try {                                                                      // check the cache first
        var cacheSession   = this.cacheService.createSession("fireftp", 0, true);
        var cacheDesc      = cacheSession.openCacheEntry("ftp://" + this.version + this.connectedHost + path,
                                                         Components.interfaces.nsICache.ACCESS_READ, false);

        if (cacheDesc.dataSize) {
          var cacheIn       = cacheDesc.openInputStream(0);
          var cacheInstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
          cacheInstream.setInputStream(cacheIn);
          this.listData     = cacheInstream.readBytes(cacheInstream.available());
          this.listData     = eval(this.listData);
          cacheInstream.close();
          cacheDesc.close();

          if (typeof callback == "string") {
            eval(callback);                                                      // send off list data to whoever wanted it
          } else {
            callback();
          }

          return;
        }

        cacheDesc.close();
      } catch (ex) { }
    }

    if (recursive) {
      this.unshiftEventQueue(  "LIST", path, callback);
      this.unshiftEventQueue(  "PASV",   "", "");
      this.unshiftEventQueue(  "CWD",  path, "");

      if (this.security) {
        this.unshiftEventQueue("PROT",  "P", "");
      }

      this.unshiftEventQueue(  "TYPE",  "A", "");
    } else {
      this.addEventQueue(      "TYPE",  "A", "");

      if (this.security) {
        this.addEventQueue(    "PROT",  "P", "");
      }

      this.addEventQueue(      "CWD",  path, "");
      this.addEventQueue(      "PASV",   "", "");
      this.addEventQueue(      "LIST", path, callback);
    }

    this.writeControlWrapper();
  },

  parseListData : function(data, path) {
    /* Unix style:                     drwxr-xr-x  1 user01 ftp  512    Jan 29 23:32 prog
     * Alternate Unix style:           drwxr-xr-x  1 user01 ftp  512    Jan 29 1997  prog
     * Alternate Unix style:           drwxr-xr-x  1 1      1    512    Jan 29 23:32 prog
     * SunOS style:                    drwxr-xr-x+ 1 1      1    512    Jan 29 23:32 prog
     * A symbolic link in Unix style:  lrwxr-xr-x  1 user01 ftp  512    Jan 29 23:32 prog -> prog2000
     * AIX style:                      drwxr-xr-x  1 user01 ftp  512    05 Nov 2003  prog
     * Novell style:                   drwxr-xr-x  1 user01      512    Jan 29 23:32 prog
     * Weird style:                    drwxr-xr-x  1 user5424867        Jan 29 23:32 prog, where 5424867 is the size
     * Weird style 2:                  drwxr-xr-x  1 user01 anon5424867 Jan 11 12:48 prog, where 5424867 is the size
     * MS-DOS style:                   01-29-97 11:32PM <DIR> prog
     * OS/2 style:                     0           DIR 01-29-97  23:32  PROG
     * OS/2 style:                     2243        RA  04-05-103 00:22  PJL
     * OS/2 style:                     60              11-18-104 06:54  chkdsk.log
     *
     * MLSD style: type=file;size=6106;modify=20070223082414;UNIX.mode=0644;UNIX.uid=32257;UNIX.gid=32259;unique=808g154c727; prog
     *             type=dir;sizd=4096;modify=20070218021044;UNIX.mode=0755;UNIX.uid=32257;UNIX.gid=32259;unique=808g1550003; prog
     *             type=file;size=4096;modify=20070218021044;UNIX.mode=07755;UNIX.uid=32257;UNIX.gid=32259;unique=808g1550003; prog
     *             type=OS.unix=slink:/blah;size=4096;modify=20070218021044;UNIX.mode=0755;UNIX.uid=32257;UNIX.gid=32259;unique=808g1550003; prog
     */

    try {
      data = this.toUTF8.convertStringToUTF8(data, this.encoding, 1);
    } catch (ex) {
      this.debug(ex);
    }

    this.debug(data.replace(/</g, '&lt;').replace(/>/g, '&gt;'), "INFO");

    var items   = data.indexOf("\r\n") != -1 ? data.split("\r\n") : data.split("\n");
    items       = items.filter(this.removeBlanks);
    var curDate = new Date();

    if (items.length) {                                                          // some ftp servers send 'count <number>' or 'total <number>' first
      if (items[0].indexOf("count") == 0 || items[0].indexOf("total") == 0 || (!this.featMLSD && items[0].split(" ").filter(this.removeBlanks).length == 2)) {
        items.shift();                                                           // could be in german or croatian or what have you
      }
    }

    for (var x = 0; x < items.length; ++x) {
      if (!items[x]) {                                                           // some servers put in blank lines b/w entries, aw, for cryin' out loud
        items.splice(x, 1);
        --x;
        continue;
      }

      var temp = items[x];                                                       // account for collisions:  drwxr-xr-x1017 user01

      if (!this.featMLSD) {
        if (!parseInt(items[x].charAt(0)) && items[x].charAt(0) != '0' && items[x].charAt(10) == '+') {     // drwxr-xr-x+ - get rid of the plus sign
          items[x] = this.setCharAt(items[x], 10, ' ');
        }

        if (!parseInt(items[x].charAt(0)) && items[x].charAt(0) != '0' && items[x].charAt(10) != ' ') {     // this is mimicked below if weird style
          items[x] = items[x].substring(0, 10) + ' ' + items[x].substring(10, items[x].length);
        }

        items[x]   = items[x].split(" ").filter(this.removeBlanks);
      }

      if (this.featMLSD) {                                                       // MLSD-standard style
        var newItem    = { permissions : "----------",
                           hardLink    : "",
                           user        : "",
                           group       : "",
                           fileSize    : "0",
                           date        : "",
                           leafName    : "",
                           isDir       : false,
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return this.symlink != "" },
                           symlink     : "",
                           path        : "" };

        items[x] = items[x].split(";");
        var skip = false;

        for (var y = 0; y < items[x].length; ++y) {
          if (!items[x][y]) {
            continue;
          }

          if (items[x][y][0] == ' ') {
            newItem.leafName = items[x][y].substring(1);
            newItem.path     = this.constructPath(path, newItem.leafName);
            continue;
          }
          
          var fact = items[x][y].split('=');
          if (fact.length < 2 || !fact[0] || !fact[1]) {
            continue;
          }

          var factName = fact[0].toLowerCase();
          var factVal  = fact[1];

          switch (factName) {
            case "type":
              if (factVal == "pdir" || factVal == "cdir") {
                skip = true;
              } else if (factVal == "dir") {
                newItem.isDir = true;
                newItem.permissions = this.setCharAt(newItem.permissions, 0, 'd');
              } else if (items[x][y].substring(5).indexOf("OS.unix=slink:") == 0) {
                newItem.symlink = items[x][y].substring(19);
                newItem.permissions = this.setCharAt(newItem.permissions, 0, 'l');
              } else if (factVal != "file") {
                skip = true;
              }
              break;
            case "size":
            case "sizd":
              newItem.fileSize = factVal;
              break;
            case "modify":
              var dateString = factVal.substr(0, 4) + " " + factVal.substr(4,  2) + " " + factVal.substr(6,  2) + " "
                             + factVal.substr(8, 2) + ":" + factVal.substr(10, 2) + ":" + factVal.substr(12, 2) + " GMT"
              var zeDate = new Date(dateString);
              var timeOrYear = new Date() - zeDate > 15600000000 ? zeDate.getFullYear()    // roughly 6 months
                             : this.zeroPadTime(zeDate.getHours()) + ":" + this.zeroPadTime(zeDate.getMinutes());
              newItem.date = this.l10nMonths[zeDate.getMonth()] + ' ' + zeDate.getDate() + ' ' + timeOrYear;
              newItem.lastModifiedTime = Date.parse(dateString);
              break;
            case "unix.mode":
              var offset = factVal.length == 5 ? 1 : 0;
              var sticky = this.zeroPad(parseInt(factVal[0 + offset]).toString(2));
              var owner  = this.zeroPad(parseInt(factVal[1 + offset]).toString(2));
              var group  = this.zeroPad(parseInt(factVal[2 + offset]).toString(2));
              var pub    = this.zeroPad(parseInt(factVal[3 + offset]).toString(2));
              newItem.permissions = this.setCharAt(newItem.permissions, 1, owner[0]  == '1' ? 'r' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 2, owner[1]  == '1' ? 'w' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 3, sticky[0] == '1' ? (owner[2] == '1' ? 's' : 'S')
                                                                                            : (owner[2] == '1' ? 'x' : '-'));
              newItem.permissions = this.setCharAt(newItem.permissions, 4, group[0]  == '1' ? 'r' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 5, group[1]  == '1' ? 'w' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 6, sticky[1] == '1' ? (group[2] == '1' ? 's' : 'S')
                                                                                            : (group[2] == '1' ? 'x' : '-'));
              newItem.permissions = this.setCharAt(newItem.permissions, 7, pub[0]    == '1' ? 'r' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 8, pub[1]    == '1' ? 'w' : '-');
              newItem.permissions = this.setCharAt(newItem.permissions, 9, sticky[2] == '1' ? (pub[2]   == '1' ? 't' : 'T')
                                                                                            : (pub[2]   == '1' ? 'x' : '-'));
              break;
            case "unix.uid":
              newItem.user = factVal;
              break;
            case "unix.gid":
              newItem.group = factVal;
              break;
            default:
              break;
          }

          if (skip) {
            break;
          }
        }

        if (skip) {
          items.splice(x, 1);
          --x;
          continue;
        }

        items[x] = newItem;
      } else if (!parseInt(items[x][0].charAt(0)) && items[x][0].charAt(0) != '0')  {   // unix style - so much simpler with you guys
        var offset = 0;

        if (items[x][3].search(this.remoteMonths) != -1 && items[x][5].search(this.remoteMonths) == -1) {
          var weird = temp;                                                      // added to support weird servers

          if (weird.charAt(10) != ' ') {                                         // same as above code
            weird = weird.substring(0, 10) + ' ' + weird.substring(10, weird.length);
          }

          var weirdIndex = 0;

          for (var y = 0; y < items[x][2].length; ++y) {
            if (parseInt(items[x][2].charAt(y))) {
              weirdIndex = weird.indexOf(items[x][2]) + y;
              break;
            }
          }

          weird    = weird.substring(0, weirdIndex) + ' ' + weird.substring(weirdIndex, weird.length);

          items[x] = weird.split(" ").filter(this.removeBlanks);
        }

        if (items[x][4].search(this.remoteMonths) != -1 && !parseInt(items[x][3].charAt(0))) {
          var weird = temp;                                                      // added to support 'weird 2' servers, oy vey

          if (weird.charAt(10) != ' ') {                                         // same as above code
            weird = weird.substring(0, 10) + ' ' + weird.substring(10, weird.length);
          }

          var weirdIndex = 0;

          for (var y = 0; y < items[x][3].length; ++y) {
            if (parseInt(items[x][3].charAt(y))) {
              weirdIndex = weird.indexOf(items[x][3]) + y;
              break;
            }
          }

          weird    = weird.substring(0, weirdIndex) + ' ' + weird.substring(weirdIndex, weird.length);

          items[x] = weird.split(" ").filter(this.removeBlanks);
        }

        if (items[x][4].search(this.remoteMonths) != -1) {                       // added to support novell servers
          offset   = 1;
        }

        var index = 0;
        for (var y = 0; y < 7 - offset; ++y) {
          index = temp.indexOf(items[x][y], index) + items[x][y].length + 1;
        }

        var name    = temp.substring(temp.indexOf(items[x][7 - offset], index) + items[x][7 - offset].length + 1, temp.length);
        name        = name.substring(name.search(/[^\s]/));
        var symlink = "";

        if (items[x][0].charAt(0) == 'l') {
          symlink   = name;
          name      = name.substring(0, name.indexOf("->") - 1);
          symlink   = symlink.substring(symlink.indexOf("->") + 3);
        }

        name             = (name.lastIndexOf('/') == -1 ? name : name.substring(name.lastIndexOf('/') + 1));
        var remotepath   = this.constructPath(path, name);
        var specialMonth = "";
        var month        = "";
        if (items[x][6].search(this.remoteMonths) != -1) {                       // added to support aix servers
          specialMonth = this.l10nMonths[this.remoteMonths.search(items[x][6 - offset]) / 4];
        } else {
          month        = this.l10nMonths[this.remoteMonths.search(items[x][5 - offset]) / 4];
        }
        items[x]       = { permissions : items[x][0],
                           hardLink    : items[x][1],
                           user        : items[x][2],
                           group       : (offset ? "" : items[x][3]),
                           fileSize    : items[x][4 - offset],
                           date        : specialMonth ? specialMonth + ' ' + items[x][5 - offset] + ' ' + items[x][7 - offset]
                                                      : month        + ' ' + items[x][6 - offset] + ' ' + items[x][7 - offset],
                           leafName    : name,
                           isDir       : items[x][0].charAt(0) == 'd',
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return this.symlink != "" },
                           symlink     : symlink,
                           path        : remotepath };

      } else if (items[x][0].indexOf('-') == -1) {                               // os/2 style
        var offset = 0;

        if (items[x][2].indexOf(':') != -1) {                                    // if "DIR" and "A" are missing
          offset   = 1;
        }

        var rawDate    = items[x][2 - offset].split("-");
        var rawTime    = items[x][3 - offset];
        var timeOrYear = rawTime;
        rawTime        = rawTime.split(":");

        for (var y = 0; y < rawDate.length; ++y) {
          rawDate[y]   = parseInt(rawDate[y], 10);                               // leading zeros are treated as octal so pass 10 as base argument
        }

        for (var y = 0; y < rawTime.length; ++y) {
          rawTime[y]   = parseInt(rawTime[y], 10);
        }

        rawDate[2]     = rawDate[2] + 1900;                                      // ah, that's better
        var parsedDate = new Date(rawDate[2], rawDate[0] - 1, rawDate[1], rawTime[0], rawTime[1]);  // month-day-year format

        if (new Date() - parsedDate > 15600000000) {                             // roughly 6 months
          timeOrYear   = rawDate[2];
        }

        var month      = this.l10nMonths[parsedDate.getMonth()];
        var name       = temp.substring(temp.indexOf(items[x][3 - offset]) + items[x][3 - offset].length + 1, temp.length);
        name           = name.substring(name.search(/[^\s]/));
        name           = (name.lastIndexOf('/') == -1 ? name : name.substring(name.lastIndexOf('/') + 1));
        items[x]       = { permissions : items[x][1] == "DIR" ? "d---------" : "----------",
                           hardLink    : "",
                           user        : "",
                           group       : "",
                           fileSize    : items[x][0],
                           date        : month + ' ' + rawDate[1] + ' ' + timeOrYear,
                           leafName    : name,
                           isDir       : items[x][1] == "DIR",
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return false },
                           symlink     : "",
                           path        : this.constructPath(path, name) };

      } else {                                                                   // ms-dos style
        var rawDate    = items[x][0].split("-");
        var amPm       = items[x][1].substring(5, 7);                            // grab PM or AM
        var rawTime    = items[x][1].substring(0, 5);                            // get rid of PM, AM
        var timeOrYear = rawTime;
        rawTime        = rawTime.split(":");

        for (var y = 0; y < rawDate.length; ++y) {
          rawDate[y]   = parseInt(rawDate[y], 10);
        }

        for (var y = 0; y < rawTime.length; ++y) {
          rawTime[y]   = parseInt(rawTime[y], 10);
        }

        rawTime[0] = rawTime[0] == 12 && amPm == "AM" ? 0 : (rawTime[0] < 12 && amPm == "PM" ? rawTime[0] + 12 : rawTime[0]);

        if (rawDate[2] < 70) {                                                   // assuming you didn't have some files left over from 1904
          rawDate[2]   = rawDate[2] + 2000;                                      // ah, that's better
        } else {
          rawDate[2]   = rawDate[2] + 1900;
        }

        var parsedDate = new Date(rawDate[2], rawDate[0] - 1, rawDate[1], rawTime[0], rawTime[1]);  // month-day-year format

        if (new Date() - parsedDate > 15600000000) {                             // roughly 6 months
          timeOrYear   = rawDate[2];
        } else {
          timeOrYear   = this.zeroPadTime(rawTime[0]) + ":" + this.zeroPadTime(rawTime[1]);
        }

        var month      = this.l10nMonths[parsedDate.getMonth()];
        var name       = temp.substring(temp.indexOf(items[x][2], temp.indexOf(items[x][1]) + items[x][1].length + 1)
                         + items[x][2].length + 1, temp.length);
        name           = name.substring(name.search(/[^\s]/));
        name           = (name.lastIndexOf('/') == -1 ? name : name.substring(name.lastIndexOf('/') + 1));
        items[x]       = { permissions : items[x][2] == "<DIR>" ? "d---------" : "----------",
                           hardLink    : "",
                           user        : "",
                           group       : "",
                           fileSize    : items[x][2] == "<DIR>" ? '0' : items[x][2],
                           date        : month + ' ' + rawDate[1] + ' ' + timeOrYear,
                           leafName    : name,
                           isDir       : items[x][2] == "<DIR>",
                           isDirectory : function() { return this.isDir },
                           isSymlink   : function() { return false },
                           symlink     : "",
                           path        : this.constructPath(path, name) };
      }

      if (!items[x].lastModifiedTime) {
        var dateTemp  = items[x].date;                                             // this helps with sorting by date
        var dateMonth = dateTemp.substring(0, 3);
        var dateIndex = this.l10nMonths.indexOf(dateMonth);
        dateTemp      = this.remoteMonths.substr(dateIndex * 4, 3) + dateTemp.substring(3);

        if (items[x].date.indexOf(':') != -1) {
          dateTemp = dateTemp + ' ' + (curDate.getFullYear() - (curDate.getMonth() < dateIndex ? 1 : 0));
        }

        items[x].lastModifiedTime = Date.parse(dateTemp);
      }

      items[x].parent = { path: items[x].path.substring(0, items[x].path.lastIndexOf('/') ? items[x].path.lastIndexOf('/') : 1) };
    }

    var directories = new Array();                                               // sort directories to the top
    var files       = new Array();

    for (var x = 0; x < items.length; ++x) {
      if (items[x].isDirectory()) {
        directories.push(items[x]);
      } else {
        files.push(items[x]);
      }
    }

    for (var x = directories.length - 1; x >= 0; --x) {                          // get rid of "." or ".."
      if (directories[x].leafName == "." || directories[x].leafName == "..") {   // this can screw up things on recursive deletions
        directories.splice(x, 1);
      }
    }

    items = directories.concat(files);

    for (var x = 0; x < items.length; ++x) {                                     // scrub out / or \, a security vulnerability if file tries to do ..\..\blah.txt
      items[x].leafName = items[x].leafName.replace(/[\\|\/]/g, '');             // thanks to Tan Chew Keong for the heads-up
      items[x].path     = this.constructPath(path, items[x].leafName);
    }

    if (this.sessionsMode) {
      try {                                                                      // put in cache
        var cacheSession = this.cacheService.createSession("fireftp", 0, true);
        var cacheDesc    = cacheSession.openCacheEntry("ftp://" + this.version + this.connectedHost + path,
                                                       Components.interfaces.nsICache.ACCESS_WRITE, false);
        var cacheOut     = cacheDesc.openOutputStream(0);
        var cacheData    = items.toSource();
        cacheOut.write(cacheData, cacheData.length);
        cacheOut.close();
        cacheDesc.close();
      } catch (ex) {
        this.debug(ex);
      }
    }

    return items;
  },

  download : function(remotePath, localPath, remoteSize, resume, localSize, isSymlink, callback) {
    this.addEventQueue(  "CWD",  remotePath.substring(0, remotePath.lastIndexOf('/') ? remotePath.lastIndexOf('/') : 1), true);

    var leafName = remotePath.substring(remotePath.lastIndexOf('/') + 1);

    this.addEventQueue(  "TYPE", this.detectAscii(remotePath));

    if (isSymlink) {
      this.addEventQueue("SIZE", leafName, "PASV");  // need to do a size check
    }

    if (this.security) {
      this.addEventQueue("PROT", "P");
    }

    this.addEventQueue(  "PASV", "", remoteSize);

    if (resume) {
      this.addEventQueue("REST", localSize);
    }

    this.addEventQueue(  "RETR", leafName, localPath, callback);

    if (this.featXCheck) {
      this.addEventQueue(this.featXCheck, leafName, localPath);      
    }

    if (this.timestampsMode && this.featMDTM) {
      this.addEventQueue("MDTM", leafName, localPath);      
    }

    this.writeControlWrapper();
  },

  upload : function(localPath, remotePath, resume, remoteSize, callback) {
    this.addEventQueue(  "CWD",  remotePath.substring(0, remotePath.lastIndexOf('/') ? remotePath.lastIndexOf('/') : 1), true);

    var leafName = remotePath.substring(remotePath.lastIndexOf('/') + 1);

    this.addEventQueue(  "TYPE", this.detectAscii(remotePath));

    if (resume) {
      this.addEventQueue("SIZE", leafName, "APPE");  // need to do a size check
    }

    if (this.security) {
      this.addEventQueue("PROT", "P");
    }

    this.addEventQueue(  "PASV");

    if (resume) {
      this.addEventQueue("APPE", leafName, { localPath: localPath, remoteSize: remoteSize }, callback);
    } else {
      this.addEventQueue("STOR", leafName,   localPath, callback);
    }

    if (this.featXCheck) {
      this.addEventQueue(this.featXCheck, leafName, localPath);      
    }

    if (this.timestampsMode && this.featMDTM) {
      this.addEventQueue("MDTM", leafName, localPath);      
    }

    this.writeControlWrapper();
  },

  removeCacheEntry : function(path) {
    try {
      var cacheSession = this.cacheService.createSession("fireftp", 0, true);
      var cacheDesc    = cacheSession.openCacheEntry("ftp://" + this.version + this.connectedHost + path,
                                                     Components.interfaces.nsICache.ACCESS_WRITE, false);
      cacheDesc.doom();
      cacheDesc.close();
    } catch (ex) {
      this.debug(ex);
    }
  },

  isListing : function() {                                                       // check queue to see if we're listing
    for (var x = 0; x < this.eventQueue.length; ++x) {
      if (this.eventQueue[x].cmd.indexOf("LIST") != -1) {
        return true;
      }
    }

    return false;
  },

  recoverFromDisaster : function() {                                             // after connection lost, try to restart queue
    if (this.eventQueue.length && this.eventQueue[0].cmd == "goodbye") {
      this.eventQueue.shift();
    }

    if (this.eventQueue.cmd) {
      this.eventQueue = new Array(this.eventQueue);
    }

    if (this.eventQueue.length && (this.eventQueue[0].cmd == "LIST" || this.eventQueue[0].cmd == "LIST2"
                               ||  this.eventQueue[0].cmd == "RETR" || this.eventQueue[0].cmd == "RETR2"
                               ||  this.eventQueue[0].cmd == "REST" || this.eventQueue[0].cmd == "APPE"
                               ||  this.eventQueue[0].cmd == "STOR" || this.eventQueue[0].cmd == "STOR2"
                               ||  this.eventQueue[0].cmd == "PASV" || this.eventQueue[0].cmd == "APPE2")) {
      var cmd       = this.eventQueue[0].cmd;
      var parameter = this.eventQueue[0].parameter;
      if (cmd == "LIST2" || cmd == "RETR2" || cmd == "STOR2" || cmd == "APPE2") {
        this.eventQueue[0].cmd = this.eventQueue[0].cmd.substring(0, 4);
      }

      cmd = this.eventQueue[0].cmd;

      if (cmd == "REST") {                                                       // set up resuming for these poor interrupted transfers
        try {
          var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
          file.initWithPath(this.eventQueue[1].callback);

          if (file.fileSize) {
            this.eventQueue[0].parameter = file.fileSize;
          }
        } catch (ex) {
          this.debug(ex);
        }
      } else if (cmd == "RETR") {
        try {
          var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
          file.initWithPath(this.eventQueue[0].callback);

          if (file.fileSize) {
            this.unshiftEventQueue("REST", file.fileSize, "");
          }
        } catch (ex) {
          this.debug(ex);
        }
      }

      for (var x = this.trashQueue.length - 1; x >= 0; --x) {                    // take cmds out of the trash and put them back in the eventQueue
        if (this.trashQueue[x].cmd == "TYPE" && (cmd == "STOR" || cmd == "APPE")) {   // more resuming fun - this time for the stor/appe commandds
          this.unshiftEventQueue("SIZE", parameter, cmd);
        }

        this.eventQueue.unshift(this.trashQueue[x]);
      }
    } else if (this.eventQueue.length && this.eventQueue[0].cmd == "RNTO" && this.trashQueue[this.trashQueue.length - 1].cmd == "RNFR") {
      this.unshiftEventQueue(this.trashQueue[this.trashQueue.length - 1]);
    }

    if (this.currentWorkingDir) {
      this.unshiftEventQueue("CWD", this.currentWorkingDir, true);
      this.currentWorkingDir = "";
    }

    this.trashQueue = new Array();
  },

  detectAscii : function(path) {                                                 // detect an ascii file - returns "A" or "I"
    if (this.fileMode == 1) {                                                    // binary
      return "I";
    }

    if (this.fileMode == 2) {                                                    // ASCII
      return "A";
    }

    path = path.substring(path.lastIndexOf('.') + 1);                            // manually detect

    for (var x = 0; x < this.asciiFiles.length; ++x) {
      if (this.asciiFiles[x].toLowerCase() == path.toLowerCase()) {
        return "A";
      }
    }

    return "I";
  },

  constructPath : function(parent, leafName) {
    return parent + (parent.charAt(parent.length - 1) != '/' ? '/' : '') + leafName;
  },

  removeBlanks : function(element, index, array) {
    return element;
  },

  zeroPad : function(str) {
    return str.length == 3 ? str : (str.length == 2 ? '0' + str : '00' + str);
  },

  zeroPadTime : function(num) {
    num = num.toString();
    return num.length == 2 ? num : '0' + num;
  },

  setCharAt : function(str, index, ch) {                                         // how annoying
    return str.substr(0, index) + ch + str.substr(index + 1);
  },

  setEncoding : function(encoding) {
    try {
      this.fromUTF8.charset = encoding;
      this.encoding         = encoding;
    } catch (ex) {
      this.fromUTF8.charset = "UTF-8";
      this.encoding         = "UTF-8";
    }
  },

  binaryToHex : function(input) {                                                // borrowed from nsUpdateService.js
    var result = "";

    for (var i = 0; i < input.length; ++i) {
      var hex = input.charCodeAt(i).toString(16);

      if (hex.length == 1) {
        hex = "0" + hex;
      }

      result += hex;
    }

    return result;
  }
};

