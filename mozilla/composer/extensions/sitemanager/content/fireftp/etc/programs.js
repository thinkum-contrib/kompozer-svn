function loadPrograms() {
  try {
    var file = gProfileDir.clone();
    file.append("fireFTPprograms.dat");

    if (file.exists()) {
      var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
      var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
      fstream.init(file, 1, 0, false);
      sstream.init(fstream);

      var programData = "";
      var str = sstream.read(-1);

      while (str.length > 0) {
        programData += str;
        str          = sstream.read(-1);
      }

      gPrograms = eval(programData);
      cleanupPrograms();

      sstream.close();
      fstream.close();
    } else {
      gPrograms = new Array({ extension: "*.*", programs: new Array() });
      savePrograms();
    }
  } catch (ex) {
    debug(ex);
  }
}

function savePrograms() {
  try {
    cleanupPrograms();
    var file = gProfileDir.clone();
    file.append("fireFTPprograms.dat");
    var foutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    foutstream.init(file, 0x04 | 0x08 | 0x20, 0644, 0);
    foutstream.write(gPrograms.toSource(), gPrograms.toSource().length);
    foutstream.close();
  } catch (ex) {
    debug(ex);
  }
}

function cleanupPrograms() {  // fix for bug with nulls in the program list
  for (var x = gPrograms.length - 1; x >= 0; --x) {
    if (!gPrograms[x]) {
      gPrograms.splice(x, 1);
      continue;
    }
    for (var y = gPrograms[x].programs.length - 1; y >= 0; --y) {
      if (!gPrograms[x].programs[y]) {
        gPrograms[x].programs.splice(y, 1);
      }
    }
  }
}

function chooseProgram() {
  var result       = { value: false };
  var extension    = localTree.getExtension(localTree.data[localTree.selection.currentIndex].leafName);
  var tempPrograms = { value: new Array(), extension: extension };

  for (var x = 0; x < gPrograms.length; ++x) {
    tempPrograms.value.push(gPrograms[x]);
  }

  window.openDialog("chrome://fireftp/content/programs.xul", "programs", "chrome,modal,dialog,resizable,centerscreen", tempPrograms, result);

  if (result.value) {
    gPrograms = tempPrograms.value;
    savePrograms();
  }
}

function launchProgram(extensionIndex, programIndex, fileIndex, file, remoteFile) {
  try {
    var program = localFile.init(gPrograms[extensionIndex].programs[programIndex].executable);
    var process = Components.classes['@mozilla.org/process/util;1'].getService(Components.interfaces.nsIProcess);
    process.init(program);
    var arguments = new Array();

    if (!gPrograms[extensionIndex].programs[programIndex].arguments) {
      arguments.push(file ? file.path : localTree.data[fileIndex].path);
    } else {
      var argumentString = gPrograms[extensionIndex].programs[programIndex].arguments;

      var quote = false;
      for (var x = 0; x < argumentString.length; ++x) {
        if (argumentString.charAt(x) == '"' || argumentString.charAt(x) == "'") {
          quote = !quote;
        } else if (argumentString.charAt(x) == ' ' && !quote) {
          argumentString = setCharAt(argumentString, x, "%%%space%%%");
        }
      }

      while (argumentString.indexOf("%file%") != -1) {
        argumentString = argumentString.substring(0, argumentString.indexOf("%file%"))
                       + (file ? file.path : localTree.data[fileIndex].path)
                       + argumentString.substring(argumentString.indexOf("%file%") + 6, argumentString.length);
      }

      argumentString = argumentString.replace(/\\"/g, "%%%quotes%%%");
      argumentString = argumentString.replace(/"/g, "");
      argumentString = argumentString.replace(/%%%quotes%%%/g, '"');
      arguments      = argumentString.split("%%%space%%%").filter(removeBlanks);
    }

    process.run(false, arguments, arguments.length, {});

    if (file) {
      editFile(file, remoteFile);
    }

  } catch (ex) {
    debug(ex);
  }
}

function editFile(file, remoteFile) {
  var callback = function() {
    var func = function() { editFile(file, remoteFile); };
    gFtp.remoteRefreshLater = gRemotePath.value;
    gFtp.upload(file.path, remoteFile.path, false, 0, func);
  }
  var params = { file       : file,
                 remoteFile : remoteFile,
                 callback   : callback };

  window.openDialog("chrome://fireftp/content/remoteEdit.xul", "remoteEdit", "chrome,dialog,resizable,centerscreen", params);
}

function remoteLaunchProgram(extensionIndex, programIndex, fileIndex) {
  if (!gFtp.isConnected || !gFtp.isReady) {
    return;
  }

  try {
    var file = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("TmpD", Components.interfaces.nsILocalFile);
    file.append(remoteTree.data[fileIndex].leafName);
    file.createUnique(Components.interfaces.nsILocalFile.NORMAL_FILE_TYPE, 0644);
    var remoteFile = remoteTree.data[fileIndex];

    var func = function() { launchProgram(extensionIndex, programIndex, -1, file, remoteFile); };
    gFtp.download(remoteFile.path, file.path, remoteFile.fileSize, false, 0, false, func);
  } catch (ex) {
    debug(ex);
  }
}
