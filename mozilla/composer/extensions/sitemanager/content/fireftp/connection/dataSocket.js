function ftpDataSocketMozilla(security, proxy, host, port) {
  this.transportService  = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
  this.proxyService      = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService  (Components.interfaces.nsIProtocolProxyService);
  this.dnsService        = Components.classes["@mozilla.org/network/dns-service;1"].getService             (Components.interfaces.nsIDNSService);
  this.threadService     = Components.classes["@mozilla.org/thread;1"].getService                          (Components.interfaces.nsIThread);
  this.eventQueueService = Components.classes["@mozilla.org/event-queue-service;1"].getService             (Components.interfaces.nsIEventQueueService);
  this.eventQueue        = this.eventQueueService.createFromIThread(this.threadService.currentThread, true);
  this.security          = security || false;
  this.host              = host     || "";
  this.port              = port     || -1;
  this.proxyType         = proxy ? proxy.proxyType : "";
  this.proxyHost         = proxy ? proxy.proxyHost : "";
  this.proxyPort         = proxy ? proxy.proxyPort : -1;
}

ftpDataSocketMozilla.prototype = {
  dataTransport : null,
  dataInstream  : null,
  dataOutstream : null,
  fileInstream  : null,
  serverSocket  : null,

  listData      : "",
  finished      : true,

  debug         : null,
  error         : null,

  emptyFile     : false,                                                                    // XXX empty files are (still) special cases

  connect : function(write, localPath, fileTotalBytes, filePartialBytes, activeTransport) {
    try {
      if (activeTransport) {
        this.dataTransport = activeTransport;
      } else {
        var proxyInfo = this.proxyType == "" ? null : this.proxyService.newProxyInfo(this.proxyType, this.proxyHost, this.proxyPort, 0, 30, null);

        if (this.security) {
          this.dataTransport = this.transportService.createTransport(["ssl"], 1, this.host, this.port, proxyInfo);
        } else {
          this.dataTransport = this.transportService.createTransport(null,    0, this.host, this.port, proxyInfo);
        }
      }

      this.finished = false;

      if (write)  {                                                                         // upload
        this.dataOutstream  = this.dataTransport.openOutputStream(0, 0, -1);
        var file;

        try {
          file              = localFile.init(localPath);
          this.fileInstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance();
          this.fileInstream.QueryInterface(Components.interfaces.nsIFileInputStream);
          this.fileInstream.init(file, 0x01, 0644, 0);
          this.fileInstream.QueryInterface(Components.interfaces.nsISeekableStream);
          this.fileInstream.seek(0, filePartialBytes);                                      // append or not to append
        } catch (ex) {
          if (this.debug) {
            this.debug(ex);
          }

          if (this.error) {
            this.error(gStrbundle.getString("failedUpload") + " '" + localPath + "'.");
          }

          this.kill();
          return;
        }

        this.progressEventSink.parent        = this;
        this.progressEventSink.sendPrevSent  = 0;
        this.progressEventSink.timeStart     = new Date();
        this.progressEventSink.bytesTotal    = file.fileSize;
        this.progressEventSink.bytesUploaded = parseInt(filePartialBytes);
        this.progressEventSink.bytesPartial  = parseInt(filePartialBytes);
        this.progressEventSink.dataOutstream = this.dataOutstream;
        this.progressEventSink.fileInstream  = this.fileInstream;
        this.emptyFile                       = !file.fileSize;

        this.dataTransport.setEventSink(this.progressEventSink, this.eventQueue);
        this.dataOutstream.writeFrom(this.fileInstream, this.fileInstream.available() < 4096 ? this.fileInstream.available() : 4096);
      } else {                                                                              // download
        this.listData                     = "";
        var dataStream                    = this.dataTransport.openInputStream(0, 0, 0);
        this.dataInstream                 = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream)
        this.dataInstream.setInputStream(dataStream);
        this.dataListener.parent          = this;
        this.dataListener.localPath       = localPath;
        this.dataListener.dataInstream    = this.dataInstream;
        this.dataListener.data            = "";
        this.dataListener.file            = "";
        this.dataListener.fileOutstream   = "";
        this.dataListener.binaryOutstream = "";
        this.dataListener.bytesTotal      = fileTotalBytes   || 0;
        this.dataListener.bytesDownloaded = filePartialBytes || 0;
        this.dataListener.bytesPartial    = filePartialBytes || 0;
        this.dataListener.timeStart       = new Date();
        this.dataListener.dataBuffer      = "";
        this.dataListener.isNotList       = localPath != null;

        var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
        pump.init(dataStream, -1, -1, 0, 0, false);
        pump.asyncRead(this.dataListener, null);
      }

    } catch(ex) {
      if (this.debug) {
        this.debug(ex);
      }

      if (this.error) {
        this.error(gStrbundle.getString("errorDataConn"));
      }

      return;
    }
  },

  createServerSocket : function(activeInfo) {
    try {
      var ipAddress      = this.dnsService.resolve(this.dnsService.myHostName, false).getNextAddrAsString();
      var re             = /\x2e/g;
      this.serverSocket  = Components.classes["@mozilla.org/network/server-socket;1"].createInstance(Components.interfaces.nsIServerSocket);

      var self = this;
      var serverListener = {
        onSocketAccepted : function(serv, transport) {
          if (activeInfo.cmd == "LIST") {
            self.connect(false, null,                  0,                    0,                       transport);
          } else if (activeInfo.cmd == "RETR") {
            self.connect(false, activeInfo.localPath, activeInfo.totalBytes, 0,                       transport);
          } else if (activeInfo.cmd == "REST") {
            self.connect(false, activeInfo.localPath, activeInfo.totalBytes, activeInfo.partialBytes, transport);
          } else if (activeInfo.cmd == "STOR") {
            self.connect(true,  activeInfo.localPath, 0,                     0,                       transport);
          } else if (activeInfo.cmd == "APPE") {
            self.connect(true,  activeInfo.localPath, 0,                     activeInfo.partialBytes, transport);
          }
        },

        onStopListening : function(serv, status) { }
      };

      this.serverSocket.init(this.port, false, -1);
      this.serverSocket.asyncListen(serverListener);

      if (activeInfo.ipType == "IPv4" && ipAddress.indexOf(':') == -1) {
        return ipAddress.replace(re, ",") + "," + parseInt(this.serverSocket.port / 256) + "," + this.serverSocket.port % 256;
      } else {
        return (ipAddress.indexOf(':') != -1 ? "|2|" : "|1|") + ipAddress + "|" + this.serverSocket.port + "|";
      }
    } catch (ex) {
      if (this.debug) {
        this.debug(ex);
      }

      if (this.error) {
        this.error(gStrbundle.getString("errorDataConn"));
      }

      return null;
    }
  },

  kill : function(override) {
    this.progressEventSink.bytesTotal = 0;                                                  // stop uploads
    this.dataListener.bytesTotal      = 0;                                                  // stop downloads

    try {
      if (this.dataInstream && this.dataInstream.close) {
        this.dataInstream.close();
      }
    } catch(ex) { }

    try {
      if ((!this.emptyFile || override) && this.dataOutstream && this.dataOutstream.flush) {
        this.dataOutstream.flush();
      }

      if ((!this.emptyFile || override) && this.dataOutstream && this.dataOutstream.close) {
        this.dataOutstream.close();
      }
    } catch(ex) { }

    try {
      if ((!this.emptyFile || override) && this.fileInstream && this.fileInstream.close) {
        this.fileInstream.close();
      }
    } catch(ex) { }

    try {
      if ((!this.emptyFile || override) ) {                                                 // XXX empty files are (still) special cases
        if (this.dataTransport && this.dataTransport.close) {
          this.dataTransport.close("Finished");
        }
      }
    } catch(ex) { }

    try {
      if (this.dataListener.binaryOutstream && this.dataListener.binaryOutstream.close) {
        this.dataListener.binaryOutstream.close();
      }
    } catch(ex) { }

    try {
      if (this.dataListener.fileOutstream && this.dataListener.fileOutstream.close) {
        this.dataListener.fileOutstream.close();
      }
    } catch(ex) { }

    try {
      if (this.serverSocket && this.serverSocket.close) {
        this.serverSocket.close();
      }
    } catch(ex) { }

    this.progressEventSink.parent     = null;                                               // stop memory leakage!
    this.dataListener.parent          = null;                                               // stop memory leakage!

    this.finished  = true;
  },

  dataListener : {
    parent           : null,
    localPath        : "",
    dataInstream     : "",
    data             : "",
    file             : "",
    fileOutstream    : "",
    binaryOutstream  : "",
    bytesTotal       : 0,
    bytesDownloaded  : 0,
    bytesPartial     : 0,
    timeStart        : new Date(),
    dataBuffer       : "",
    isNotList        : false,

    onStartRequest : function(request, context) {
      if (this.isNotList) {
        this.timeStart = new Date();

        try {
          this.file          = localFile.init(this.localPath);
          this.fileOutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

          if (this.bytesPartial) {
            this.fileOutstream.init(this.file, 0x04 | 0x10, 0644, 0);
          } else {
            this.fileOutstream.init(this.file, 0x04 | 0x08 | 0x20, 0644, 0);
          }

          this.binaryOutstream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
          this.binaryOutstream.setOutputStream(this.fileOutstream);
        } catch (ex) {
          this.failure(ex);
        }
      }
    },

    onStopRequest : function(request, context, status) {
      if (!this.isNotList && this.parent) {
        this.parent.listData = this.data;
      }

      if (this.parent) {
        this.parent.kill();
      }
    },

    onDataAvailable : function(request, context, inputStream, offset, count) {
      if (this.isNotList) {
        try {
          this.dataBuffer       = this.dataInstream.readBytes(count);
          this.binaryOutstream.writeBytes(this.dataBuffer, this.dataBuffer.length)
          this.bytesDownloaded += this.dataBuffer.length;
        } catch (ex) {
          this.failure(ex);
        }
      } else {
        this.data += this.dataInstream.readBytes(count);
      }
    },

    failure : function(ex) {
      if (this.parent.debug) {
        this.parent.debug(ex);
      }

      if (this.parent.error) {
        this.parent.error(gStrbundle.getString("failedSave") + " '" + this.localPath + "' " + gStrbundle.getString("failedSave2"));
      }

      this.parent.kill();
    }
  },

  progressEventSink : {
    parent        : null,
    bytesTotal    : 0,
    sendPrevSent  : 0,
    bytesUploaded : 0,
    timeStart     : new Date(),
    bytesPartial  : 0,
    dataOutstream : null,
    fileInstream  : null,

    onTransportStatus : function (transport, status, progress, progressMax) {
      this.bytesUploaded += progress - this.sendPrevSent;
      this.sendPrevSent   = progress;

      if (this.bytesUploaded == this.bytesTotal) {                                          // finished writing
        this.parent.kill();                                                                 // can't rely on this.fileInstream.available() - corrupts uploads
        return;
      }

      this.dataOutstream.writeFrom(this.fileInstream, this.fileInstream.available() < 4096 ? this.fileInstream.available() : 4096);
    }
  }
};
