function transfer() {
  this.prompt             = true;
  this.skipAll            = false;
  this.cancel             = false;
  this.busy               = false;
  this.didRefreshLaterSet = false;
  this.remoteRefresh      = '';
  this.localRefresh       = '';
}

transfer.prototype = {
  start : function(download, aFile, aLocalParent, aRemoteParent, aListData) {
    if (!gFtp.isConnected || this.cancel || ( download && !aFile && remoteTree.selection.count == 0 && !aLocalParent)
                                         || (!download && !aFile && localTree.selection.count  == 0 && !aLocalParent)) {
      return;
    }

    if (this.busy) {                                         // we're doing locking, sort of, see below
      var self = this;
      var currentListData = aListData ? aListData : cloneArray(gFtp.listData);
      var func = function() { self.start(download, aFile, aLocalParent, aRemoteParent, currentListData); };
      setTimeout(func, 500);
      return;
    }

    var localParent  = aLocalParent  ? aLocalParent  : gLocalPath.value;
    var remoteParent = aRemoteParent ? aRemoteParent : gRemotePath.value;
    var files        = new Array();
    var resume;
    var listData     = aListData ? aListData : gFtp.listData;

    if (gNoPromptMode) {                                     // overwrite dialog is disabled, do overwrites
      this.prompt = false;
    }

    if (aFile) {                                             // populate the files variable with what we're transfering
      files.push(aFile);
    } else if (download) {                                   // download specific
      if (aRemoteParent) {                                   // if recursive
        files = listData;
      } else {                                               // if not recursive
        for (var x = 0; x < remoteTree.rowCount; ++x) {
          if (remoteTree.selection.isSelected(x)) {
            files.push(remoteTree.data[x]);
          }
        }
      }
    } else {                                                 // upload specific
      if (aLocalParent) {                                    // if recursive
        try {
          var dir     = localFile.init(localParent);
          var entries = dir.directoryEntries;

          while (entries.hasMoreElements()) {
            var file = entries.getNext().QueryInterface(Components.interfaces.nsILocalFile);

            if (file.exists() && localFile.testSize(file) && (!file.isHidden() || gFtp.hiddenMode)) {
              files.push(file);
            }
          }
        } catch (ex) {
          debug(ex);
          return;                                            // skip this directory
        }
      } else {                                               // if not recursive
        for (var x = 0; x < localTree.rowCount; ++x) {
          if (localTree.selection.isSelected(x)) {
            if (!localFile.verifyExists(localTree.data[x])) {
              continue;
            }

            files.push(localTree.data[x]);
          }
        }
      }
    }

    if (download && aLocalParent) {
      localDirTree.addDirtyList(aLocalParent);
    } else if (!download && aRemoteParent) {
      remoteDirTree.addDirtyList(aRemoteParent);
    }

    for (var x = 0; x < files.length; ++x) {
      var fileName = files[x].leafName;

      if ((download && gDownloadCaseMode == 1) || (!download && gUploadCaseMode == 1)) {
        fileName = fileName.toLowerCase();                   // special request to change filename case
      } else if ((download && gDownloadCaseMode == 2) || (!download && gUploadCaseMode == 2)) {
        fileName = fileName.toUpperCase();                   // special request to change filename case
      }

      var remotePath = !download ? gFtp.constructPath     (remoteParent, fileName) : files[x].path;
      var localPath  =  download ? localTree.constructPath(localParent,  fileName) : files[x].path;
      var file;

      if (download) {                                        // check to see if file exists
        file           = localFile.init(localPath);
      } else {
        file           = { exists: function() { return false; } };
        var remoteList = aRemoteParent ? listData : remoteTree.data;

        for (var y = 0; y < remoteList.length; ++y) {
          if (remoteList[y].leafName == fileName) {
            file       = { fileSize: remoteList[y].fileSize, lastModifiedTime: remoteList[y].lastModifiedTime, leafName: fileName, exists: function() { return true; } };
            break;
          }
        }
      }

      if (files[x].fileSize >= 4294967296) {
        error(gStrbundle.getString("tooBig") + " '" + files[x].leafName + "' " + gStrbundle.getString("tooBig2"));
        continue;
      }

      if (file.exists() && this.skipAll) {
        continue;
      }

      resume = false;

      if (file.exists() && this.prompt && !files[x].isDirectory()) {
        resume = file.fileSize < files[x].fileSize;          // ask nicely if file exists

        var params = { response         : 0,
                       fileName         : download ? localPath : remotePath,
                       resume           : true,
                       replaceResume    : !resume,
                       existingSize     : file.fileSize,
                       existingDate     : file.lastModifiedTime,
                       newSize          : files[x].fileSize,
                       newDate          : files[x].lastModifiedTime,
                       timerEnable      : !gDisableDestructMode };

        this.busy = true;                                    // ooo, the fun of doing semi-multi-threaded stuff in firefox
                                                             // we're doing some 'locking' above
        gFtp.waitToRefresh = true;

        window.openDialog("chrome://fireftp/content/confirmFile.xul", "confirmFile", "chrome,modal,dialog,resizable,centerscreen", params);

        gFtp.waitToRefresh = false;
        this.busy = false;

        if (params.response == 1) {
          resume       = false;
        } else if (params.response == 2) {
          this.prompt  = false;
          resume       = false;
        } else if ((params.response == 3) || (params.response == 0)) {
          continue;
        } else if (resume && params.response == 4) {
          resume       = true;
        } else if (!resume && params.response == 4) {
          this.cancel  = true;
          gFtp.abort();
          break;
        } else if (params.response == 5) {
          this.skipAll = true;
          continue;
        }
      }

      if (!this.didRefreshLaterSet) {
        this.didRefreshLaterSet = true;

        if ((download && !aLocalParent) || this.localRefresh) {
          gFtp.localRefreshLater  = this.localRefresh  ? this.localRefresh  : localParent;
        }

        if ((!download && !aRemoteParent) || this.remoteRefresh) {
          gFtp.remoteRefreshLater = this.remoteRefresh ? this.remoteRefresh : remoteParent;
        }
      }

      if (download) {
        if (files[x].isDirectory()) {                        // if the directory doesn't exist we create it
          if (!file.exists()) {
            try {
              file.create(Components.interfaces.nsILocalFile.DIRECTORY_TYPE, 0755);
            } catch (ex) {
              debug(ex);
              error(gStrbundle.getString("failedDir") + " '" + remotePath + "' " + gStrbundle.getString("failedDir2"));
              continue;
            }
          }

          this.downloadHelper(localPath, remotePath);
        } else {                                             // download the file
          gFtp.download(remotePath, localPath, files[x].fileSize, resume, resume ? file.fileSize : -1, files[x].isSymlink());
        }
      } else {
        if (files[x].isDirectory()) {                        // if the directory doesn't exist we create it
          if (!file.exists()) {
            gFtp.makeDirectory(remotePath);
            gFtp.listData = new Array();                     // we know the new directory is empty
            this.start(false, '', localPath, remotePath);
          } else {
            this.uploadHelper(localPath, remotePath);
          }
        } else {
          gFtp.upload(localPath, remotePath, resume, resume ? file.fileSize : -1);
        }
      }
    }
  },

  downloadHelper : function(localPath, remotePath) {
    var self = this;
    var func = function() {                                  // we use downloadHelper b/c if we leave it inline the closures will apply
      self.start(true,  '', localPath, remotePath);
    };
    gFtp.list(remotePath, func, true);
  },

  uploadHelper   : function(localPath, remotePath) {
    var self = this;
    var func = function() {                                  // we use uploadHelper   b/c if we leave it inline the closures will apply
      gFtp.removeCacheEntry(remotePath);
      self.start(false, '', localPath, remotePath);
    };
    gFtp.list(remotePath, func, true);
  }
};
