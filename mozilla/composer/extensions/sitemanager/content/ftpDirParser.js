/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Nvu.
 *
 * The Initial Developer of the Original Code is
 * Linspire Inc..
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

//
// XXX WARNING: this is specific to Nvu.
// NOT WORKING with KompoZer 0.8 or Seamonkey Composer
//

const DI_CTRID              = "@mozilla.org/dirIndex;1";
const cnsIDirIndex          = Components.interfaces.nsIDirIndex;

const FILENAME_ENTRY        = 1;
const DESCRIPTION_ENTRY     = 2;
const CONTENT_LENGTH_ENTRY  = 3;
const LAST_MODIFIED_ENTRY   = 4;
const CONTENT_TYPE_ENTRY    = 5;
const FILE_TYPE_ENTRY       = 6;
const UNKNOWN_ENTRY         = 7;

const UNKNOWN_TOKEN         = 0;
const WS_TOKEN              = 1;
const EOL_TOKEN             = 2;

// PUBLIC
// this is the function you have to call to retrieve an FTP dir,
// parse its contents and feed it to a callback; requestData
// is your own data, the parser does not deal with it.
// the callback takes 3 parameters : a string for the URL,
// an nsIDirIndex and your requestData

function FTPDirParser(url, requestData,
                      entryCallback, endCallback, errorCallback)
{
  this.url            = url;
  this.callback       = entryCallback;
  this.rqData         = requestData;
  this.endCallback    = endCallback;
  this.errorCallback  = errorCallback;

  this.comment = "";

  this.dataIndex = 0;
  this.nextToken = UNKNOWN_TOKEN;

  loadURL(url, this);

}

// PUBLIC
// unescapes all %xx contained into a string
function ecmaUnescape(str)
{
    function replaceEscapes(seq)
    {
        var ary = seq.match(/([\da-f]{1,2})(.*)|u([\da-f]{1,4})/);
        if (!ary)
            return "<ERROR>";

        if (ary[1])
        {
            // two digit escape, possibly with cruft after
            rv = String.fromCharCode(parseInt(ary[1], 16)) + ary[2];
        }
        else
        {
            // four digits, no cruft
            rv = String.fromCharCode(parseInt(ary[3], 16));
        }

        return rv;
    };

    // Replace the escape sequences %X, %XX, %uX, %uXX, %uXXX, and %uXXXX with
    // the characters they represent, where X is a hexadecimal digit.
    // See section B.2.2 of ECMA-262 rev3 for more information.
    return str.replace(/%u?([\da-f]{1,4})/ig, replaceEscapes);
}


function UnEscape(s)
{
  var u = "", l = s.length, i;
  for (i = 0; i < l; i++)
  {
    var c = s[i];
    if (c == "%")
    {
      c = String.fromCharCode(Number("0x" + s.substr(i+1, 2)));
      i += 2;
    }
    u += c;
  }
  return u;
}

// PRIVATE
// parse the first 3 chars of a header line
// returns the header code if ok or 0

FTPDirParser.prototype.getHeaderToken =
function (data)
{
  if (this.dataIndex < data.length - 3)
  {
    var substr = data.substr(this.dataIndex, 3);

    if (data[this.dataIndex+3] == ":" &&
        (substr == "100" ||
         substr == "101" ||
         substr == "102" ||
         substr == "200" ||
         substr == "201" ||
         substr == "300" ||
         substr == "301"))
    {
      this.dataIndex += 4;
      return Number(substr);
    }
  }
  this.dataIndex++;
  return 0;
}

// PRIVATE
// skip whitespaces

FTPDirParser.prototype.skipWS =
function (data)
{
  while (this.dataIndex < data.length &&
         data[this.dataIndex] == " ")
    this.dataIndex++
}

// PRIVATE
// skip everything until end of line

FTPDirParser.prototype.skipEndOfLine =
function (data)
{
  while (this.dataIndex < data.length &&
         data[this.dataIndex] != "\r" &&
         data[this.dataIndex] != "\n")
    this.dataIndex++
  while (this.dataIndex < data.length && (
         data[this.dataIndex] == "\r" ||
         data[this.dataIndex] == "\n"))
    this.dataIndex++
}

// PRIVATE
// store everything until end of line into comment

FTPDirParser.prototype.getCommentLine =
function (data)
{
  this.skipWS(data);
  while (this.dataIndex < data.length &&
         data[this.dataIndex] != "\r" &&
         data[this.dataIndex] != "\n")
  {
    this.comment += data[this.dataIndex];
    this.dataIndex++;
  }
  this.skipEndOfLine(data);
} 

// PRIVATE
// parse a 200 line containing the format of 201 lines
// stores it into this.entries array

FTPDirParser.prototype.getFormat =
function (data)
{
  var token;

  // in case of multiple 200 lines, keep only last one...
  delete this.entries;
  this.entries = new Array();

  while (data[this.dataIndex] != "\r" &&
         data[this.dataIndex] != "\n")
  {
    this.skipWS(data);
    token = "";
    while (this.dataIndex < data.length &&
           data[this.dataIndex] != " " &&
           data[this.dataIndex] != "\r" &&
           data[this.dataIndex] != "\n")
    {
      token += data[this.dataIndex];
      this.dataIndex++;
    }
    token = token.toLowerCase();
    if (token == "filename")
      this.entries.push(FILENAME_ENTRY);
    else if (token == "description")
      this.entries.push(DESCRIPTION_ENTRY);
    else if (token == "content-length")
      this.entries.push(CONTENT_LENGTH_ENTRY);
    else if (token == "description")
      this.entries.push(LAST_MODIFIED_ENTRY);
    else if (token == "last-modified")
      this.entries.push(LAST_MODIFIED_ENTRY);
    else if (token == "content-type")
      this.entries.push(CONTENT_TYPE_ENTRY);
    else if (token == "file-type")
      this.entries.push(FILE_TYPE_ENTRY);
    else 
      this.entries.push(UNKNOWN_ENTRY);

  }
  this.skipEndOfLine(data);
}

// PRIVATE
// parse a 201 line according to a previously parsed 200 line
// returns an nsIDirIndex instance

FTPDirParser.prototype.getDataLine =
function (data)
{
  var numberFields = this.entries.length;
  var l = data.length;
  var i;
  var dirIndex = 
    Components.classes[DI_CTRID].createInstance(cnsIDirIndex);

  for (i = 0; i < numberFields; i++)
  {
    this.skipWS(data);
    var token = "";
    if (data[this.dataIndex] == '"')
    {
      this.dataIndex++;
      while (this.dataIndex < l &&
             data[this.dataIndex] != '"')
      {
        token += data[this.dataIndex];
        this.dataIndex++;
      }
      this.dataIndex++;
    }
    else
    {
      while (this.dataIndex < l &&
             data[this.dataIndex] != " ")
      {
        token += data[this.dataIndex];
        this.dataIndex++;
      }
    }

    switch (this.entries[i])
    {
      case FILENAME_ENTRY:
        dirIndex.location = UnEscape(token);
        break;
      case DESCRIPTION_ENTRY:
        // we do nothing here, we use the nsIDirIndex description attribute
        // for the last-modified date
        break;
      case CONTENT_LENGTH_ENTRY:
        dirIndex.size = Number(token);
        break;
      case LAST_MODIFIED_ENTRY:
        dirIndex.description = UnEscape(token);
        break;
      case CONTENT_TYPE_ENTRY:
        dirIndex.contentType = UnEscape(token);
        break;
      case FILE_TYPE_ENTRY:
        if (token == "FILE")
          dirIndex.type = cnsIDirIndex.TYPE_FILE;
        else if (token == "DIRECTORY")
          dirIndex.type = cnsIDirIndex.TYPE_DIRECTORY;
        else if (token == "SYMBOLIC-LINK")
          dirIndex.type = cnsIDirIndex.TYPE_SYMLINK;
        else
          dirIndex.type = cnsIDirIndex.TYPE_UNKNOWN; // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        break;
      default:
        break;      
    }
  }
  this.skipEndOfLine(data);
  return dirIndex;
}

// PRIVATE
// parses all the data coming from an async list of an FTP dir
// calls the provided callback on entries

FTPDirParser.prototype.parseData =
function (data, requestData)
{
   var token;
   while (this.dataIndex < data.length)
   {
     token = this.getHeaderToken(data);
     switch (token)
     {
     case 100:
     case 300:
       this.skipEndOfLine(data);
       break;
     case 101:
     case 102:
       this.getCommentLine(data);
       breal;
     case 200:
       this.getFormat(data);
       break;
     case 201:
       var dirEntry = this.getDataLine(data);

       if (this.callback)
       {
         this.callback(this.url, dirEntry, this.rqData);
       }
       break;
     default:
       // error, but are we supposed to run this?
       break
     }
   }
}

