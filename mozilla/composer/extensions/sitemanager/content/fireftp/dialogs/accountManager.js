var gStrbundle;
var gAnonymous;
var gArgs;
var gSite;
var gSiteManager;
var gCallback;
var gCancelCallback;
var gAutoAccount = false;
var gOrigAccount;

function init() {
  gStrbundle                  = $("strings");
  gArgs                       = window.arguments[0];
  gSite                       = window.arguments[0].site;
  gOrigAccount                = window.arguments[0].site.account;
  gSiteManager                = window.arguments[0].siteManager;
  gCallback                   = window.arguments[0].callback;
  gCancelCallback             = window.arguments[0].cancelCallback;
  gAnonymous                  = gSite.anonymous;

  $('account').value          = gSite.account;
  $('host').value             = gSite.host;
  $('port').value             = gSite.port;
  $('login').value            = gSite.login;
  $('password').value         = gSite.password;
  $('anonymous').checked      = gAnonymous;
  $('login').disabled         = gAnonymous;
  $('password').disabled      = gAnonymous;
  $('security').value         = gSite.security || "";
  $('pasvmode').checked       = gSite.pasvmode;
  $('ipmode').checked         = gSite.ipmode;
  $('webhost').value          = gSite.webhost  || "";
  $('prefix').value           = gSite.prefix   || "";
  $('localdir').value         = gSite.localdir;
  $('remotedir').value        = gSite.remotedir;
  $('treesync').checked       = gSite.treesync;
  $('downloadcasemode').value = gSite.downloadcasemode;
  $('uploadcasemode').value   = gSite.uploadcasemode;
  $('encoding').setAttribute("label", gSite.encoding || "UTF-8");

  initialDirChange();

  $('host').focus();

  if (!$('account').value && !gArgs.quickConnect) {
    gAutoAccount = true;
  }

  if (gArgs.quickConnect) {                                // this is a QuickConnect, no data saved, put a Connect button in place of an Ok button
    $('accountrow').collapsed                      = true;
    $('accountManager4').getButton("accept").label = gStrbundle.getString("connectButton");
    document.title                                 = gStrbundle.getString("quickConnect");
  }
}

function autoAccount() {
  if (gAutoAccount) {
    $('account').value = $('host').value;
  }
}

function autoAccountDisable() {
  gAutoAccount = false;
}

function useCurrentLocal() {
  $('localdir').value  = gArgs.localPath;
  initialDirChange();
}

function useCurrentRemote() {
  $('remotedir').value = gArgs.remotePath;
  initialDirChange();
}

function anonymousChange() {
  gAnonymous             = !gAnonymous;
  $('login').disabled    =  gAnonymous;
  $('password').disabled =  gAnonymous;
  $('login').value       =  gAnonymous ? "anonymous"           : "";
  $('password').value    =  gAnonymous ? "fireftp@example.com" : "";
}

function initialDirChange() {
  $('treesync').disabled = !$('localdir').value || !$('remotedir').value;

  if ($('treesync').disabled) {
    $('treesync').checked = false;
  }
}

function onSecurityChange() {
  $('port').value = $('security').value == "ssl" ? 990 : 21;
}

function doPortCheck() {
  var port = parseInt($('port').value);

  if (!port || port < 1 || port > 65535) {
    $('port').value = 21;
  }
}

function createMenu(node) {
  var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  observerService.notifyObservers(null, "charsetmenu-selected", node);
}

function chooseCharset(event) {
  var node     = event.target;
  var fromUTF8 = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter);

  try {
    fromUTF8.charset = node.getAttribute('id');
    $('encoding').setAttribute("label", node.getAttribute('id'));
  } catch (ex) {
    $('encoding').setAttribute("label", "UTF-8");
  }
}

function doOk() {
  $('host').value = $('host').value.replace(/^http:\/*/, '');
  $('host').removeAttribute('missing');
  $('account').removeAttribute('missing');

  if ((!gArgs.quickConnect && $('account').value == "") || $('host').value == "") {
    $('tabbox').selectedIndex = 0;

    if ($('host').value == "") {
      $('host').setAttribute('missing', true);
      $('host').focus();
    }

    if (!gArgs.quickConnect && $('account').value == "") {
      $('account').setAttribute('missing', true);
      $('account').focus();
    }

    return false;
  }

  if (!gArgs.quickConnect && gOrigAccount != $('account').value) {
    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == $('account').value) {
        $('account').setAttribute('missing', true);
        $('account').select();
        alert(gStrbundle.getString("dupAccount"));
        return false;
      }
    }
  }

  gSite.account          = $('account').value;
  gSite.host             = $('host').value;
  gSite.port             = $('port').value;
  gSite.login            = $('login').value;
  gSite.password         = $('password').value;
  gSite.anonymous        = $('anonymous').checked;
  gSite.security         = $('security').value;
  gSite.pasvmode         = $('pasvmode').checked;
  gSite.ipmode           = $('ipmode').checked;
  gSite.webhost          = $('webhost').value;
  gSite.prefix           = $('prefix').value;
  gSite.localdir         = $('localdir').value;
  gSite.remotedir        = $('remotedir').value;
  gSite.treesync         = $('treesync').checked;
  gSite.downloadcasemode = $('downloadcasemode').value;
  gSite.uploadcasemode   = $('uploadcasemode').value;
  gSite.encoding         = $('encoding').getAttribute("label");

  gCallback(gSite);

  return true;
}

function doCancel() {
  if (gCancelCallback) {
    gCancelCallback();
  }

  return true;
}
