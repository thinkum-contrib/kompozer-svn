function appendLog(message, css, type) {
  gLogQueue  += "<div type='" + type + "' style='display:" + (type != "error" && gLogErrorMode ? "none" : "block") + "' " + "class='" + css + "'>"
             +     message.replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>')
             +  "</div>";
}

function error(message, skipLog) {
  message = message.replace(/\r\n/g, ' ').replace(/\n/g, ' ');

  if (!skipLog) {
    appendLog(message, 'error', "error");
  }

  if (gErrorMode) {
    doAlert(message);
  }
}

function doAlert(msg, modal) {
  if (gAlertWindow) {
    try {
      if (gAlertWindow && !gAlertWindow.closed) {
        var func = function() { gAlertWindow.add(msg); };
        setTimeout(func, 0);
        return;
      }
    } catch (ex) { }
  }

  gAlertWindow = window.openDialog("chrome://fireftp/content/alert.xul", "alert", "chrome,dialog,resizable,centerscreen" + (modal ? ",modal" : ""), msg);
}

function onAlertClose() {
  gAlertWindow = null;
}

function detailedError(msg, url, linenumber) {
  if (gDebugMode) {
    error('Error message= ' + msg + '\nURL= ' + url + '\nLine Number= ' + linenumber, false);
  }
}

function debug(ex, level) {
  if (gDebugMode) {
    appendLog((level ? level : "Error") + ": " + (ex.stack ? (ex.message + '\n' + ex.stack) : ex), 'error', "debug");
  }
}

function showLog() {
  gPrefs.setBoolPref("logmode", !gLogMode);
}

function filter(display, type) {
  var nodeList = $('cmdlog').contentWindow.document.getElementsByTagName("div");

  for (var x = 0; x < nodeList.length; ++x) {
    if (nodeList.item(x).getAttribute("type") != type) {
      nodeList.item(x).style.display = display;
    }
  }
}

function showOnlyErrors() {
  filter("none",   "error");
}

function showAll() {
  filter("block", "error");
}

function checkLogMouseDown() {
  if ($('cmdlog').collapsed) {
    gPrefs.setBoolPref("logmode", true);
  }
}

function checkLogCollapsed() {
  gPrefs.setBoolPref("logmode", !$('cmdlog').collapsed);
}
