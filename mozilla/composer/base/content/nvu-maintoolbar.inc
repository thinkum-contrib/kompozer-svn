<toolbarpalette id="NvuToolbarPalette">

  <toolbarbutton id="newButton" class="toolbarbutton-1"
                 label="&newMenu.label;" type="menu-button"
                 observes="cmd_newEditorTab"
                 tooltiptext="&newToolbarCmd.tooltip;">
    <menupopup>
      <menuitem label="&newTab.label;"          command="cmd_newEditorTab" default="true"/>
      <menuitem label="&newBlankPageCmd.label;" command="cmd_newEditor"/>
      <menuseparator/>
      <menuitem label="&newOtherCmd.label;"     command="cmd_newEdited"/>
    </menupopup>
  </toolbarbutton>

  <!-- toolbarbutton id="openButton" class="toolbarbutton-1"
                 label="&openToolbarCmd.label;" observes="cmd_openInTab"
                 tooltiptext="&openToolbarCmd.tooltip;"/ -->
  <!-- Kaze: let's be consistant with the "new" button -->
  <toolbarbutton id="openButton" class="toolbarbutton-1"
                 label="&openToolbarCmd.label;" type="menu-button"
                 observes="cmd_openInTab"
                 tooltiptext="&openToolbarCmd.tooltip;">
    <menupopup>
      <menuitem label="&newTab.label;"          command="cmd_openInTab" default="true"/>
      <menuitem label="&newBlankPageCmd.label;" command="cmd_open"/>
    </menupopup>
  </toolbarbutton>

  <toolbarbutton id="saveButton" class="toolbarbutton-1" observes="cmd_save"
                 tooltiptext="&saveToolbarCmd.tooltip;"/>

  <toolbarbutton id="publishButton" class="toolbarbutton-1"
                 observes="cmd_publish"
                 tooltiptext="&publishToolbarCmd.tooltip;"/>

  <toolbarbutton id="previewButton" class="toolbarbutton-1"
                 label="&previewToolbarCmd.label;" observes="cmd_preview"
                 tooltiptext="&previewToolbarCmd.tooltip;"/>

  <toolbarbutton id="cutButton" class="toolbarbutton-1"
                 label="&cutCmd.label;" command="cmd_cut"
                 tooltiptext="&cutCmd.label;"/>

  <toolbarbutton id="copyButton" class="toolbarbutton-1"
                 label="&copyCmd.label;" command="cmd_copy"
                 tooltiptext="&copyCmd.label;"/>

  <toolbarbutton id="pasteButton" class="toolbarbutton-1"
                 label="&pasteCmd.label;" command="cmd_paste"
                 tooltiptext="&pasteCmd.label;"/>

  <toolbarbutton id="printButton" type="menu-button" class="toolbarbutton-1"
                 label="&printToolbarCmd.label;"
                 tooltiptext="&printToolbarCmd.tooltip;"
                 oncommand="if (event.target==this) goDoCommand('cmd_print');">
    <menupopup id="printMenu">
      <menuitem id="printMenuItemToolbar" accesskey="&fileprint.accesskey;" label="&printCmd.label;" default="true"
                oncommand="goDoCommand('cmd_print');"/>
      <!-- 'printSetupToolbar' is merged in here from platformGlobalOverlay.xul -->
    </menupopup>
  </toolbarbutton>

  <toolbarbutton id="findButton" class="toolbarbutton-1"
                 label="&findToolbarCmd.label;" observes="cmd_find"
                 tooltiptext="&findToolbarCmd.tooltip;"/>

  <toolbarbutton id="linkButton" class="toolbarbutton-1"
                 label="&linkToolbarCmd.label;" observes="cmd_link"
                 tooltiptext="&linkToolbarCmd.tooltip;"/>

  <toolbarbutton id="namedAnchorButton" class="toolbarbutton-1"
                 label="&anchorToolbarCmd.label;" observes="cmd_anchor"
                 tooltiptext="&anchorToolbarCmd.tooltip;"/>

  <toolbarbutton id="imageButton" class="toolbarbutton-1"
                 label="&imageToolbarCmd.label;" observes="cmd_image"
                 tooltiptext="&imageToolbarCmd.tooltip;"/>

  <toolbarbutton id="hlineButton" class="toolbarbutton-1"
                 label="&hruleToolbarCmd.label;" observes="cmd_hline"
                 tooltiptext="&hruleToolbarCmd.tooltip;"/>

  <toolbarbutton id="tableButton" class="toolbarbutton-1"
                 label="&tableToolbarCmd.label;" observes="cmd_table"
                 tooltiptext="&tableToolbarCmd.tooltip;"/>

  <toolbarbutton id="formButton" class="toolbarbutton-1"
                 label="&formToolbarCmd.label;" type="menu-button" observes="cmd_form"
                 tooltiptext="&formToolbarCmd.tooltip;"
                 buttonaction="goDoCommand('cmd_form');">
    <menupopup id="formMenu">
      <menuitem accesskey="&insertform.accesskey;"        command="cmd_form"        label="&insertFormCmd.label;"
                default="true"/>
      <menuseparator/>
      <menuitem accesskey="&insertinputtag.accesskey;"    command="cmd_inputtag"    label="&insertInputTagCmd.label;"/>
      <menuitem accesskey="&insertinputimage.accesskey;"  command="cmd_inputimage"  label="&insertInputImageCmd.label;"/>
      <menuitem accesskey="&inserttextarea.accesskey;"    command="cmd_textarea"    label="&insertTextAreaCmd.label;"/>
      <menuitem accesskey="&insertselect.accesskey;"      command="cmd_select"      label="&insertSelectCmd.label;"/>
      <menuitem accesskey="&insertbutton.accesskey;"      command="cmd_button"      label="&insertButtonCmd.label;"/>
      <menuitem accesskey="&insertlabel.accesskey;"       command="cmd_label"       label="&insertLabelCmd.label;"/>
      <menuitem accesskey="&insertfieldset.accesskey;"    command="cmd_fieldset"    label="&insertFieldSetCmd.label;"/>
      <menuseparator/>
      <menuitem accesskey="&insertisindex.accesskey;"     command="cmd_isindex"     label="&insertIsIndexCmd.label;"/>
    </menupopup>
  </toolbarbutton>

  <toolbarbutton id="spellingButton" class="toolbarbutton-1" disabled="true"
                 label="&spellToolbarCmd.label;" observes="cmd_spelling"
                 tooltiptext="&spellToolbarCmd.tooltip;"/>

  <toolbarbutton id="undoButton" class="toolbarbutton-1" disabled="true"
                 label="&undoCmd.label;" observes="cmd_undo"
                 tooltiptext="&undoCmd.label;"/>

  <toolbarbutton id="redoButton" class="toolbarbutton-1" disabled="true"
                 label="&redoCmd.label;" observes="cmd_redo"
                 tooltiptext="&redoCmd.label;"/>

  <toolbaritem id="throbber-box"  align="center" pack="center">
    <button id="navigator-throbber" tooltiptext="&throbber.tooltip;" />
  </toolbaritem> 
</toolbarpalette>
<toolbar id="EditToolbar" class="toolbar-primary chromeclass-toolbar"
         toolbarname="Main"
         fullscreentoolbar="true"
         persist="iconsize,mode"
         iconsize="small"
         mode="full"
         context="main-toolbar-context-menu"
         customizable="true"
         defaultset="newButton,spacer,openButton,saveButton,publishButton,previewButton,spacer,undoButton,redoButton,spacer,namedAnchorButton,linkButton,imageButton,tableButton,formButton,spacer,cssButton,spring,throbber-box,spacer">
         <!-- defaultset="newButton,spacer,openButton,saveButton,publishButton,previewButton,spacer,namedAnchorButton,linkButton,imageButton,tableButton,formButton,spacer,spellingButton,spacer,printButton,spring,throbber-box,spacer"> -->
</toolbar>
