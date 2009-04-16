const classes             = Components.classes;
const interfaces          = Components.interfaces;
const nsILocalFile        = interfaces.nsILocalFile;

function GetLocalFileFromURLSpec(url)
{
  return GetFileFromURLSpec(url).QueryInterface(nsILocalFile);
}

function GetFileFromURLSpec(url)
{
  var fileHandler = GetFileProtocolHandler();
  return fileHandler.getFileFromURLSpec(url);
}

function OpenLocalDirectory(aUrl, aRQdata)
{
  EnableAllUI(false);

  var localFile = GetLocalFileFromURLSpec(aUrl);

  var dirEntries = localFile.directoryEntries;
  var directoryEntries = new Array();
  var fileEntries      = new Array();
  while (dirEntries.hasMoreElements())
  {
    var fileEntry = dirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);
    AddLocalDirSubdirs(aUrl, fileEntry, aRQdata, directoryEntries, fileEntries);
  }

  AddLocalDirsAndSubdirs(directoryEntries, fileEntries)

  var n = EndFtpRequest(aRQdata);

  gDialog.SiteTree.treeBoxObject.invalidateRow(aRQdata.parentRow);

  EnableAllUI(true);
}


function AddLocalDirSubdirs(aUrl, aDirEntry, aRQdata, aDirectoryEntries, aFileEntries)
{
  var name = aDirEntry.leafName;
  if (aDirEntry.isDirectory())
    aDirectoryEntries.push( { name:name, url:aUrl, entry:aDirEntry, data:aRQdata } );
  else
    aFileEntries.push( { name:name, url:aUrl, entry:aDirEntry, data:aRQdata } );
}

function AddLocalDirsAndSubdirs(aDirectoryEntries, aFileEntries)
{

#ifndef WIN_XP
  // on Windows, files are automatically sorted...

  function compare(a, b)
  {
    if (a.name > b.name)
      return +1;
    else if (a.name == b.name)
      return 0;
    return -1;
  }

  aDirectoryEntries.sort( compare );
  aFileEntries.sort( compare );
#endif
  var entries = aDirectoryEntries.concat(aFileEntries);

  for (var i=0; i<entries.length; i++)
  {
    var name = entries[i].entry.leafName;
    var path = entries[i].url + "/" + name;
    var size = entries[i].entry.fileSize;
    var lastModifiedDate = new Date(entries[i].entry.lastModifiedTime);

    gTreeView.addRow(entries[i].data,
                     name,
                     path,
                     size,
                     lastModifiedDate,
                     entries[i].entry.isDirectory(),
                     false,
                     false,
                     entries[i].entry.isSymlink(),
                     entries[i].data.level,
                     false);
  }
}
