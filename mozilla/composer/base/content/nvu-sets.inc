  <stringbundleset id="stringbundleset">
    <stringbundle id="bundle_region" src="chrome://nvu-region/locale/region.properties"/>
    <stringbundle id="bundle_viewZoom"/>
  </stringbundleset>

  <commandset id="viewZoomCommands"/>

  <commandset id="tasksCommands">
    <commandset id="globalEditMenuItems"/>
    <commandset id="selectEditMenuItems"/>
    <commandset id="undoEditMenuItems"/>
    <commandset id="clipboardEditMenuItems"/>
    
    <commandset id="commonEditorMenuItems" 
                commandupdater="true"
                events="create"
                oncommandupdate="goUpdateComposerMenuItems(this)">
      <command id="cmd_open"                                          oncommand="goDoCommand('cmd_open')"/>
      <command id="cmd_openInTab"                                     oncommand="goDoCommand('cmd_openInTab')"/>
      <command id="cmd_newEdited"                                     oncommand="goDoCommand('cmd_newEdited')"/>
      <command id="cmd_openRemote"                                    oncommand="goDoCommand('cmd_openRemote')"/>
      <command id="cmd_close"        label="&closeCmd.label;"         oncommand="goDoCommand('cmd_close')"/>
      <command id="cmd_closeAll"     label="&closeAllCmd.label;"      oncommand="goDoCommand('cmd_closeAll')"/>
      <command id="cmd_printSetup"                                    oncommand="goDoCommand('cmd_printSetup')"/>
      <!--
      <command id="cmd_printPreview" label="&printPreviewCmd.label;"  oncommand="goDoCommand('cmd_printPreview')"/>
      -->
      <command id="cmd_print"                                         oncommand="goDoCommand('cmd_print')"/>
      <command id="cmd_quit"         oncommand="goDoCommand('cmd_quit')"/>
    </commandset>

    <commandset id="composerMenuItems"
                commandupdater="true"
                events="create, mode_switch"
                oncommandupdate="goUpdateComposerMenuItems(this)">
      <!-- format menu -->
      <command id="cmd_listProperties"  oncommand="goDoCommand('cmd_listProperties')"/>
      <command id="cmd_pageProperties"  oncommand="goDoCommand('cmd_pageProperties')"/>
      <command id="cmd_colorProperties" oncommand="goDoCommand('cmd_colorProperties')"/>

      <command id="cmd_link"             oncommand="goDoCommand('cmd_link')"/>
      <command id="cmd_anchor"           oncommand="goDoCommand('cmd_anchor')"/>
      <command id="cmd_image"            oncommand="goDoCommand('cmd_image')"/>
      <command id="cmd_hline"            oncommand="goDoCommand('cmd_hline')"/>
      <command id="cmd_table"            oncommand="goDoCommand('cmd_table')"/>
      <command id="cmd_form"             oncommand="goDoCommand('cmd_form')"/>
      <command id="cmd_inputtag"         oncommand="goDoCommand('cmd_inputtag')"/>
      <command id="cmd_inputimage"       oncommand="goDoCommand('cmd_inputimage')"/>
      <command id="cmd_textarea"         oncommand="goDoCommand('cmd_textarea')"/>
      <command id="cmd_select"           oncommand="goDoCommand('cmd_select')"/>
      <command id="cmd_button"           oncommand="goDoCommand('cmd_button')"/>
      <command id="cmd_label"            oncommand="goDoCommand('cmd_label')"/>
      <command id="cmd_fieldset"         oncommand="goDoCommand('cmd_fieldset')"/>
      <command id="cmd_isindex"          oncommand="goDoCommand('cmd_isindex')"/>
      <command id="cmd_objectProperties" oncommand="goDoCommand('cmd_objectProperties')"/>
      <command id="cmd_insertChars"      oncommand="goDoCommand('cmd_insertChars')"    label="&insertCharsCmd.label;"/>
      <!--
        <command id="cmd_insertNbsp"       oncommand="goDoCommand('cmd_insertNbsp')"     label="&insertNbspCmd.label;"/>
      -->
      <command id="cmd_insertHTMLWithDialog" oncommand="goDoCommand('cmd_insertHTMLWithDialog')"  label="&insertHTMLCmd.label;"/>
      <command id="cmd_insertBreak"      oncommand="goDoCommand('cmd_insertBreak')"/>
      <command id="cmd_insertBreakAll"   oncommand="goDoCommand('cmd_insertBreakAll')"/>

      <command id="cmd_insertPHPCode" oncommand="goDoCommand('cmd_insertPHPCode')"  label="&insertPHPCode.label;"/>
      <command id="cmd_insertComment" oncommand="goDoCommand('cmd_insertComment')"  label="&insertComment.label;"/>


      <command id="cmd_NormalMode"       oncommand="goDoCommand('cmd_NormalMode')"     label="&NormalMode.label;"/>
      <command id="cmd_AllTagsMode"      oncommand="goDoCommand('cmd_AllTagsMode')"    label="&AllTagsMode.label;"/>
      <command id="cmd_HTMLSourceMode"   oncommand="goDoCommand('cmd_HTMLSourceMode')"/>
      <command id="cmd_PreviewMode"      oncommand="goDoCommand('cmd_PreviewMode')"    label="&PreviewMode.label;"/>

      <!-- only used in context popup menu -->
      <command id="cmd_editLink"         oncommand="goDoCommand('cmd_editLink')"/>

      <!-- dummy command used just to disable things in non-Strict mode -->
      <command id="cmd_dtdStrictness"/>
      <command id="cmd_dtdStrictness2"/>

      <!-- dummy command used just to disable things in non-HTML modes -->
      <command id="cmd_renderedHTMLEnabler"/>
    </commandset>
    <commandset id="composerEditMenuItems"
                commandupdater="true"
                events="create, mode_switch"
                oncommandupdate="goUpdateComposerMenuItems(this)">
      <command id="cmd_undo"/>
      <command id="cmd_redo"/>
      <command id="cmd_cut"/>
      <command id="cmd_copy"/>
      <command id="cmd_paste"/>  
      <command id="cmd_pasteNoFormatting" oncommand="goDoCommand('cmd_pasteNoFormatting')"
               label="&pasteNoFormatting.label;" accesskey="&pasteNoFormatting.accesskey;"/>
      <command id="cmd_delete"/>
      <command id="cmd_selectAll"/>
      <command id="cmd_preferences"     oncommand="goDoCommand('cmd_preferences')"/>
      <command id="cmd_find"            oncommand="goDoCommand('cmd_find')"/>
      <command id="cmd_findNext"        oncommand="goDoCommand('cmd_findNext')"     label="&findAgainCmd.label;"/>
      <command id="cmd_findPrev"        oncommand="goDoCommand('cmd_findPrev')"     label="&findPrevCmd.label;"/>
      <command id="cmd_spelling"        oncommand="goDoCommand('cmd_spelling')"/>
      <command id="cmd_validate"        oncommand="goDoCommand('cmd_validate')"     label="&validateCmd.label;"      accesskey="&validate.accesskey;" />
      <command id="cmd_cleanup"         oncommand="goDoCommand('cmd_cleanup')"      label="&markupCleanerCmd.label;" accesskey="&markupcleaner.accesskey;"/>
      <command id="cmd_checkLinks"      oncommand="goDoCommand('cmd_checkLinks')"/>
      <command id="cmd_pasteQuote"      oncommand="goDoCommand('cmd_pasteQuote')" label="&pasteAsQuotationCmd.label;"/>
      <command id="cmd_publishSettings" oncommand="goDoCommand('cmd_publishSettings')" label="&publishSettings.label;" accesskey="&publishSettings.accesskey;"/>
      <!-- Kaze -->
      <command id="cmd_cssEditor"       oncommand="goDoCommand('cmd_cssEditor')"  />
      <!-- /Kaze -->
    </commandset>

    <commandset id="composerSaveMenuItems"
                commandupdater="true"
                events="create, save"
                oncommandupdate="goUpdateComposerMenuItems(this)">
      <command id="cmd_save"           label="&saveCmd.label;"           oncommand="goDoCommand('cmd_save')"/>
      <command id="cmd_saveAs"         label="&saveAsCmd.label;"         oncommand="goDoCommand('cmd_saveAs')"/>
      <command id="cmd_exportToText"   label="&exportToTextCmd.label;"   oncommand="goDoCommand('cmd_exportToText')"/>
      <command id="cmd_saveAndChangeEncoding"  label="&saveAsChangeEncodingCmd.label;"  oncommand="goDoCommand('cmd_saveAndChangeEncoding')"/>
      <command id="cmd_publish"        label="&publishCmd.label;"        oncommand="goDoCommand('cmd_publish')"/>
      <command id="cmd_publishAs"      label="&publishAsCmd.label;"      oncommand="goDoCommand('cmd_publishAs')"/>
      <command id="cmd_revert"         label="&fileRevert.label;"        oncommand="goDoCommand('cmd_revert')"/>
      <command id="cmd_refreshImages"  label="&refreshImages.label;"     oncommand="goDoCommand('cmd_refreshImages')"/>
      <command id="cmd_preview"                                          oncommand="goDoCommand('cmd_preview')"/>
      <command id="cmd_editSendPage"   label="&sendPageCmd.label;"
                                       accesskey="&sendPage.accesskey;"  oncommand="goDoCommand('cmd_editSendPage')"/>
    </commandset>

    <commandset id="composerStyleMenuItems"
          commandupdater="true"
          events="create, style, mode_switch"
          oncommandupdate="goUpdateComposerMenuItems(this)">
      <command id="cmd_bold"          state="false"     oncommand="doStyleUICommand('cmd_bold')"/>
      <command id="cmd_italic"        state="false"     oncommand="doStyleUICommand('cmd_italic')"/>
      <command id="cmd_underline"     state="false"     oncommand="doStyleUICommand('cmd_underline')"/>
      <command id="cmd_tt"            state="false"     oncommand="doStyleUICommand('cmd_tt')"/>
      <command id="cmd_smiley"/>

      <command id="cmd_strikethrough" state="false"     oncommand="doStyleUICommand('cmd_strikethrough');"/>
      <command id="cmd_superscript"   state="false"     oncommand="doStyleUICommand('cmd_superscript');"/>
      <command id="cmd_subscript"     state="false"     oncommand="doStyleUICommand('cmd_subscript');"/>
      <command id="cmd_nobreak"       state="false"     oncommand="doStyleUICommand('cmd_nobreak');"/>

      <command id="cmd_em"            state="false"     oncommand="doStyleUICommand('cmd_em')"/>
      <command id="cmd_strong"        state="false"     oncommand="doStyleUICommand('cmd_strong')"/>
      <command id="cmd_cite"          state="false"     oncommand="doStyleUICommand('cmd_cite')"/>
      <command id="cmd_abbr"          state="false"     oncommand="doStyleUICommand('cmd_abbr')"/>
      <command id="cmd_acronym"       state="false"     oncommand="doStyleUICommand('cmd_acronym')"/>
      <command id="cmd_code"          state="false"     oncommand="doStyleUICommand('cmd_code')"/>
      <command id="cmd_samp"          state="false"     oncommand="doStyleUICommand('cmd_samp')"/>
      <command id="cmd_var"           state="false"     oncommand="doStyleUICommand('cmd_var')"/>

      <command id="cmd_ul"            state="false"     oncommand="doStyleUICommand('cmd_ul')"/>
      <command id="cmd_ol"            state="false"     oncommand="doStyleUICommand('cmd_ol')"/>
      <command id="cmd_dt"            state="false"     oncommand="doStyleUICommand('cmd_dt')"/>
      <command id="cmd_dd"            state="false"     oncommand="doStyleUICommand('cmd_dd')"/>

      <command id="cmd_indent"                          oncommand="goDoCommand('cmd_indent')"/>
      <command id="cmd_outdent"                         oncommand="goDoCommand('cmd_outdent')"/>

      <!-- the state attribute gets filled with the paragraph format before the command is exectued -->
      <command id="cmd_paragraphState"  state=""         oncommand="doStatefulCommand('cmd_paragraphState', event.target.value)"/>
      <command id="cmd_fontFace"        state=""         oncommand="doStatefulCommand('cmd_fontFace', event.target.value)"/>
      <command id="cmd_class"           state=""         oncommand="doStatefulCommand('cmd_class', event.target.value)"/>

      <!-- No "oncommand", use EditorSelectColor() to bring up color dialog -->
      <command id="cmd_fontColor"       state=""/>
      <command id="cmd_backgroundColor" state=""/>
      <command id="cmd_highlight"       state="transparent"  oncommand="EditorSelectColor('Highlight', event);"/>

      <command id="cmd_fontSize"                         oncommand="goDoCommand('cmd_fontSize')"/>
      <command id="cmd_align"           state="left"/>
      <command id="cmd_direction"       state="none"/>

      <command id="cmd_absPos"          state=""        oncommand="goDoCommand('cmd_absPos')"/>
      <command id="cmd_increaseZIndex"  state=""        oncommand="goDoCommand('cmd_increaseZIndex')"/>
      <command id="cmd_decreaseZIndex"  state=""        oncommand="goDoCommand('cmd_decreaseZIndex')"/>
      <command id="cmd_glues"/>

      <command id="cmd_blockBorders"                    oncommand="goDoCommand('cmd_blockBorders')"/>

      <command id="cmd_advancedProperties"              oncommand="goDoCommand('cmd_advancedProperties')"/>

      <command id="cmd_increaseFont"                    oncommand="goDoCommand('cmd_increaseFont')"/>
      <command id="cmd_decreaseFont"                    oncommand="goDoCommand('cmd_decreaseFont')"/>
      
      <command id="cmd_removeStyles"                    oncommand="goDoCommand('cmd_removeStyles')"/>
      <command id="cmd_removeLinks"                     oncommand="goDoCommand('cmd_removeLinks')"/>
      <command id="cmd_removeNamedAnchors"              oncommand="goDoCommand('cmd_removeNamedAnchors')"/>
      <command id="cmd_updateStructToolbar"             oncommand="goDoCommand('cmd_updateStructToolbar')"/>
    </commandset>

    <commandset id="composerTableMenuItems"
                commandupdater="true"
                events="create, mode_switch"
                oncommandupdate="goUpdateTableMenuItems(this)">
      <!-- Table menu -->
      <command id="cmd_SelectTable"         oncommand="goDoCommand('cmd_SelectTable')"/>
      <command id="cmd_SelectRow"           oncommand="goDoCommand('cmd_SelectRow')"/>
      <command id="cmd_SelectColumn"        oncommand="goDoCommand('cmd_SelectColumn')"/>
      <command id="cmd_SelectCell"          oncommand="goDoCommand('cmd_SelectCell')"/>
      <command id="cmd_SelectAllCells"      oncommand="goDoCommand('cmd_SelectAllCells')"/>
      <command id="cmd_InsertTable"         oncommand="goDoCommand('cmd_InsertTable')"/>
      <command id="cmd_InsertRowAbove"      oncommand="goDoCommand('cmd_InsertRowAbove')"/>
      <command id="cmd_InsertRowBelow"      oncommand="goDoCommand('cmd_InsertRowBelow')"/>
      <command id="cmd_InsertColumnBefore"  oncommand="goDoCommand('cmd_InsertColumnBefore')"/>
      <command id="cmd_InsertColumnAfter"   oncommand="goDoCommand('cmd_InsertColumnAfter')"/>
      <command id="cmd_InsertCellBefore"    oncommand="goDoCommand('cmd_InsertCellBefore')"/>
      <command id="cmd_InsertCellAfter"     oncommand="goDoCommand('cmd_InsertCellAfter')"/>
      <command id="cmd_DeleteTable"         oncommand="goDoCommand('cmd_DeleteTable')"/>
      <command id="cmd_DeleteRow"           oncommand="goDoCommand('cmd_DeleteRow')"/>
      <command id="cmd_DeleteColumn"        oncommand="goDoCommand('cmd_DeleteColumn')"/>
      <command id="cmd_DeleteCell"          oncommand="goDoCommand('cmd_DeleteCell')"/>
      <command id="cmd_DeleteCellContents"  oncommand="goDoCommand('cmd_DeleteCellContents')"/>
      <command id="cmd_NormalizeTable"      oncommand="goDoCommand('cmd_NormalizeTable')"/>
      <command id="cmd_JoinTableCells"      oncommand="goDoCommand('cmd_JoinTableCells')"/>
      <command id="cmd_SplitTableCell"      oncommand="goDoCommand('cmd_SplitTableCell')"/>
      <command id="cmd_ConvertToTable"      oncommand="goDoCommand('cmd_ConvertToTable')"/>
      <command id="cmd_TableOrCellColor"    oncommand="goDoCommand('cmd_TableOrCellColor')"/>
      <command id="cmd_editTable"           oncommand="goDoCommand('cmd_editTable')"/>
    </commandset>

    <commandset id="composerListMenuItems"
                commandupdater="true"
                events="create, mode_switch"
                oncommandupdate="goUpdateComposerMenuItems(this)">
      <!-- List menu  -->
      <command id="cmd_removeList"          oncommand="goDoCommand('cmd_removeList')"/>
      <!-- cmd_ul and cmd_ol are shared with toolbar and are in composerStyleMenuItems commandset -->
    </commandset>
    <command id="toggleSidebar"/>
  </commandset>

  <broadcaster id="args" value="about:blank"/>
  <broadcaster id="canPrint"/>
  
  <!-- Interim hack to transition from nsIXULWindowCallbacks/ShowWindowWithArgs
  <broadcaster id="dialog.start" ready="false"/>
  <observes element="dialog.start" attribute="ready" onbroadcast="EditorStartup('html')"/>
   -->
  <broadcasterset id="broadcasterset">
    <broadcaster id="Editor:Throbber" busy="false"/>
    <!-- broadcaster id="Communicator:WorkMode"/ -->
    <!-- Broadcasters/commands with no other home -->
    <!-- view menu -->
    <command id="cmd_newNavigator"/>
    <command id="cmd_newEditor"/>
    <command id="cmd_newEditorTab"        oncommand="NewEditorTab()"/>
    <command id="cmd_newEditorTemplate"   oncommand="NewEditorFromTemplate();"/>
    <command id="cmd_newTemplate"/>

    <command id="cmd_viewCompToolbar"     oncommand="goToggleToolbar('EditToolbar','cmd_viewCompToolbar');"         checked="true"/>
    <!-- Kaze: splitting the format toolbar -->
    <command id="cmd_viewFormatToolbar1"  oncommand="goToggleToolbar('FormatToolbar1','cmd_viewFormatToolbar1');"   checked="true"/>
    <command id="cmd_viewFormatToolbar2"  oncommand="goToggleToolbar('FormatToolbar2','cmd_viewFormatToolbar2');"   checked="true"/>
    <!-- /Kaze -->
    <command id="cmd_viewEditModeToolbar" oncommand="goToggleToolbar('EditModeToolbar','cmd_viewEditModeToolbar');" checked="true"/>
    <command id="cmd_viewtaskbar"         oncommand="goToggleToolbar('status-bar','cmd_viewtaskbar');"              checked="true"/>
    <command id="cmd_viewRulers"          oncommand="goToggleRulers('tabeditor','cmd_viewRulers');"                 checked="true"/>

    <!-- Obsolete; these will go away -->
    <command id="Editor:Font:Size" fontsize=""/>

  </broadcasterset>

  <!-- keys are appended from the overlay -->
  <keyset id="editorKeys">
    <keyset id="viewZoomKeys"/>
    <keyset id="tasksKeys"/>
    <key id="showHideSidebar"/>
    <!-- eat these tab events here to stop focus from moving -->
    <key keycode="VK_TAB" oncommand="return true;"/>
    <key keycode="VK_TAB" modifiers="shift" oncommand="return true;"/>
    <key keycode="VK_TAB" modifiers="control" oncommand="return true;"/>
    <key keycode="VK_TAB" modifiers="control,shift" oncommand="return true;"/>
    <!-- defined in globalOverlay -->
    <key id="key_newNavigator" observes="cmd_newEdited" key="&fileopen.keybinding;" />
    <key id="key_newBlankPage"/>

    <key id="openeditorkb"        key="&fileopen.keybinding;"       observes="cmd_openInTab"  modifiers="accel"/>
    <key id="openremoteeditorkb"  key="&fileopenremote.keybinding;" observes="cmd_openRemote" modifiers="accel,shift"/>
    <key id="savekb"              key="&filesave.keybinding;"       observes="cmd_save"       modifiers="accel"/>
    <key id="publishkb"           key="&filesave.keybinding;"       observes="cmd_publish"    modifiers="accel,shift"/>
    <key id="closekb"             key="&fileclose.keybinding;"      observes="cmd_close"      modifiers="accel"/>
    <key id="printkb"             key="&fileprint.keybinding;"      observes="cmd_print"      modifiers="accel"/>
    <!-- Kaze -->
    <key id="revertkb"            key="&filerevert.keybinding;"     observes="cmd_revert"     modifiers="accel"/>
    <key id="previewkb"       keycode="&filepreview.keybinding;"    observes="cmd_preview" />
    <key id="key_openHelp"    keycode="VK_F1" oncommand="openHelp('comp-doc', 'chrome://help/locale/nvu.rdf');"/>
    <!-- /Kaze -->
    <key id="key_quit"/>
    <key id="key_undo"/>
    <key id="key_redo"/>
    <key id="key_cut"/>
    <key id="key_copy"/>
    <key id="key_paste"/>
    <key id="key_delete"/>
    <key id="key_selectAll"/>
    <key id="pastequotationkb"    key="&editpastequotation.keybinding;" observes="cmd_pasteQuote"  modifiers="accel, shift"/>
    <key id="findkb"              key="&editfind.keybinding;"       observes="cmd_find"       modifiers="accel"/>
    <!-- Kaze: disable
    <key id="findnextkb"          key="&editfindnext.keybinding;"   observes="cmd_findNext"   modifiers="accel"/>
    <key id="findprevkb"          key="&editfindprev.keybinding;"   observes="cmd_findPrev"   modifiers="accel,shift"/>
    <key keycode="&editfindnext.keybinding2;" observes="cmd_findNext"/>
    <key keycode="&editfindprev.keybinding2;" observes="cmd_findPrev" modifiers="shift"/>
#ifdef MOZ_X11
    <key keycode="&editfind.keybinding2;" observes="cmd_find"/>
#endif
    -->
    <key id="findnextkb"          keycode="&editfindnext.keybinding;"    observes="cmd_findNext"/>
    <key id="findprevkb"          keycode="&editfindprev.keybinding;"    observes="cmd_findPrev"  modifiers="shift"/>
    <key id="checkspellingkb"     key="&editcheckspelling.keybinding;"   observes="cmd_spelling"  modifiers="accel" disabled="true"/>

    <key id="boldkb"         key="&stylebold.keybinding;"       observes="cmd_bold" modifiers="accel"/>
    <key id="italickb"       key="&styleitalic.keybinding;"     observes="cmd_italic" modifiers="accel"/>
    <key id="underlinekb"    key="&styleunderline.keybinding;"  observes="cmd_underline" modifiers="accel"/>
    <key id="fixedwidthkb"   key="&formatfontfixed.keybinding;" observes="cmd_newEditorTab" modifiers="accel"/>

    <key id="increaseindentkb"  key="&formatindent.keybinding;"  observes="cmd_indent"  modifiers="accel"/>
    <key id="decreaseindentkb"  key="&formatoutdent.keybinding;"  observes="cmd_outdent"  modifiers="accel"/>

    <key id="removestyleskb"       key="&formatremovestyles.keybinding;"   observes="cmd_removeStyles"  modifiers="accel, shift"/>
    <key id="removestyleskb2"       key=" "   observes="cmd_removeStyles"  modifiers="accel"/>
    <key id="removelinkskb"        key="&formatremovelinks.keybinding;"    observes="cmd_removeLinks"  modifiers="accel, shift"/>
    <key id="removenamedanchorskb" key="&formatremovenamedanchors.keybinding;"    observes="cmd_removeNamedAnchors"  modifiers="accel, shift"/>
    <key id="decreasefontsizekb"   key="&decreaseFontSize.keybinding;"     observes="cmd_decreaseFont"  modifiers="accel"/>
    <key id="increasefontsizekb"   key="&increaseFontSize.keybinding;"     observes="cmd_increaseFont"  modifiers="accel"/>
    <key                           key="&increaseFontSize.keybinding;"     observes="cmd_increaseFont"  modifiers="accel,shift"/>
    <key                           key="&increaseFontSize.keybinding2;"    observes="cmd_increaseFont"  modifiers="accel"/>

    <key id="insertlinkkb"         key="&insertlink.keybinding;"           observes="cmd_link"          modifiers="accel"/>
  </keyset>

