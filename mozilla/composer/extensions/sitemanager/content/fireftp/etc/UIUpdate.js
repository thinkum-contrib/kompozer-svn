window.setInterval("UIUpdate()", 1000);                                             // update once a second

function UIUpdate() {
  if (gLogQueue && gLogMode) {
    var scrollLog = gCmdlogBody.scrollTop + 50 >= gCmdlogBody.scrollHeight - gCmdlogBody.clientHeight;
    gCmdlogBody.innerHTML += gLogQueue;                                             // update log

    gLogQueue = "";

    var nodeList = gCmdlogDoc.getElementsByTagName("div");                          // don't keep too much log data or it will slow down things
    var count    = 0;
    while (nodeList.length > 200 + count) {
      if (nodeList.item(count).getAttribute("type") == 'error') {
        ++count;
      } else {
        gCmdlogBody.removeChild(nodeList.item(count));        
      }
    }

    if (scrollLog) {
      gCmdlogBody.scrollTop = gCmdlogBody.scrollHeight - gCmdlogBody.clientHeight;  // scroll to bottom
    }
  }

  var bytesTotal;                                                                   // update status bar
  var bytesTransferred;
  var bytesPartial;
  var timeStart;

  if (gFtp.dataSocket && gFtp.dataSocket.progressEventSink.bytesTotal) {
    bytesTotal       = gFtp.dataSocket.progressEventSink.bytesTotal;
    bytesTransferred = gFtp.dataSocket.progressEventSink.bytesUploaded;
    bytesPartial     = gFtp.dataSocket.progressEventSink.bytesPartial;
    timeStart        = gFtp.dataSocket.progressEventSink.timeStart;
  } else if (gFtp.dataSocket && gFtp.dataSocket.dataListener.bytesTotal) {
    bytesTotal       = gFtp.dataSocket.dataListener.bytesTotal;
    bytesTransferred = gFtp.dataSocket.dataListener.bytesDownloaded;
    bytesPartial     = gFtp.dataSocket.dataListener.bytesPartial;
    timeStart        = gFtp.dataSocket.dataListener.timeStart;
  }

  if (bytesTotal) {
    gStatusBarClear   = false;
    var timeElapsed   = ((new Date()) - timeStart) / 1000;
    timeElapsed       = timeElapsed != 0 ? timeElapsed : 1;                         // no dividing by 0
    var averageRate   = ((bytesTransferred - bytesPartial) / 1024 / timeElapsed).toFixed(2);
    averageRate       = averageRate != 0 ? averageRate : 0.1;                       // no dividing by 0
    var timeRemaining = (bytesTotal - bytesTransferred) / 1024 * (1 / averageRate);
    averageRate      += " KB/s";
    var filesleft     = bytesTransferred ? 1 : 0;

    for (var x = 0; x < gFtp.eventQueue.length; ++x) {
      if (gFtp.eventQueue[x].cmd == "RETR" || gFtp.eventQueue[x].cmd == "APPE" || gFtp.eventQueue[x].cmd == "STOR") {
        ++filesleft;
      }
    }

    gStatusBytes.label     = commas(bytesTransferred) + " / " + commas(bytesTotal) + ' - ' + filesleft + ' ' + gStrbundle.getString("filesleft");
    var hours              = parseInt( timeElapsed / 3600);
    var min                = parseInt((timeElapsed - hours * 3600) / 60);
    var sec                = parseInt( timeElapsed - hours * 3600 - min * 60);
    gStatusElapsed.label   = zeros(hours) + ":" + zeros(min) + ":" + zeros(sec);

    hours                  = parseInt( timeRemaining / 3600);
    min                    = parseInt((timeRemaining - hours * 3600) / 60);
    sec                    = parseInt( timeRemaining - hours * 3600 - min * 60);
    gStatusRemaining.label = zeros(hours) + ":" + zeros(min) + ":" + zeros(sec);

    gStatusRate.label      = averageRate;
    var total              = bytesTotal != 0 ? bytesTotal : 1;                      // no dividing by 0
    var progress           = parseInt(bytesTransferred / total * 100) + "%";
    gStatusMeter.setAttribute("mode", "determined");
    gStatusMeter.setAttribute("value", progress);
    document.title         = progress + " @ " + averageRate + " - " + (gAccount ? gAccount : gFtp.host) + " - FireFTP";

  } else {
    var filesleft = 0;                                                              // update status bar to list how many files are left
    var status    = "";

    for (var x = 0; x < gFtp.eventQueue.length; ++x) {
      if (gFtp.eventQueue[x].cmd == "RETR" || gFtp.eventQueue[x].cmd == "APPE" || gFtp.eventQueue[x].cmd == "STOR"
       || gFtp.eventQueue[x].cmd == "DELE" || gFtp.eventQueue[x].cmd == "RMD") {
        ++filesleft;
      }
    }

    if (filesleft) {
      status = gStrbundle.getString("working") + ' - ' + filesleft + ' ' + gStrbundle.getString("filesleft");
      gStatusMeter.setAttribute("mode", "undetermined");
      gStatusBarClear = false;
    } else if (gFtp.eventQueue.length) {
      status = gFtp.eventQueue[0].cmd == "welcome" ? gStrbundle.getString("connecting") : gStrbundle.getString("working");
      gStatusMeter.setAttribute("mode", "undetermined");
      gStatusBarClear = false;
    } else if (!gStatusBarClear) {
      gStatusMeter.setAttribute("mode", "determined");
      gStatusBarClear = true;
    } else if (gStatusBarClear && !gFtp.isReconnecting) {
      return;
    }

    if (!gFtp.isReconnecting && !gFtp.isConnected && !$('abortbutton').disabled) {
      $('abortbutton').disabled = true;
    }

    if (gFtp.isReconnecting) {
      if (gFtp.reconnectsLeft) {
        status = gStrbundle.getString("reconnect") + ' ' + gFtp.reconnectInterval + ' '
               + gStrbundle.getString("seconds")   + ' ' + gFtp.reconnectsLeft    + ' ' + gStrbundle.getString("attempts");
        gStatusMeter.setAttribute("mode", "undetermined");
      } else {
        status = "";
        gStatusMeter.setAttribute("mode", "determined");
      }
    }

    gStatusBytes.label = status;

    if (!gFtp.isConnected) {
      document.title = (gFtp.isReconnecting ? (status + " - ") : "") + "FireFTP";
      gStatusBarClear = false;
    } else {
      document.title = status + (status == "" ? "" : " - ") + (gAccount ? gAccount : gFtp.host) + " - FireFTP";
    }

    gStatusElapsed.label   = "";
    gStatusRemaining.label = "";
    gStatusRate.label      = "";
    gStatusMeter.setAttribute("value", "0%");
  }
}
