var gStrbundle;
var gArgs;
var gMonths;

function init() {
  gStrbundle = $("strings");
  gMonths    = gStrbundle.getString("months").split("|");
  gArgs      = window.arguments[0];
  var edate  = new Date(gArgs.existingDate);
  var ndate  = new Date(gArgs.newDate);

  $('question').value = gStrbundle.getString("confirmFile") + " '" + gArgs.fileName + "' " + gStrbundle.getString("confirmFile2");
  $('esize').value    = parseSize(gArgs.existingSize);
  $('nsize').value    = parseSize(gArgs.newSize);
  $('edate').value    = gArgs.existingDate ? gMonths[edate.getMonth()] + ' ' + edate.getDate() + ' ' + edate.getFullYear() + ' ' + edate.toLocaleTimeString() : "                        ";
  $('ndate').value    = gArgs.newDate      ? gMonths[ndate.getMonth()] + ' ' + ndate.getDate() + ' ' + ndate.getFullYear() + ' ' + ndate.toLocaleTimeString() : "                        ";
  $('efileIcon').src  = "moz-icon://file:///" + gArgs.fileName + "?size=32";
  $('nfileIcon').src  = "moz-icon://file:///" + gArgs.fileName + "?size=32";
  $('skip').focus();

  if (gArgs.replaceResume) {
    $('resume').setAttribute("label",     gStrbundle.getString("cancelButton"));
    $('resume').setAttribute("accesskey", gStrbundle.getString("cancelAccess"));
  } else {
    $('resume').focus();
  }

  if (!gArgs.resume) {
    $('resume').disabled = true;
  }

  if (gArgs.timerEnable) {
    selfClose(15);
  }
}

function answer(value) {
  gArgs.response = value;
  close();
}

function selfClose(sec) {
  var defaultAction  = gStrbundle.getString(gArgs.resume && !gArgs.replaceResume ? "resumeButton" : "skipButton");
  $('timeout').value = gStrbundle.getString("timeout")  + " '" + defaultAction + "' "
                     + gStrbundle.getString("timeout2") + " "  + sec           + " "
                     + gStrbundle.getString("seconds");

  if (!sec) {
    answer(gArgs.resume && !gArgs.replaceResume ? 4 : 3);
    return;
  }

  setTimeout("selfClose(" + (sec - 1) + ")", 1000);
}
