<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/css" href="helpFileLayout.css"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output xsl:method="html" xsl:indent="yes" xsl:version="1.1"/>

<xsl:template match="/">
  <html>
  <head>
    <link rel="stylesheet" type="text/css" href="chrome://help/skin/helpFileLayout.css"/>
    <title><xsl:value-of select="article/artheader/title"/></title>
  <script type="text/javascript">
  <![CDATA[
  var paragraphs;

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
  <body onload="initalizeIDs('h2');initalizeIDs('h3');initalizeIDs('img');initalizeIDs('div');initalizeIDs('a', 'href');">

  <h1 id="top"><xsl:value-of select="article/artheader/title"/></h1>
  
  <xsl:for-each select="article/artheader/para">
    <p><xsl:copy-of select="."/></p>
  </xsl:for-each>
  
  <div class="contentsBox">In this section:
    <ul>
    <xsl:for-each select="article/sect1">
      <li><a href="#{title}"><xsl:value-of select="title"/></a></li>
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

<xsl:template match="artheader"></xsl:template>

<xsl:template match="sect1">
  <div id="hiderDiv{title}">
    <xsl:apply-templates/>
  </div>
</xsl:template>

<xsl:template match="sect1/title">
  <h2 id="{.}"><xsl:value-of select="."/></h2>
</xsl:template>

<xsl:template match="sect2">
  <div id="hiderDiv{title}">
    <xsl:apply-templates/>
  </div>
</xsl:template>

<xsl:template match="table">
  <table width="{width}" cellpadding="3" style="border-collapse:collapse;border:1px solid black">
    <xsl:apply-templates/>
  </table>
</xsl:template>

<xsl:template match="thead">
  <thead style="background-color:#eeeeee"><xsl:apply-templates/></thead>
</xsl:template>

<xsl:template match="tbody">
  <tbody><xsl:apply-templates/></tbody>
</xsl:template>

<xsl:template match="row">
  <tr><xsl:apply-templates/></tr>
</xsl:template>

<xsl:template match="entry">
  <td><xsl:copy-of select="."/></td>
</xsl:template>

<xsl:template match="sect2/title">
  <h3 id="{.}"><img class="plus" id="plus{.}" onclick="changeVisibility(spacesToUnderscores('hiderDiv{.}'), spacesToUnderscores('plus{.}'));" src="chrome://global/skin/tree/twisty-open.gif"/><xsl:value-of select="."/></h3>
</xsl:template>

<xsl:template match="para">
  <p><xsl:copy-of select="."/></p>
</xsl:template>

<xsl:template match="graphic">
  <p><img src="{@fileref}" width="{@width}" height="{@height}" alt=""/></p>
</xsl:template>

<xsl:template match="link">
  <a href="{@location}#{@sect}"><xsl:copy-of select="."/></a>
</xsl:template>

<xsl:template match="itemizedlist">
  <ol>
    <xsl:apply-templates/>
  </ol>
</xsl:template>

<xsl:template match="listitem">
  <li><xsl:copy-of select="."/></li>
</xsl:template>

<xsl:template match="indexEntry">
  <a name="{@sect}"/>
</xsl:template>
</xsl:stylesheet>
