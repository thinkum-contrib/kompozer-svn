<script type="text/javascript">
var isDisplayed = true;

function togglePanel() {
  isDisplayed = !isDisplayed;
  var displayValue = isDisplayed ? "display: block" : "display: none";
  var bodyValue = isDisplayed ? "margin-left: 175px" : "margin-left:5px";

  document.getElementById("contentsBox").setAttribute("style", displayValue);
  document.getElementsByTagName("body").item(0).setAttribute("style", bodyValue);
}
</script>

<table width="100%" id="navTable">
<tr>
<td valign="bottom" width="20"><small><a href="#" onclick="togglePanel();" style="margin-top:10px;">Show/Hide</a></small></td>
<td width="72"><img src="chrome://editor/skin/icons/throbber-single.png" width="52" height="52" alt="Nvu" align="center"/></td><td align="left"><span id="topText">Help Center</span></td>
</tr>
</table>
