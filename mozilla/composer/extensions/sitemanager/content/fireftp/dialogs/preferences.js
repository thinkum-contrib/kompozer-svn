function readPreferences() {
  window.sizeToContent();
  portChange();
  timeoutChange();
  filemodeChange();
  integrateChange();
  activePortChange();
}

function doNetworkCheck() {
  var seconds = parseInt($('network').value);

  if (!seconds || seconds < 1 || seconds > 600) {
    $('networkpref').value = 30;
  }
}

function doRetryCheck() {
  var seconds = parseInt($('retry').value);

  if (!seconds || seconds < 1 || seconds > 600) {
    $('retrypref').value = 10;
  }
}

function doAttemptsCheck() {
  var seconds = parseInt($('attempts').value);

  if (!seconds || seconds < 1) {
    $('attempts').value = 40;
  }
}

function doProxyPortCheck() {
  var seconds = parseInt($('proxyport').value);

  if (!seconds || seconds < 1) {
    $('proxyport').value = 1;
  } else if (seconds > 65535) {
    $('proxyport').value = 65535;
  }
}

function portChange() {
  $('proxyhost').disabled      =  $('proxytype').value == "";
  $('proxyport').disabled      =  $('proxytype').value == "";
  $('proxyhostlabel').disabled =  $('proxytype').value == "";
  $('proxyportlabel').disabled =  $('proxytype').value == "";
}

function timeoutChange() {
  $('retrylabel').disabled     = !$('timeoutmode').checked;
  $('retry').disabled          = !$('timeoutmode').checked;
  $('attemptslabel').disabled  = !$('timeoutmode').checked;
  $('attempts').disabled       = !$('timeoutmode').checked;
}

function filemodeChange() {
  $('asciibutton').disabled    =  $('filemode').value != 0;
}

function integrateChange() {
  $('temppasvmode').disabled   = !$('integrateftplinks').checked;
}

function activePortChange() {
  $('activelowportlabel').disabled  = !$('activeportmode').checked;
  $('activelowport').disabled       = !$('activeportmode').checked;
  $('activehighportlabel').disabled = !$('activeportmode').checked;
  $('activehighport').disabled      = !$('activeportmode').checked;
}

function doPortCheck() {
  var low  = parseInt($('activelowport').value);
  var high = parseInt($('activehighport').value);

  if (!low || low < 1) {
    $('activelowport').value = 1;
  } else if (low > 65535) {
    $('activelowport').value = 1;
  }

  if (!high || high < 1) {
    $('activehighport').value = 65535;
  } else if (high > 65535) {
    $('activehighport').value = 65535;
  }

  if ($('activelowport').value > $('activehighport').value) {
    var temp                  = $('activelowport').value;
    $('activelowport').value  = $('activehighport').value;
    $('activehighport').value = temp;
  }
}
