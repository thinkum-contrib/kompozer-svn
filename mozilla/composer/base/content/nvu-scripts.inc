  <script type="application/x-javascript" src="chrome://editor/content/editor.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/editorRulers.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/editorTemplates.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/EditorCommandsDebug.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/EditorContextMenu.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/StructBarContextMenu.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/editorApplicationOverlay.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/publishprefs.js"/>

  <script type="application/x-javascript" src="chrome://communicator/content/contentAreaDD.js"/>
  <script type="application/x-javascript" src="chrome://communicator/content/contentAreaClick.js"/>
  <script type="application/x-javascript" src="chrome://communicator/content/printing.js"/>
  <script type="application/x-javascript" src="chrome://global/content/nsTransferable.js"/>
  <script type="application/x-javascript" src="chrome://global/content/nsDragAndDrop.js"/>
  <script type="application/x-javascript" src="chrome://communicator/content/RealTimeSpell.js"/>

  <script type="application/x-javascript" src="chrome://global/content/XPCNativeWrapper.js"/>

  <script type="application/x-javascript" src="chrome://editor/content/editorUtilities.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/ComposerCommands.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/calendarSmartWidgetOverlay.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/mainCore.js"/>

  <script type="application/x-javascript" src="chrome://editor/content/processors.js"/>
  <script type="application/x-javascript" src="chrome://editor/content/phpAndComments.js"/>

  <script type="application/x-javascript">
// Kaze: the tabeditor's "oncommand" event doesn't update the window title
//       on Ctrl + Tab / PgUpDn, let's use a Timeout for that
window.addEventListener("keypress", onTabSwitching, true);
function onTabSwitching(event) {
  if (event.ctrlKey) // XXX does this work on MacOSX?
    if (event.keyCode == KeyEvent.DOM_VK_TAB || event.keyCode == KeyEvent.DOM_VK_PAGE_UP || event.keyCode == KeyEvent.DOM_VK_PAGE_DOWN)
      setTimeout("UpdateWindowTitle()", 10);
}
  </script>
  <script type="application/x-javascript" src="chrome://editor/content/helpers.js"/>

