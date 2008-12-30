# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Mozilla Firefox Help Viewer Source Code.
#
# The Initial Developer of the Original Code is
# R.J. Keller <rlk@trfenv.com>
# Portions created by the Initial Developer are Copyright (C) 2003-2004
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK ***** */
<?xml version="1.0" encoding="ISO-8859-1"?>
<?xml-stylesheet type="text/css" href="helpFileLayout.css"?>

<!DOCTYPE stylesheet [
    <!ENTITY % helpDocDTD SYSTEM "helpDoc.dtd" >
    %helpDocDTD;
]>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output xsl:method="html" xsl:indent="yes" xsl:version="1.1"/>

<xsl:template match="/">
  <html>
  <head>
    <title><xsl:value-of select="article/artheader/title"/></title>
    <link rel="stylesheet" type="text/css" href="helpFileLayout.css"/>
  <script type="text/javascript">
  <![CDATA[
  var paragraphs;
  
# toggles the visibility of section "item". Also changes the plus sign shown to minus sign
# and vice versa depending on the items visiblity.
  function changeVisibility(item, plus)
  {
    var divsToHide = document.getElementById(item).getElementsByTagName("*");
    var currentVisibility = divsToHide.item(2).getAttribute("style");
    var currentImgSrc = document.getElementById(plus).getAttribute("src");

    document.getElementById(plus).setAttribute("src", (currentImgSrc == "chrome://global/skin/tree/twisty-clsd.gif") ? "chrome://global/skin/tree/twisty-open.gif" : "chrome://global/skin/tree/twisty-clsd.gif");

    for (var i = 2; i < divsToHide.length; i++)
      if (currentVisibility == "display: none;")
        divsToHide.item(i).removeAttribute("style");
      else
        divsToHide.item(i).setAttribute("style", "display:none;");

  }

# Takes in a String and returns that string with the spaces replaced with underscoes and
# in all lowercase.
  function spacesToUnderscores(str)
  {
    if (!str) return null;
    
    var newStr = "";
    for (var i = 0; i < str.length; i++)
    {
      var curChar = str.substring(i, i+1);
      if (curChar == " ")
        newStr += "_"
      else
        newStr += curChar.toLowerCase();
    }
    return newStr;
  }
  
# Takes in an element("title") and runs spacesToUnderscores(str) on all the elements
# inside of "title".
#
# You can use the attr parameter to change the attribute to something other than ID
# (such as href for hyperlinks).
  function initalizeIDs(title, attr)
  {
    var attribute = !attr ? "id" : attr;
    for (var i = 0; i < document.getElementsByTagName(title).length; i++)
    {
      var curItem = document.getElementsByTagName(title).item(i);
      var curId = curItem.getAttribute(attribute);
      var newId = spacesToUnderscores(curId);
      if (newId)
        curItem.setAttribute(attribute, newId);
    }
  }
  ]]>
  </script>
  </head>
# set all the IDs and hyperlinks in the document to not have spaces or capital letters.
  <body onload="initalizeIDs('h2');initalizeIDs('h3');initalizeIDs('img');initalizeIDs('div');initalizeIDs('a', 'href');">

  <h1 id="top"><xsl:value-of select="article/artheader/title"/></h1>
  
  <xsl:for-each select="article/artheader/para">
    <p><xsl:copy-of select="."/></p>
  </xsl:for-each>
  
  <div class="contentsBox">In this section:
    <ul>
    <xsl:for-each select="article/sect1">
      <li><a href="#{title}"><xsl:value-of select="title"/></a></li>
      <xsl:for-each select="sect2">
      
      </xsl:for-each>
    </xsl:for-each>
    </ul>
  </div>

  <xsl:for-each select="article">
    <xsl:apply-templates/>
  </xsl:for-each>

  <div class="contentsBox"><em>Copyright (C) <xsl:copy-of select="article/artheader/copyright/year"/> <xsl:copy-of select="article/artheader/copyright/holder"/></em></div>
  <p><xsl:copy-of select="helpFile/copyright"/></p>
  </body>
  </html>
</xsl:template>

# Create a hiderDiv element so that we can run this through the changeVisibility function when the
# user requests a collapse in the help content.
<xsl:template match="sect1">
  <div id="hiderDiv{title}">
    <xsl:apply-templates/>
  </div>
</xsl:template>

# Adds the title along with a plus sign to collapse/expand the help topic.
<xsl:template match="sect1/title">
  <h2 id="{.}"><img class="plus" id="plus{.}" onclick="changeVisibility(spacesToUnderscores('hiderDiv{.}'), spacesToUnderscores('plus{.}'));" src="chrome://global/skin/tree/twisty-open.gif"/><xsl:value-of select="."/></h2>
</xsl:template>

<xsl:template match="sect2">
  <div id="hiderDiv{title}">
    <xsl:apply-templates/>
  </div>
</xsl:template>

# see sect1/title
<xsl:template match="sect2/title">
  <h3 id="{.}"><img class="plus" id="plus{.}" onclick="changeVisibility(spacesToUnderscores('hiderDiv{.}'), spacesToUnderscores('plus{.}'));" src="chrome://global/skin/tree/twisty-open.gif"/><xsl:value-of select="."/></h3>
</xsl:template>

<xsl:template match="para">
  <p><xsl:copy-of select="."/></p>
</xsl:template>

<xsl:template match="graphic">
  <p><img src="{@fileref}" width="{@width}" height="{@height}" alt=""/></p>
</xsl:template>

# Creates a hyperlink for the text of this element. Note that although the code using the section
# attribute as the ID to where to go to in the document, the initializeIDs function called in the
# body's onload event will change it to the appropriate topic, so you can use the exact title name
# (with spaces) if you wish.
<xsl:template match="link">
  <a href="{@location}#{@sect}"><xsl:copy-of select="."/></a>
</xsl:template>

<xsl:template match="indexEntry">
  <a name="{@sect}"/>
</xsl:template>
</xsl:stylesheet>
