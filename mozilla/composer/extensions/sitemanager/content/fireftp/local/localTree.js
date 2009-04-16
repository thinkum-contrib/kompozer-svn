var localTree = {
  data                    : new Array(),
  displayData             : new Array(),
  rowCount                : 0,
  localSize               : 0,
  localAvailableDiskSpace : 0,
  searchMode              : 0,

  getParentIndex      : function(row)               { return -1; },
  getLevel            : function(row)               { return 0;  },
  getRowProperties    : function(row, props)        { },
  getColumnProperties : function(colid, col, props) { },
  isContainer         : function(row)               { return false; },
  isSeparator         : function(row)               { return false; },
  isSorted            : function(row)               { return false; },
  setTree             : function(treebox)           { this.treebox = treebox; },

  getCellText         : function(row, column)       {                                           // text for the files
    if (row >= 0 && row < this.data.length) {
      switch(column.id) {
        case "localname":
          return this.searchMode == 2 ? this.displayData[row].path : this.displayData[row].leafName;
        case "localsize":
          return this.displayData[row].fileSize;
        case "localdate":
          return this.displayData[row].date;
        case "localtype":
          return this.displayData[row].extension;
        case "localattr":
          return this.displayData[row].attr;
        default:
          return " ";
      }
    }

    return "";
  },

  getImageSrc  : function(row, col)  {
    return row >= 0 && row < this.data.length && col.id == "localname" && this.displayData[row].icon ? this.displayData[row].icon : "";
  },

  cycleHeader : function(col) {
    var sortDirection = col.element.getAttribute("sortDirection") == "ascending"
                     || col.element.getAttribute("sortDirection") == "natural"  ? "descending" : "ascending";
    $('localname').setAttribute("sortDirection", "natural");
    $('localsize').setAttribute("sortDirection", "natural");
    $('localdate').setAttribute("sortDirection", "natural");
    $('localtype').setAttribute("sortDirection", "natural");
    $('localattr').setAttribute("sortDirection", "natural");
    col.element.setAttribute(   "sortDirection", sortDirection);
    this.sort();
  },

  getCellProperties : function(row, col, props)   {
    if (row >= 0 && row < this.data.length && this.data[row]) {
      if (col.id == "localname") {
        if (this.displayData[row].isDirectory) {
          props.AppendElement(gAtomService.getAtom("isFolder"));
        } else if (this.displayData[row].isSymlink) {
          props.AppendElement(gAtomService.getAtom("isLink"));
        }

        props.AppendElement(gAtomService.getAtom("nameCol"));
      }

      if (dragObserver.overName) {
        props.AppendElement(gAtomService.getAtom("overName"));        
      }

      if (this.displayData[row].isHidden) {
        props.AppendElement(gAtomService.getAtom("hidden"));        
      }
    }
  },

  // ****************************************************** updateView ***************************************************

  updateView : function(files) {
    var localTreeItems = new Array();

    if (!files) {
      this.searchMode = 0;
      gLocalTreeChildren.removeAttribute('search');

      try {
        this.localSize               = 0;
        var dir                      = localFile.init(gLocalPath.value);
        this.localAvailableDiskSpace = parseSize(dir.diskSpaceAvailable);                         // get local disk size
        var entries                  = dir.directoryEntries;

        while (entries.hasMoreElements()) {
          var file        = entries.getNext().QueryInterface(Components.interfaces.nsILocalFile);
          var isException = false;

          for (var x = 0; x < localDirTree.exceptions.length; ++x) {
            if (gSlash == "/") {
              isException  = localDirTree.exceptions[x].path               == file.path;
            } else {
              isException  = localDirTree.exceptions[x].path.toLowerCase() == file.path.toLowerCase();
            }

            if (isException) {
              break;
            }
          }

          if (file.exists() && localFile.testSize(file) && (!file.isHidden() || gFtp.hiddenMode || isException)) {
            this.localSize += file.fileSize;
            localTreeItems.push(file);
          }
        }
      } catch (ex) {
        debug(ex);
        this.data        = new Array();
        this.displayData = new Array();
        this.treebox.rowCountChanged(0, -this.rowCount);
        this.rowCount = this.data.length;
        this.treebox.rowCountChanged(0, this.rowCount);
        this.mouseOver(null);
        error(gStrbundle.getString("noPermission"));
        return;
      }
    } else {
      this.localSize  = -1;
      localTreeItems  = files;
      this.searchMode = this.searchMode ? this.searchMode : (gSearchRecursive ? 2 : 1);
      gLocalTreeChildren.setAttribute('search', true);
    }

    this.localSize = parseSize(this.localSize);                                                 // get directory size

    this.data      = localTreeItems;                                                            // update localTree
    this.sort();

    var index = localDirTree.indexOfPath(gLocalPath.value);                                     // select directory in localDirTree
    localDirTree.selection.select(index);
    localDirTree.treebox.ensureRowIsVisible(index);

    if (this.data.length) {
      this.selection.select(0);                                                                 // select first element in localTree
    }

    this.mouseOver(null);

    if (files) {
      return;
    }

    var anyFolders = false;                                                                     // see if the folder has any subfolders
    for (var x = 0; x < this.data.length; ++x) {
      if (this.data[x].isDirectory()) {
        anyFolders = true;
        break;
      }
    }

    if (!anyFolders) {                                                                          // and if there are no subfolders then update our tree
      if (localDirTree.data[index].open) {                                                      // if localDirTree is open
        localDirTree.toggleOpenState(index);
      }

      localDirTree.data[index].empty    = true;
      localDirTree.data[index].open     = false;
      localDirTree.data[index].children = null;

      for (var x = 0; x < localDirTree.dirtyList.length; ++x) {
        if (localDirTree.dirtyList[x] == gLocalPath.value) {
          localDirTree.dirtyList.splice(x, 1);
          break;
        }
      }
    } else if (anyFolders && localDirTree.data[index].empty) {
      localDirTree.data[index].empty    = false;
    }

    localDirTree.treebox.invalidateRow(index);
  },

  sort : function() {
    this.sortHelper($('localname'), this.searchMode == 2 ? directorySort2 : compareName);
    this.sortHelper($('localsize'), compareSize);
    this.sortHelper($('localdate'), compareDate);
    this.sortHelper($('localtype'), compareType);
    this.sortHelper($('localattr'), compareLocalAttr);

    this.displayData = new Array();

    for (var row = 0; row < this.data.length; ++row) {
      this.displayData.push({ leafName    : this.data[row].leafName,
                              fileSize    : this.getFormattedFileSize(row),
                              date        : this.getFormattedDate(row),
                              extension   : this.data[row].isDirectory() ? "" : this.getExtension(this.data[row].leafName),
                              attr        : this.data[row].permissions   ? this.convertPermissions(this.data[row].isHidden(), this.data[row].permissions) : "",
                              icon        : this.getFileIcon(row),
                              path        : this.data[row].path,
                              isDirectory : this.data[row].isDirectory(),
                              isSymlink   : this.data[row].isSymlink(),
                              isHidden    : this.data[row].isHidden() });
    }

    this.treebox.rowCountChanged(0, -this.rowCount);
    this.rowCount = this.data.length;
    this.treebox.rowCountChanged(0, this.rowCount);
  },

  sortHelper : function(el, sortFunc) {
    if (el.getAttribute("sortDirection") && el.getAttribute("sortDirection") != "natural") {
      this.data.sort(sortFunc);

      if (el.getAttribute("sortDirection") == "ascending") {
        this.data.reverse();
      }
    }
  },

  getFormattedFileSize : function(row) {
    if (this.data[row].isDirectory()) {
      return "";
    }

    if (this.data[row].fileSize == 0) {
      return "0" + (gBytesMode ? "  " : " KB  ");
    }

    if (gBytesMode) {
      return this.data[row].fileSize + "  ";
    }

    return commas(Math.floor(this.data[row].fileSize / 1024) + 1) + " KB  ";
  },

  getFormattedDate : function(row) {
    var date = new Date(this.data[row].lastModifiedTime);

    if ((new Date()).getFullYear() > date.getFullYear()) {                                      // if not current year, display old year
      return gMonths[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear();
    }

    var time = date.toLocaleTimeString();                                                       // else display time
    var ampm = time.indexOf('AM') != - 1 ? ' AM' : (time.indexOf('PM') != -1 ? ' PM' : '');
    return gMonths[date.getMonth()] + ' ' + date.getDate() + ' ' + time.substring(0, time.lastIndexOf(':')) + ampm;
  },

  getExtension : function(leafName) {
    return leafName.lastIndexOf(".") != -1 ? leafName.substring(leafName.lastIndexOf(".") + 1, leafName.length).toLowerCase() : "";
  },

  convertPermissions : function(hidden, permissions) {
    if (gSlash == "\\") {                                                                       // msdos
      var returnString = "";

      if (permissions == 438) {                                                                 // Normal file  (666 in octal)
        returnString = gStrbundle.getString("normalFile");
      } else if (permissions == 511) {                                                          // Executable file (777 in octal)
        returnString = gStrbundle.getString("executableFile");
      } else if (permissions == 292) {                                                          // Read-only (444 in octal)
        returnString = gStrbundle.getString("readOnlyFile");
      } else if (permissions == 365) {                                                          // Read-only and executable (555 in octal)
        returnString = gStrbundle.getString("readOnlyExecutableFile");
      } else {
        returnString = " ";
      }

      if (hidden) {
        returnString += gStrbundle.getString("hiddenFile");
      }

      return returnString;
    } else {
      permissions           = permissions.toString(8);

      if (permissions.length > 4) {
        permissions         = permissions.substring(permissions.length - 4);
        gMac                = true;
      } else {
        gMac                = false;        
      }

      permissions           = parseInt(permissions, 8);
      var binary            = permissions.toString(2);
      var permissionsString = "";

      for (var x = 0; x < 9; x += 3) {
        permissionsString += binary.charAt(0 + x) == "1" ? "r" : "-";
        permissionsString += binary.charAt(1 + x) == "1" ? "w" : "-";
        permissionsString += binary.charAt(2 + x) == "1" ? "x" : "-";
      }

      return permissionsString;
    }
  },

  getFileIcon : function(row) {
    if (this.data[row].isDirectory() || this.data[row].isSymlink()) {
      return "";
    }

    var fileURI = gIos.newFileURI(this.data[row]);
    return "moz-icon://" + fileURI.spec + "?size=16";                                           // thanks to alex sirota!
  },

  // ************************************************** refresh *******************************************************

  refresh : function(skipLocalTree) {
    if (localDirTree.data[localDirTree.selection.currentIndex].open) {                          // if localDirTree is open
      localDirTree.toggleOpenState(localDirTree.selection.currentIndex);                        // close it up
      localDirTree.data[localDirTree.selection.currentIndex].children = null;                   // reset its children
      localDirTree.toggleOpenState(localDirTree.selection.currentIndex);                        // and open it up again
    } else {
      localDirTree.data[localDirTree.selection.currentIndex].empty    = false;                  // not empty anymore
      localDirTree.data[localDirTree.selection.currentIndex].children = null;                   // reset its children
      localDirTree.treebox.invalidateRow(localDirTree.selection.currentIndex);
    }

    if (!skipLocalTree) {
      setTimeout("localTree.updateView()", 1000);                                               // update localTree, after a little bit
    }
  },

  // ****************************************************** file functions ***************************************************

  constructPath : function(parent, leafName) {
    return parent + (parent.charAt(parent.length - 1) != gSlash ? gSlash : '') + leafName;
  },

  launch : function() {
    if (this.selection.count == 0) {
      return;
    }

    for (var x = 0; x < this.rowCount; ++x) {
      if (this.selection.isSelected(x)) {
        if (!localFile.verifyExists(this.data[x])) {
          continue;
        }

        localFile.launch(this.data[x]);
      }
    }
  },

  openContainingFolder : function() {
    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount || !localFile.verifyExists(this.data[this.selection.currentIndex].parent)) {
      return;
    }

    localDirTree.changeDir(this.data[this.selection.currentIndex].parent.path);
  },

  extract : function(toFolder) {
    if (this.selection.count == 0) {
      return;
    }

    for (var x = 0; x < this.rowCount; ++x) {
      if (this.selection.isSelected(x)) {
        if (!localFile.verifyExists(this.data[x])) {
          continue;
        }

        this.extractHelper(toFolder, this.data[x]);
      }
    }
  },

  extractHelper : function(toFolder, file) {                                                    // code modified from
    try {                                                                                       // http://xulfr.org/wiki/RessourcesLibs/lireExtraireZip
      var zip = Components.classes["@mozilla.org/libjar/zip-reader;1"].createInstance(Components.interfaces.nsIZipReader);
      zip.init(file);
      zip.open();

      var leafNameNoExt = file.leafName.lastIndexOf(".") != -1 ? file.leafName.substring(0, file.leafName.lastIndexOf("."))
                                                               : file.leafName;
      var localParent   = toFolder ? localTree.constructPath(file.parent.path, leafNameNoExt) : file.parent.path;
      var folder        = localFile.init(localParent);

      if (!folder.exists()) {
        folder.create(Components.interfaces.nsILocalFile.DIRECTORY_TYPE, 0755);
      }

      var prompt  = true;
      var skipAll = false;

      var entries = zip.findEntries("*");

      while (entries.hasMoreElements()) {
        var entry      = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
        var destFolder = localFile.init(localParent);
        var entrySplit = entry.name.split('/');

        for (var x = 0; x < entrySplit.length; ++x) {
          if (x == entrySplit.length - 1 && entrySplit[x].length != 0) {
            destFolder.append(entrySplit[x]);

            if (destFolder.exists() && skipAll) {
              break;
            }

            if (destFolder.exists() && prompt) {                                                // ask nicely
              var params = { response         : 0,
                             fileName         : destFolder.path,
                             resume           : true,
                             replaceResume    : true,
                             existingSize     : destFolder.fileSize,
                             existingDate     : "",
                             newSize          : entry.realSize,
                             newDate          : "",
                             timerEnable      : false };

              window.openDialog("chrome://fireftp/content/confirmFile.xul", "confirmFile", "chrome,modal,dialog,resizable,centerscreen", params);

              if (params.response == 2) {
                prompt = false;
              } else if (params.response == 3) {
                break;
              } else if (params.response == 4 || params.response == 0) {
                return;
              } else if (params.response == 5) {
                skipAll = true;
                break;
              }
            }

            zip.extract(entry.name, destFolder);
            break;
          }

          destFolder.append(entrySplit[x]);

          try {
            if (!destFolder.exists()) {
              destFolder.create(Components.interfaces.nsILocalFile.DIRECTORY_TYPE, 0755);
            }
          } catch (ex) { }
        }
      }

      zip.close();
      localTree.refresh();
    } catch (ex) {
      error(gStrbundle.getString("errorExtract"));
      debug(ex);
    }
  },

  create : function(isDir) {
    if (this.searchMode == 2) {
      return;
    }

    if (localFile.create(isDir)) {
      localTree.refresh();
    }
  },

  remove : function() {
    if (this.selection.count == 0) {
      return;
    }

    var prompt = true;

    for (var x = 0; x < this.rowCount; ++x) {
      if (this.selection.isSelected(x)) {
        if (!localFile.verifyExists(this.data[x])) {
          continue;
        }

        if (!localFile.remove(this.data[x], prompt, this.selection.count)) {
          break;
        }

        prompt = false;
      }
    }

    localTree.refresh();
  },

  rename : function() {
    if (this.rowCount > 0 && this.selection.count > 0) {
      if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
        this.selection.currentIndex = this.rowCount - 1;
      }

      if (!localFile.verifyExists(this.data[this.selection.currentIndex])) {
        return;
      }

      if (localFile.rename(this.data[this.selection.currentIndex])) {
        localTree.refresh();
      }
    }
  },

  showProperties : function(recursive) {
    if (this.rowCount > 0 && this.selection.count > 0) {
      if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
        this.selection.currentIndex = this.rowCount - 1;
      }

      if (this.selection.count > 1) {                                                           // multiple files
        var recursiveFolderData = { type: "local", nFolders: 0, nFiles: 0, nSize: 0 };

        for (var x = 0; x < this.rowCount; ++x) {
          if (this.selection.isSelected(x)) {
            if (!localFile.verifyExists(this.data[x])) {
              continue;
            }

            if (this.data[x].isDirectory()) {
              ++recursiveFolderData.nFolders;

              if (recursive) {
                this.getRecursiveFolderData(this.data[x], recursiveFolderData);
              }
            } else {
              ++recursiveFolderData.nFiles;
            }

            recursiveFolderData.nSize += this.data[x].fileSize;
          }
        }

        var params = { multipleFiles       : true,
                       recursiveFolderData : recursiveFolderData };

        window.openDialog("chrome://fireftp/content/properties.xul", "properties", "chrome,modal,dialog,resizable,centerscreen", params);

        return;
      }

      if (!localFile.verifyExists(this.data[this.selection.currentIndex])) {
        return;
      }

      if (localFile.showProperties(this.data[this.selection.currentIndex], recursive)) {
        localTree.refresh();
      }
    }
  },

  getRecursiveFolderData : function(dir, recursiveFolderData) {
    try {
      var entries = dir.directoryEntries;

      while (entries.hasMoreElements()) {
        var file = entries.getNext().QueryInterface(Components.interfaces.nsILocalFile);

        if (file.exists() && localFile.testSize(file) && (!file.isHidden() || gFtp.hiddenMode)) {
          if (file.isDirectory()) {
            ++recursiveFolderData.nFolders;
            this.getRecursiveFolderData(file, recursiveFolderData);
          } else {
            ++recursiveFolderData.nFiles;
          }

          recursiveFolderData.nSize += file.fileSize;
        }
      }
    } catch (ex) {
      return;                                                                                   // skip this directory
    }
  },

  // ************************************************* mouseEvent *****************************************************

  dblClick : function(event) {
    if (event.button != 0 || event.originalTarget.localName != "treechildren" || this.selection.count == 0) {
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    if (!localFile.verifyExists(this.data[this.selection.currentIndex])) {
      return;
    }

    if (this.data[this.selection.currentIndex].isDirectory()) {                                 // if it's a directory
      localDirTree.changeDir(this.data[this.selection.currentIndex].path);                      // navigate to it
    } else {
      new transfer().start(false);                                                              // else upload the file
    }
  },

  click : function(event) {
    if (event.button == 1 && !$('localPasteContext').disabled) {                                // middle-click paste
      this.paste();
    }
  },

  createContextMenu : function() {
    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    for (var x = $('openWithMenu').childNodes.length - 1; x >= 0; --x) {                      // clear out the menu
      $('openWithMenu').removeChild($('openWithMenu').childNodes.item(x));
    }

    $('localOpenCont').collapsed    =               this.searchMode != 2;
    $('localOpenContSep').collapsed =               this.searchMode != 2;
    $('localCutContext').setAttribute("disabled",   this.searchMode == 2);
    $('localCopyContext').setAttribute("disabled",  this.searchMode == 2);
    $('localPasteContext').setAttribute("disabled", this.searchMode == 2 || !this.pasteFiles.length);
    $('localCreateDir').setAttribute("disabled",    this.searchMode == 2);
    $('localCreateFile').setAttribute("disabled",   this.searchMode == 2);

    if (this.selection.currentIndex == -1) {
      return;
    }

    var hasDir = false;
    for (var x = 0; x < this.rowCount; ++x) {
      if (this.selection.isSelected(x)) {
        if (this.data[x].isDirectory()) {
          hasDir = true;
          break;
        }
      }
    }

    $('localRecursiveProperties').setAttribute("disabled", !hasDir);

    var extension = this.getExtension(this.data[this.selection.currentIndex].leafName);
    var item;
    var found     = false;

    var self = this;
    var contextMenuHelper = function(x, y) {
      found = true;
      var program = localFile.init(gPrograms[x].programs[y].executable);

      if (!program) {
        return;
      }

      var fileURI = gIos.newFileURI(program);
      item        = document.createElement("menuitem");
      item.setAttribute("class",     "menuitem-iconic");
      item.setAttribute("image",     "moz-icon://" + fileURI.spec + "?size=16");
      item.setAttribute("label",     gPrograms[x].programs[y].name);
      item.setAttribute("oncommand", "launchProgram(" + x + ", " + y + ", " + self.selection.currentIndex + ")");
      $('openWithMenu').appendChild(item);
    };

    for (var x = 0; x < gPrograms.length; ++x) {
      if (gPrograms[x].extension.toLowerCase() == extension.toLowerCase()) {
        for (var y = 0; y < gPrograms[x].programs.length; ++y) {
          contextMenuHelper(x, y);
        }

        break;
      }
    }

    for (var x = 0; x < gPrograms.length; ++x) {
      if (gPrograms[x].extension == "*.*") {
        for (var y = 0; y < gPrograms[x].programs.length; ++y) {
          contextMenuHelper(x, y);
        }

        break;
      }
    }

    if (found) {
      item = document.createElement("menuseparator");
      $('openWithMenu').appendChild(item);
    }

    item = document.createElement("menuitem");
    item.setAttribute("label", gStrbundle.getString("chooseProgram"));
    item.setAttribute("oncommand", "chooseProgram()");
    $('openWithMenu').appendChild(item);

    var isZippy = extension == "zip" || extension == "jar" || extension == "xpi";
    $('extractHereContext').collapsed = !isZippy;
    $('extractToContext').collapsed   = !isZippy;
  },

  mouseOver : function(event) {                                                                 // display local folder info
    if (this.rowCount) {
      $('statustxt').label = gStrbundle.getString("localListing") + " " + this.rowCount             + " "
                           + gStrbundle.getString("objects")      + (this.localSize < 0 ? "" : ", " + commas(this.localSize)) + ", "
                           + gStrbundle.getString("diskSpace")    + " " + this.localAvailableDiskSpace;
    } else {
      $('statustxt').label = gStrbundle.getString("localListingNoObjects");
    }
  },

  // ************************************************* keyEvent *****************************************************

  keyPress : function(event) {
    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    if (event.keyCode == 13 && this.selection.count != 0) {                                     // enter
      if (!localFile.verifyExists(this.data[this.selection.currentIndex])) {
        return;
      }

      if (this.selection.count == 1 && this.data[this.selection.currentIndex].isDirectory()) {  // if it's a directory
        localDirTree.changeDir(this.data[this.selection.currentIndex].path);                    // navigate to it
      } else {
        new transfer().start(false);                                                            // else upload a file
      }
    } else if (event.ctrlKey && (event.which == 65 || event.which == 97)) {
      event.preventDefault();                                                                   // ctrl-a: select all
      this.selection.selectAll();
    } else if (event.ctrlKey && event.which == 32 && this.selection.count != 0) {               // ctrl-space, select or deselect
      this.selection.toggleSelect(this.selection.currentIndex);
    } else if (event.keyCode  == 8) {                                                           // backspace
      event.preventDefault();
      localDirTree.cdup();
    } else if (event.keyCode  == 116) {                                                         // F5
      event.preventDefault();
      this.refresh();
    } else if (event.keyCode  == 113 && this.selection.count != 0) {                            // F2
      this.rename();
    } else if (event.charCode == 100 && event.ctrlKey) {                                        // ctrl-d
      event.preventDefault();
      this.create(true);
    } else if (event.charCode == 110 && event.ctrlKey) {                                        // ctrl-n
      event.preventDefault();
      this.create(false);
    } else if (event.keyCode  == 46 && this.selection.count != 0) {                             // del
      this.remove();
    } else if (event.keyCode  == 93) {                                                          // display context menu
      var x = {};    var y = {};    var width = {};    var height = {};
      this.treebox.getCoordsForCellItem(this.selection.currentIndex, this.treebox.columns["localname"], "text", x, y, width, height);
      this.createContextMenu();
      $('localmenu').showPopup(gLocalTreeChildren, gLocalTreeChildren.boxObject.x + 75, gLocalTreeChildren.boxObject.y + y.value + 5, "context");
    } else if (event.charCode == 112 && event.ctrlKey && this.selection.count != 0) {           // ctrl-p
      event.preventDefault();
      this.showProperties(false);
    } else if (event.charCode == 120 && event.ctrlKey && this.selection.count != 0) {           // ctrl-x
      event.preventDefault();
      this.cut();
    } else if (event.charCode == 99 &&  event.ctrlKey && this.selection.count != 0) {           // ctrl-c
      event.preventDefault();
      this.copy();
    } else if (event.charCode == 118 && event.ctrlKey) {                                        // ctrl-v
      event.preventDefault();
      this.paste();
    } else if (event.charCode == 111 && event.ctrlKey) {                                        // ctrl-o
      event.preventDefault();
      this.launch();
    }
  },

  // ************************************************* cut, copy, paste *****************************************************

  isCut      : false,
  pasteFiles : new Array(),
  oldParent  : "",

  cut  : function() {
    this.copy(true);
  },

  copy : function(isCut) {
    if (this.searchMode == 2) {
      return;
    }

    if (this.selection.count == 0) {
      return;
    }

    this.isCut      = isCut;
    this.pasteFiles = new Array();
    this.oldParent  = gLocalPath.value;

    for (var x = 0; x < this.rowCount; ++x) {                                                   // put files to be cut/copied in an array to be pasted
      if (this.selection.isSelected(x)) {
        if (localFile.verifyExists(this.data[x])) {
          this.pasteFiles.push(this.data[x]);
        }
      }
    }

    $('localPasteContext').setAttribute("disabled", false);                                     // enable pasting
  },

  paste : function(dest) {
    if (this.searchMode == 2) {
      return;
    }

    if (this.pasteFiles.length == 0) {
      return;
    }

    var newParent = dest ? dest : gLocalPath.value;

    if (!localFile.verifyExists(this.pasteFiles[0])) {
      return;
    }

    for (var x = 0; x < this.pasteFiles.length; ++x) {
      var newParentSlash = newParent               + (newParent.charAt(newParent.length - 1)                             != gSlash ? gSlash : '');
      var pasteFileSlash = this.pasteFiles[x].path + (this.pasteFiles[x].path.charAt(this.pasteFiles[x].path.length - 1) != gSlash ? gSlash : '');

      if (this.pasteFiles[x].isDirectory() && newParentSlash.indexOf(pasteFileSlash) == 0) {    // can't copy into a subdirectory of itself
        doAlert(gStrbundle.getString("copySubdirectory"));
        return;
      }
    }

    var prompt     = true;
    var skipAll    = false;
    var anyFolders = false;

    try {
      var newDir = localFile.init(newParent);

      for (var x = 0; x < this.pasteFiles.length; ++x) {
        if (!localFile.verifyExists(this.pasteFiles[x])) {
          continue;
        }

        if (this.pasteFiles[x].isDirectory()) {
          anyFolders = true;
        }

        var newFile = localFile.init(this.constructPath(newDir.path, this.pasteFiles[x].leafName));

        if (newFile.exists() && skipAll) {
          continue;
        }

        if (newFile.exists() && (newFile.isDirectory() || this.pasteFiles[x].isDirectory())) {
          error(gStrbundle.getString("pasteErrorFile") + " '" + this.pasteFiles[x].path + "'.");
          continue;
        }

        if (newFile.exists() && prompt) {                                                       // ask nicely
          var params = { response         : 0,
                         fileName         : newFile.path,
                         resume           : true,
                         replaceResume    : true,
                         existingSize     : newFile.fileSize,
                         existingDate     : newFile.lastModifiedTime,
                         newSize          : this.pasteFiles[x].fileSize,
                         newDate          : this.pasteFiles[x].lastModifiedTime,
                         timerEnable      : false };

          window.openDialog("chrome://fireftp/content/confirmFile.xul", "confirmFile", "chrome,modal,dialog,resizable,centerscreen", params);

          if (params.response == 2) {
            prompt = false;
          } else if (params.response == 3) {
            continue;
          } else if (params.response == 4 || params.response == 0) {
            return;
          } else if (params.response == 5) {
            skipAll = true;
            continue;
          }
        }

        if (newFile.exists()) {
          newFile.remove(true);
        }

        if (this.isCut) {
          this.pasteFiles[x].moveTo(newDir, null);                                              // cut
        } else {
          this.pasteFiles[x].copyTo(newDir, null);                                              // or copy
        }
      }
    } catch (ex) {
      debug(ex);
      error(gStrbundle.getString("pasteError"));
    }

    if (this.isCut && anyFolders) {
      var refreshIndex = dest ? localDirTree.indexOfPath(newParent) : localDirTree.indexOfPath(this.oldParent);

      if (refreshIndex != -1) {
        if (localDirTree.data[refreshIndex].open) {
          localDirTree.toggleOpenState(refreshIndex, true);                                       // close it up
          localDirTree.data[refreshIndex].children = null;                                        // reset its children
          localDirTree.toggleOpenState(refreshIndex);                                             // and open it up again
        } else {
          localDirTree.data[refreshIndex].children = null;                                        // reset its children
          localDirTree.data[refreshIndex].empty    = false;
          localDirTree.treebox.invalidateRow(refreshIndex);
        }

        var refreshIndex2 = dest ? localDirTree.indexOfPath(this.oldParent) : localDirTree.indexOfPath(newParent);

        if (refreshIndex2 == -1) {
          localDirTree.changeDir(dest ? this.oldParent : newParent);
        } else {
          localDirTree.selection.select(refreshIndex2);
        }
      } else {
        localDirTree.addDirtyList(dest ? newParent : this.oldParent);
      }
    }

    if (this.isCut) {
      this.pasteFiles  = new Array();
      this.isCut       = false;
      $('localPasteContext').setAttribute("disabled", true);
    }

    this.refresh();
  },

  canDrop : function(index, orient) {
    if (index == -1 || !this.data[index].isDirectory() || !dragObserver.origin || dragObserver.origin == "external") {
      return false;
    }

    if (dragObserver.origin == 'localtreechildren') {                                           // don't drag onto itself
      for (var x = 0; x < this.rowCount; ++x) {
        if (this.selection.isSelected(x) && index == x) {
          return false;
        }
      }
    }

    if (dragObserver.origin.indexOf('remote') != -1 && !gFtp.isConnected) {
      return false;
    }

    return true;
  },

  drop : function(index, orient) {
    if (dragObserver.origin == 'localtreechildren') {
      this.cut();
      this.paste(this.data[index].path);
    } else if (dragObserver.origin == 'remotetreechildren') {
      if (!dragObserver.overName || index == -1 || !this.data[index].isDirectory()) {
        new transfer().start(true);
      } else {
        var transferObj          = new transfer();
        transferObj.localRefresh = gLocalPath.value;
        transferObj.start(true,  '', this.data[index].path, '');
      }
    }
  }
};
