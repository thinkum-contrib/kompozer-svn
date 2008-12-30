var gCharset = "";
var gInitDone = false;

//Cancel() is in EdDialogCommon.js
// dialog initialization code
function Startup()
{
  if ("arguments" in window && window.arguments.length >= 1)
    gCharset = window.arguments[0];

  gDialog.charsetTree  = document.getElementById("charsetTree");
  gDialog.otherCharset = document.getElementById("charset.other");

  // Default string for new page is set from DTD string in XUL,
  //   so set only if not new doc URL
  var location = GetDocumentUrl();
  var lastmodString = GetString("Unknown");

  // install charsets
  var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  observerService.notifyObservers(null, "charsetmenu-selected", "other");

  InitDialog();

  SetTextboxFocus(gDialog.TitleInput);

  gInitDone = true;

  SetWindowLocation();
}

function InitDialog()
{
  if (gCharset)
  {
    var RDF = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
    var index = gDialog.charsetTree.builderView.getIndexOfResource(RDF.GetResource(gCharset));
    if (index >= 0) {
      //var treeBox = gDialog.charsetTree.treeBoxObject;
      var treeBox = gDialog.charsetTree.contentView;
      treeBox.selection.select(index);
      //treeBox.ensureRowIsVisible(index);
    }
  }
}

function SelectCharset()
{
  if(gInitDone) 
  {
    try 
	{
      gCharset = gDialog.charsetTree.builderView.getResourceAtIndex(gDialog.charsetTree.currentIndex).Value;
      gDialog.otherCharset.value = gCharset;
    }
    catch(e) {}
  }
}

function HandleDoubleClick(node)
{
  SetAvailableCharset();
  window.close();
}

function SetAvailableCharset()
{
  window.opener.SelectCharset(gCharset);
  SaveWindowLocation();
  return true;
}
