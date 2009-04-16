var gArgs;

function init() {
  gArgs      = window.arguments[0];

  $('file').value = $('file').value + gArgs.remoteFile.path;
}

function upload() {
  gArgs.callback();
}
