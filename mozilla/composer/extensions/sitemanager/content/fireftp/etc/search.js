function showSearch(show) {
  $('searchToolbar').setAttribute("collapsed", !show);

  if (show) {
    $('searchFile').focus();
    $('searchFile').select();
  } else {
    if (localTree.searchMode) {
      localTree.updateView();
    }

    if (remoteTree.searchMode) {
      remoteTree.updateView();
    }
  }
}

function searchSelectType() {
  $('searchButton').disabled = $('searchWhich').selectedIndex == 1 && !gFtp.isConnected;
}

function searchWrapper() {
  if (gSearchRunning) {
    if (gSearchType && gSearchRecursive) {
      gFtp.abort();
    }

    gSearchRunning = false;
    $('searchFile').disabled = false;
    $('searchButton').label = gStrbundle.getString("search");
    $('searchFile').focus();
    return;
  }

  search();
}

function search(zeParent, last) {
  if (zeParent && !gSearchRunning) {
    return;
  }

  if (!zeParent) {
    if (!$('searchFile').value) {
      return;
    }

    gSearchFiles     = new Array();
    gSearchFound     = false;
    gSearchCallbacks = new Array();
    gSearchName      = $('searchFile').value;
    gSearchType      = $('searchWhich').selectedIndex;
    gSearchRecursive = $('searchSubdir').checked;
    gSearchMatchCase = $('searchMatchCase').checked;
    gSearchRegExp    = $('searchRegExp').checked;

    if (!gSearchRegExp) {
      gSearchName    = gSearchName.replace(/'/g, '"');

      var quote = false;
      for (var x = 0; x < gSearchName.length; ++x) {
        if (gSearchName.charAt(x) == '"') {
          quote = !quote;
        } else if (gSearchName.charAt(x) == ' ' && quote) {
          gSearchName = setCharAt(gSearchName, x, "/");
        } else if (gSearchName.charAt(x) == ',' && !quote) {
          gSearchName = setCharAt(gSearchName, x, " ");
        } else if (gSearchName.charAt(x) == '*' && !quote) {
          gSearchName = setCharAt(gSearchName, x, " ");
        }
      }

      gSearchName    = gSearchName.replace(/"/g, "");
      gSearchName    = gSearchName.split(" ").filter(removeBlanks);

      for (var x = 0; x < gSearchName.length; ++x) {
        gSearchName[x] = trim(gSearchName[x]).replace(/\//g, " ");
      }
    }
  }

  if (gSearchType && (!gFtp.isConnected || (!zeParent && !gFtp.isReady))) {
    return;
  }

  if (!zeParent) {
    if (!gSearchType && localTree.searchMode) {
      localTree.updateView();
    } else if (gSearchType && remoteTree.searchMode) {
      remoteTree.updateView();
    }
  }

  gSearchRunning = true;
  $('searchFile').removeAttribute("status");
  $('searchStatusIcon').removeAttribute("status");
  $('searchStatus').value = '';
  $('searchButton').focus();
  $('searchFile').disabled = true;
  $('searchButton').label  = gStrbundle.getString("searchStop");

  var files = new Array();

  if (zeParent) {
    if (gSearchType) {
      for (var x = 0; x < gFtp.listData.length; ++x) {
        files.push(gFtp.listData[x]);
      }
    } else {
      try {
        var dir     = localFile.init(zeParent);
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
    }
  } else {
    if (gSearchType) {
      for (var x = 0; x < remoteTree.data.length; ++x) {
        files.push(remoteTree.data[x]);
      }
    } else {
      for (var x = 0; x < localTree.data.length; ++x) {
        files.push(localTree.data[x]);
      }
    }
  }

  if (gSearchRecursive) {
    files.sort(compareName).reverse();
  }

  if (gSearchType && gSearchRecursive && !zeParent) {
    gFtp.beginCmdBatch();
  }

  var anyRecursion = false;
  var firstFolder  = true;
  var allMinus     = true;

  for (var y = 0; y < gSearchName.length; ++y) {
    if (gSearchName[y].charAt(0) != '-') {
      allMinus = false;
      break;
    }
  }

  for (var x = 0; x < files.length; ++x) {
    if (gSearchRegExp) {
      if (files[x].leafName.search(new RegExp(gSearchName, gSearchMatchCase ? "" : "i")) != -1) {
        gSearchFiles.push(files[x]);
      }
    } else {
      if (allMinus) {
        gSearchFiles.push(files[x]);
      }

      for (var y = 0; y < gSearchName.length; ++y) {
        if (gSearchName[y].charAt(0) == '-') {
          continue;
        }

        var searchTerm = gSearchName[y].charAt(0) == '+' ? gSearchName[y].substring(1) : gSearchName[y];

        if (!gSearchMatchCase && files[x].leafName.toLowerCase().indexOf(searchTerm.toLowerCase()) != -1) {
          gSearchFiles.push(files[x]);
          break;
        } else if (files[x].leafName.indexOf(searchTerm) != -1) {
          gSearchFiles.push(files[x]);
          break;
        }
      }
    }

    var exclude = false;
    if (!gSearchRegExp && gSearchRecursive && files[x].isDirectory()) {
      for (var y = 0; y < gSearchName.length; ++y) {
        if (gSearchName[y].charAt(0) != '-') {
          continue;
        }

        if (!gSearchMatchCase && files[x].leafName.toLowerCase().indexOf(gSearchName[y].substring(1).toLowerCase()) != -1) {
          exclude = true;
          break;
        } else if (files[x].leafName.indexOf(gSearchName[y].substring(1)) != -1) {
          exclude = true;
          break;
        }
      }
    }

    if (gSearchRecursive && files[x].isDirectory() && !exclude) {
      makeSearchCallback(files[x], (firstFolder && !zeParent) || last);
      last         = false;
      anyRecursion = true;
      firstFolder  = false;
    }
  }

  if (!gSearchRegExp) {
    for (var x = gSearchFiles.length - 1; x >= 0; --x) {
      for (var y = 0; y < gSearchName.length; ++y) {
        if (gSearchName[y].charAt(0) != '-') {
          continue;
        }

        if (!gSearchMatchCase && gSearchFiles[x].leafName.toLowerCase().indexOf(gSearchName[y].substring(1).toLowerCase()) != -1) {
          gSearchFiles.splice(x, 1);
          break;
        } else if (gSearchFiles[x].leafName.indexOf(gSearchName[y].substring(1)) != -1) {
          gSearchFiles.splice(x, 1);
          break;
        }
      }
    }

    for (var x = gSearchFiles.length - 1; x >= 0; --x) {
      for (var y = 0; y < gSearchName.length; ++y) {
        if (gSearchName[y].charAt(0) != '+') {
          continue;
        }

        if (!gSearchMatchCase && gSearchFiles[x].leafName.toLowerCase().indexOf(gSearchName[y].substring(1).toLowerCase()) == -1) {
          gSearchFiles.splice(x, 1);
          break;
        } else if (gSearchFiles[x].leafName.indexOf(gSearchName[y].substring(1)) == -1) {
          gSearchFiles.splice(x, 1);
          break;
        }
      }
    }
  }

  if (gSearchType && gSearchFiles.length) {
    remoteTree.updateView2(gSearchFiles);
    gSearchFound = true;
    gSearchFiles = new Array();
  }

  if (gSearchType && gSearchRecursive && !zeParent) {
    gFtp.endCmdBatch();
  }

  if (!last && !gSearchType && gSearchRecursive && !zeParent) {
    while (gSearchCallbacks.length) {
      var func = gSearchCallbacks[0];
      gSearchCallbacks.shift();
      func();
    }
  }

  if (!gSearchRecursive || last || (!anyRecursion && !zeParent)) {
    finalSearchCallback();
  }
}

function makeSearchCallback(file, last) {
  var func = function() {
    search(file.path, last);
  };

  if (gSearchType) {
    gFtp.list(file.path, func, true, true);
  } else {
    gSearchCallbacks.unshift(func);    
  }
}

function finalSearchCallback() {
  gSearchRunning = false;
  $('searchFile').disabled = false;
  $('searchFile').focus();
  $('searchButton').label = gStrbundle.getString("search");

  if (gSearchFiles.length == 0 && !gSearchFound) {
    $('searchFile').setAttribute("status",       "notfound");
    $('searchStatusIcon').setAttribute("status", "notfound");
    $('searchStatus').value = gStrbundle.getString("notFound");
    return;
  }

  if (gSearchType) {
    remoteTree.updateView2(gSearchFiles);
  } else {
    localTree.updateView(gSearchFiles);
  }
}

function removeBlanks(element, index, array) {
  return element;
}

function trim(str) {
  return str.replace(/^\s*/, "").replace(/\s*$/, "");
}
