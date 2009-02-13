  <menubar id="main-menubar" class="chromeclass-menubar" persist="collapsed" grippytooltiptext="&menuBar.tooltip;">
    <menu id="fileMenu" label="&fileMenu.label;" accesskey="&filemenu.accesskey;">
      <menupopup id="menu_FilePopup" onpopupshowing="EditorInitFileMenu();">
        <menuitem label="&newMenu.label;" key="key_newNavigator" command="cmd_newEdited"/>
        <menuitem accesskey="&fileopen.accesskey;"            key="openeditorkb"       observes="cmd_openInTab" label="&openFileCmd.label;"/>
        <menuitem accesskey="&fileopenremote.accesskey;"      key="openremoteeditorkb" observes="cmd_openRemote" label="&openremoteCmd.label;"/>
        <!--menuitem observes="cmd_openInTab" label="Open File in new tab"/-->
        <menu id="menu_RecentFiles" accesskey="&filerecentmenu.accesskey;" label="&fileRecentMenu.label;"
              onpopupshowing="BuildRecentPagesMenu();">
          <menupopup id="menupopup_RecentFiles" oncommand="editPage(event.target.getAttribute('value'), window, false, true);"/>
            <!-- menuitems appended at runtime -->
        </menu>
        <menuitem accesskey="&fileclose.accesskey;" key="closekb" observes="cmd_close"/>
        <menuitem observes="cmd_closeAll"/>
        <menuseparator/>
        <menuitem id="saveMenuitem" accesskey="&filesave.accesskey;" key="savekb" observes="cmd_save"/>
        <menuitem accesskey="&filesaveas.accesskey;" observes="cmd_saveAs"/>
        <menuitem accesskey="&filesaveandchangeencoding.accesskey;" observes="cmd_saveAndChangeEncoding"/>
        <menuseparator/>
        <menuitem id="publishMenuitem" accesskey="&publishcmd.accesskey;" key="publishkb" observes="cmd_publish"/>
        <menuitem accesskey="&publishas.accesskey;" observes="cmd_publishAs"/>
        <menuseparator/>
        <menuitem accesskey="&filerevert.accesskey;" key="revertkb" observes="cmd_revert"/>
        <menuitem accesskey="&refreshImages.accesskey;" observes="cmd_refreshImages"/><!-- Kaze: added -->
        <menuseparator/>
        <menuitem id="fileExportToText"  accesskey="&fileexporttotext.accesskey;" observes="cmd_exportToText"/>
        <menuitem id="previewInBrowser" label="&previewCmd.label;"  key="previewkb" accesskey="&filepreview.accesskey;" observes="cmd_preview"/>
        <!-- menuitem id="menu_SendPage" is merged here from mailEditorOverlay.xul,
             where "position" is assumed to be just after 'previewInBrowser'  -->

        <menuitem id="printSetupMenuItem" accesskey="&fileprintsetup.accesskey;" label="&printSetupCmd.label;" command="cmd_printSetup"/>
        <menuitem id="printMenuItem" accesskey="&fileprint.accesskey;" key="printkb" observes="cmd_print" label="&printCmd.label;"/>
        <!-- The Exit/Quit item is merged from platformGlobalOverlay.xul -->
      </menupopup>
    </menu>

    <menu id="editMenu" label="&editMenu.label;" accesskey="&editmenu.accesskey;"
          onpopupshowing="TweakComposerEditMenu()">
      <menupopup id="edEditMenuPopup">
        <!-- from utilityOverlay.xul -->
        <menuitem id="menu_undo"/>
        <menuitem id="menu_redo"/>
        <menuseparator id="edEditMenuSep1" />
        <menuitem id="menu_cut"/>
        <menuitem id="menu_copy"/>
        <menuitem id="menu_paste"/>
        <menuitem id="menu_pasteNoFormatting" observes="cmd_pasteNoFormatting"/>"

        <!-- PasteAs not implemented yet
        <menu id="menu_pasteAs" label="&pasteAs.label;" accesskey="&pasteAs.accesskey;">
          <menupopup onpopupshowing="InitPasteAsMenu();">
            <menuitem id="menu_pasteText"    label="&pasteTextCmd.label;"     accesskey="&pasteText.accesskey;"/>
            <menuitem id="menu_pasteImage"   label="&pasteImageCmd.label;"    accesskey="&pasteImage.accesskey;"/>
            <menuseparator/>
            <menuitem id="menu_pasteRows"    label="&pasteRowsCmd.label;"     accesskey="&pasteRows.accesskey;"/>
            <menuitem id="menu_pasteColumns" label="&pasteColumnsCmd.label;"  accesskey="&pasteColumns.accesskey;"/>
            <menuitem id="menu_pasteTable"                                    accesskey="&pasteTable.accesskey;"/>
          </menupopup>
        </menu>
        -->
        <menuitem id="menu_delete"/>
        <menuseparator id="edEditMenuSep2" />
        <menuitem id="menu_selectAll"/>
        <menuseparator id="sep_find"/>
        <menuitem id="menu_find"          accesskey="&editfind.accesskey;"          key="findkb"          observes="cmd_find" label="&findCmd.label;"/>
        <menuitem id="menu_findnext"      accesskey="&editfindnext.accesskey;"      key="findnextkb"      observes="cmd_findNext"/>
        <menuitem id="menu_findprev"      accesskey="&editfindprev.accesskey;"      key="findprevkb"      observes="cmd_findPrev"/>
        <menuseparator id="sep_checkspelling"/>
        <menuitem id="menu_checkspelling" accesskey="&editcheckspelling.accesskey;" key="checkspellingkb" observes="cmd_spelling" disabled="true"
                  label="&checkSpellingCmd.label;"/>
        <menuseparator id="menu_prefsSep"/>
        <menuitem id="menu_detachTemplate"
                  label="&detachFromTemplate.label;" oncommand="DetachFromTemplate()"/>
        <!-- Note: other Edit items (menu_validate, menu_publishSettings) are inserted from composerOverlay.xul -->
      </menupopup>
    </menu>

    <menu id="viewMenu" label="&viewMenu.label;" accesskey="&viewmenu.accesskey;">
    <!-- id pulls in "Show Sidebar" item from sidebarOverlay -->
    <menupopup id="menu_View_Popup">
      <menu id="menu_Toolbars">
        <menupopup id="view_toolbars_popup">
          <menuitem id="viewComposerToolbar" type="checkbox" label="&compositionToolbarCmd.label;"  accesskey="&compositiontb.accesskey;"
                    observes="cmd_viewCompToolbar"  />
          <menuitem id="viewFormatToolbar1"  type="checkbox" label="&formattingToolbarCmd.label; 1" accesskey="1"
                    observes="cmd_viewFormatToolbar1" />
          <menuitem id="viewFormatToolbar2"  type="checkbox" label="&formattingToolbarCmd.label; 2" accesskey="2"
                    observes="cmd_viewFormatToolbar2" />
          <menuitem id="viewEditModeToolbar" type="checkbox" label="&editmodeToolbarCmd.label;"     accesskey="&editmodetb.accesskey;"
                    observes="cmd_viewEditModeToolbar" />
          <menuitem id="viewTaskBar"         type="checkbox" label="&taskbarCmd.label;"             accesskey="&taskbarCmd.accesskey;"
                    observes="cmd_viewtaskbar" />
          <menuseparator />                                  
          <menuitem id="viewRulers"          type="checkbox" label="&viewRulersCmd.label;"          accesskey="&viewrulerscmd.accesskey;"
                    observes="cmd_viewRulers"  />
          <!-- Kaze: disabled
          <menuseparator />
          <menu id="CustomizeToolbar" label="&customizeToolbar.label;">
            <menupopup onpopupshowing="FillToolbarList(this)" />
          </menu>
          -->
        </menupopup>
      </menu>
      <menuseparator id="viewSep1"/>
      <menuitem id="viewNormalMode" checked="true" type="radio" group="mode" accesskey="&NormalMode.accesskey;"     observes="cmd_NormalMode"/>
      <menuitem id="viewAllTagsMode"               type="radio" group="mode" accesskey="&AllTagsMode.accesskey;"    observes="cmd_AllTagsMode"/>
      <menuitem id="viewSourceMode"                type="radio" group="mode" accesskey="&HTMLSourceMode.accesskey;" observes="cmd_HTMLSourceMode"
                hidden="true"
                label="&HTMLSourceMode.label;"/>
      <menuitem id="viewPreviewMode"               type="radio" group="mode" accesskey="&PreviewMode.accesskey;"    observes="cmd_PreviewMode"/>
      <!-- Kaze -->
      <menuseparator/>
      <menuitem id="viewSourceDock"                type="checkbox"           accesskey="&HTMLSourceMode.accesskey;" observes="cmd_SourceDockToggle"
                key="key_sourceDockToggle"
                label="&HTMLSourceMode.label;"/>
      <!-- /Kaze -->
      <menuseparator />
      <!-- disabled because Gecko does not allow generated content on BR after Moz1.7
        <menuitem id="viewParagraphMarks" type="checkbox" label="&viewParagraphMarks.label;"
                  accesskey="&viewparagraphmarks.accesskey;" oncommand="EditorToggleStyleSheet('paragraphMarks')"/>
      -->
      <menuitem id="blockOutlines" type="checkbox" label="&blockOutlines.label;"
                accesskey="&blockoutlines.accesskey;" oncommand="EditorToggleStyleSheet('blockOutlines')"/>
      <menuseparator  id="viewSep1"/>
      <menu id="menu_textZoom"/>  
      <menu id="composerCharsetMenu">
        <menupopup id="composerCharsetMenuPopup"  onpopupshowing="updateCharsetPopupMenu(this)" />
      </menu>
    </menupopup>
    </menu>
 
    <menu id="insertMenu" label="&insertMenu.label;" accesskey="&insertmenu.accesskey;">
      <menupopup id="insertMenuPopup"  onpopupshowing="EditorInitInsertTemplateMenu();">
        <menuitem id="insertImage" accesskey="&insertimage.accesskey;"      observes="cmd_image"       label="&insertImageCmd.label;"/>
        <menuitem id="insertTable" accesskey="&inserttable.accesskey;"      observes="cmd_InsertTable" label="&insertTableCmd.label;"/>
        <menu accesskey="&insertformmenu.accesskey;" id="insertFormMenu" label="&insertFormMenu.label;">
          <menupopup>
            <menuitem accesskey="&insertform.accesskey;"        command="cmd_form"        label="&insertFormCmd.label;"/>
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
        </menu>
        <menuitem id="insertLink"   accesskey="&insertlink.accesskey;"    observes="cmd_link"    label="&insertLinkCmd.label;"   key="insertlinkkb"/>
        <menuitem id="insertAnchor" accesskey="&insertanchor.accesskey;"  observes="cmd_anchor"  label="&insertAnchorCmd.label;"/>
        <menuitem id="insertHline"  accesskey="&inserthline.accesskey;"   observes="cmd_hline"   label="&insertHLineCmd.label;"/>
        <menuitem id="insertChars"  accesskey="&insertchars.accesskey;"   observes="cmd_insertChars"/>
        <!--
          <menuitem id="insertNbsp" accesskey="&insertNbsp.accesskey;" observes="cmd_insertNbsp"/>
        -->
        <menu id="insertTOC" label="&tocMenu.label;" accesskey="&tocMenu.accesskey;">
          <menupopup onpopupshowing="InitTOCMenu()">
            <menuitem id="insertTOCMenuitem" label="&insertTOC.label;" accesskey="&insertTOC.accesskey;" oncommand="UpdateTOC()"/>
            <menuitem id="updateTOCMenuitem" label="&updateTOC.label;" accesskey="&updateTOC.accesskey;" oncommand="UpdateTOC()"/>
            <menuitem id="removeTOCMenuitem" label="&removeTOC.label;" accesskey="&removeTOC.accesskey;" oncommand="RemoveTOC()"/>
          </menupopup>
        </menu>
        <menu id="insertSmartWidgetsMenu" label="&insertSmartWidgetsMenu.label;">
          <menupopup id="insertSmartWidgetsMenuPopup">
            <menuitem label="&madeWithNvu.label;"        oncommand="addMadeWithNvuButton();"/>
            <!-- Kaze: disabled, the resulting code is not HTML-valid
            <menuitem label="&insertCalendarSW.label;"   oncommand="addCalendarSmartWidget();"/> -->
          </menupopup>
        </menu>
        <menu id="insertTemplateElementsMenu" label="&templatesMenu.label;">
          <menupopup id="insertTemplateElementsMenuPopup">
            <menuitem label="&insertEditableArea.label;" oncommand="InsertEditableArea(false)"/>
          </menupopup>
        </menu>
        <menuseparator id="insertMenuSeparator"/>
        <!-- Activate this after Enter key inserts P tag and not BR
        <menuitem accesskey="&insertbreak.accesskey;"      observes="cmd_insertBreak"      label="&insertBreakCmd.label;"/>
        -->
        <menuitem id="insertHTMLSource" accesskey="&insertHTMLCmd.accesskey;"  observes="cmd_insertHTMLWithDialog"  key="inserthtmlkb"/>
        <menuitem id="insertPHPCode"    accesskey="&insertphpcode.accesskey;"  observes="cmd_insertPHPCode"/>
        <menuitem id="insertComment"    accesskey="&insertcomment.accesskey;"  observes="cmd_insertComment"/>
        <menuseparator/>
        <menuitem id="insertBreakAll"   accesskey="&insertbreakall.accesskey;" observes="cmd_insertBreakAll"   label="&insertBreakAllCmd.label;"/>
      </menupopup>
    </menu>

    <menu id="formatMenu" label="&formatMenu.label;" accesskey="&formatmenu.accesskey;">
      <menupopup id="formatMenuPopup" onpopupshowing="EditorInitFormatMenu()">
        <!-- Font face submenu -->
        <menu id="fontFaceMenu" label="&fontfaceMenu.label;" accesskey="&formatfontmenu.accesskey;" 
              position="1" observes="cmd_dtdStrictness2">
          <menupopup oncommand="if (event.target.localName == 'menuitem')
                                  doStatefulCommand('cmd_fontFace', event.target.getAttribute('value'));"
                     onpopupshowing="initFontFaceMenu(this);">
            <menuitem label="&fontVarWidth.label;"      accesskey="&fontvarwidth.accesskey;"    value=""                                type="radio"
                      name="1" observes="cmd_renderedHTMLEnabler"/>
            <menuitem label="&fontFixedWidth.label;"    accesskey="&fontfixedwidth.accesskey;"  value="tt"                              type="radio"
                      name="1" observes="cmd_renderedHTMLEnabler"/>
            <menuseparator/>
            <menuitem label="&fontHelveticaFont.label;" accesskey="&fonthelvetica.accesskey;"   value="Helvetica, Arial, sans-serif"    type="radio"
                      name="2" observes="cmd_renderedHTMLEnabler"/>
            <menuitem label="&fontTimes.label;"         accesskey="&fonttimes.accesskey;"       value="Times New Roman, Times, serif"   type="radio"
                      name="2" observes="cmd_renderedHTMLEnabler"/>
            <menuitem label="&fontCourier.label;"       accesskey="&fontcourier.accesskey;"     value="Courier New, Courier, monospace" type="radio"
                      name="2" observes="cmd_renderedHTMLEnabler"/>
            <menuseparator/>
              <!-- Local font face items added here by initLocalFontFaceMenu() -->
          </menupopup>
        </menu>

        <!-- Font size submenu -->
        <menu id="fontSizeMenu" label="&fontsizeMenu.label;"
              accesskey="&formatsizemenu.accesskey;" 
              position="2">
          <menupopup onpopupshowing="initFontSizeMenu(this)">
          <menuitem label="&decreaseFontSize.label;" accesskey="&decreasefontsize.accesskey;" observes="cmd_decreaseFont" type="radio" name="1" key="decreasefontsizekb"/>
          <menuitem label="&increaseFontSize.label;" accesskey="&increasefontsize.accesskey;" observes="cmd_increaseFont" type="radio" name="1" key="increasefontsizekb"/>
            <menuseparator/>
            <!-- Not supported in current font size implementation
            <menuitem label="&size-xx-smallCmd.label;" accesskey="&size-xx-small.accesskey;" oncommand="EditorSetFontSize('xx-small')" type="radio"
                      name="2" />
            -->
            <menuitem label="&size-x-smallCmd.label;"  accesskey="&size-x-small.accesskey;"  oncommand="EditorSetFontSize('x-small')"  type="radio"
                      name="2" observes="cmd_dtdStrictness"/>
            <menuitem label="&size-smallCmd.label;"    accesskey="&size-small.accesskey;"    oncommand="EditorSetFontSize('small')"    type="radio"
                      name="2" observes="cmd_dtdStrictness"/>
            <menuitem label="&size-mediumCmd.label;"   accesskey="&size-medium.accesskey;"   oncommand="EditorSetFontSize('medium')"   type="radio"
                      name="2" observes="cmd_dtdStrictness"/>
            <menuitem label="&size-largeCmd.label;"    accesskey="&size-large.accesskey;"    oncommand="EditorSetFontSize('large')"    type="radio"
                      name="2" observes="cmd_dtdStrictness"/>
            <menuitem label="&size-x-largeCmd.label;"  accesskey="&size-x-large.accesskey;"  oncommand="EditorSetFontSize('x-large')"  type="radio"
                      name="2" observes="cmd_dtdStrictness"/>
            <menuitem label="&size-xx-largeCmd.label;" accesskey="&size-xx-large.accesskey;" oncommand="EditorSetFontSize('xx-large')" type="radio"
                      name="2" observes="cmd_dtdStrictness"/>
          </menupopup>
        </menu>

        <!-- Font style submenu -->
        <menu id="fontStyleMenu" label="&fontStyleMenu.label;" 
              accesskey="&formatstylemenu.accesskey;"
              position="3">
          <menupopup onpopupshowing="initFontStyleMenu(this)">
            <menuitem label="&styleBoldCmd.label;"        accesskey="&stylebold.accesskey;"         observes="cmd_bold"          type="checkbox" key="boldkb"/>
            <menuitem label="&styleItalicCmd.label;"      accesskey="&styleitalic.accesskey;"       observes="cmd_italic"        type="checkbox" key="italickb" />
            <menuitem label="&styleUnderlineCmd.label;"   accesskey="&styleunderline.accesskey;"    observes="cmd_underline"     type="checkbox" key="underlinekb"/>
            <menuitem label="&styleStrikeThruCmd.label;"  accesskey="&stylestrikethru.accesskey;"   observes="cmd_strikethrough" type="checkbox"/>
            <menuitem label="&styleSuperscriptCmd.label;" accesskey="&stylesuperscript.accesskey;"  observes="cmd_superscript"   type="checkbox"/>
            <menuitem label="&styleSubscriptCmd.label;"   accesskey="&stylesubscript.accesskey;"    observes="cmd_subscript"     type="checkbox"/>
            <menuitem label="&fontFixedWidth.label;"      accesskey="&fontfixedwidth.accesskey;"    observes="cmd_tt"            type="checkbox"/>
            <menuitem label="&styleNonbreakingCmd.label;" accesskey="&stylenonbreaking.accesskey;"  observes="cmd_nobreak"       type="checkbox"/>
            <menuseparator/>
            <menuitem label="&styleEm.label;"             accesskey="&styleEm.accesskey;"           observes="cmd_em"            type="checkbox"/>
            <menuitem label="&styleStrong.label;"         accesskey="&styleStrong.accesskey;"       observes="cmd_strong"        type="checkbox"/>
            <menuitem label="&styleCite.label;"           accesskey="&styleCite.accesskey;"         observes="cmd_cite"          type="checkbox"/>
            <menuitem label="&styleAbbr.label;"           accesskey="&styleAbbr.accesskey;"         observes="cmd_abbr"          type="checkbox"/>
            <menuitem label="&styleAcronym.label;"        accesskey="&styleAcronym.accesskey;"      observes="cmd_acronym"       type="checkbox"/>
            <menuitem label="&styleCode.label;"           accesskey="&styleCode.accesskey;"         observes="cmd_code"          type="checkbox"/>
            <menuitem label="&styleSamp.label;"           accesskey="&styleSamp.accesskey;"         observes="cmd_samp"          type="checkbox"/>
            <menuitem label="&styleVar.label;"            accesskey="&styleVar.accesskey;"          observes="cmd_var"           type="checkbox"/>
          </menupopup>
        </menu>
        
        <!-- Note: "cmd_fontColor" only monitors color state, it doesn't execute the command
             (We should use "cmd_fontColorState" and "cmd_backgroundColorState" ?) -->
        <menuitem id="fontColor" label="&formatFontColor.label;" 
              accesskey="&formatfontcolor.accesskey;"
              observes="cmd_fontColor"
              oncommand="EditorSelectColor('Text', null);"
              position="4">
          <observes element="cmd_fontColor"       attribute="state"/>
          <observes element="cmd_dtdStrictness2"  attribute="disabled"/>
        </menuitem>

        <menu id="directionMenu" label="&writingDirectionMenu.label;" position="5"
              accesskey="&writingdirectionmenu.accesskey;"
              onpopupshowing="InitWritingDirectionMenu()">
          <menupopup oncommand="doStatefulCommand('cmd_direction', event.target.getAttribute('value'))">
            <menuitem id="menu_noDir" label="&defaultDirectionMenu.label;" accesskey="&defaultdirectionmenu.accesskey;"
                      type="radio" name="1" value="none"   observes="cmd_renderedHTMLEnabler" />
            <menuseparator/>
            <menuitem id="menu_ltr" label="&ltrDirectionMenu.label;" accesskey="&ltrdirectionmenu.accesskey;"
                      type="radio" name="1" value="ltr"    observes="cmd_renderedHTMLEnabler" />
            <menuitem id="menu_rtl" label="&rtlDirectionMenu.label;" accesskey="&rtldirectionmenu.accesskey;"
                      type="radio" name="1" value="rtl"    observes="cmd_renderedHTMLEnabler" />
          </menupopup>
        </menu>

        <menuseparator id="removeSep" position="6"/>

        <!-- label and accesskey set at runtime from strings -->
        <menuitem id="removeStylesMenuitem" key="removestyleskb"
              observes="cmd_removeStyles"
              position="7"/>
        <menuitem id="removeLinksMenuitem" key="removelinkskb"
              observes="cmd_removeLinks"
              position="8"/>
        <menuitem id="removeNamedAnchorsMenuitem"  label="&formatRemoveNamedAnchors.label;"
              key="removenamedanchorskb"
              accesskey="&formatRemoveNamedAnchors.accesskey;"
              observes="cmd_removeNamedAnchors"
              position="9"/>
        <menuseparator id="tabSep" position="10"/>

        <!-- Note: the 'Init' menu methods for Paragraph, List, and Align
             assume that the id = 'menu_'+tagName (the 'value' label),
             except for the first ('none') item
         -->
        <!-- Paragraph Style submenu -->
        <menu id="paragraphMenu" label="&paragraphMenu.label;"
              accesskey="&formatparagraphmenu.accesskey;"
              position="11" onpopupshowing="InitParagraphMenu()">
          <menupopup oncommand="doStatefulCommand('cmd_paragraphState', event.target.getAttribute('value'))">
            <menuitem id="menu_bodyText"  type="radio" name="1" label="&bodyTextCmd.label;"             accesskey="&bodytext.accesskey;"
                      value=""      observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_p"         type="radio" name="1" label="&paragraphParagraphCmd.label;"   accesskey="&paragraphparagraph.accesskey;"
                      value="p"     observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_h1"        type="radio" name="1" label="&heading1Cmd.label;"             accesskey="&heading1.accesskey;"
                      value="h1"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_h2"        type="radio" name="1" label="&heading2Cmd.label;"             accesskey="&heading2.accesskey;"
                      value="h2"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_h3"        type="radio" name="1" label="&heading3Cmd.label;"             accesskey="&heading3.accesskey;"
                      value="h3"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_h4"        type="radio" name="1" label="&heading4Cmd.label;"             accesskey="&heading4.accesskey;"
                      value="h4"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_h5"        type="radio" name="1" label="&heading5Cmd.label;"             accesskey="&heading5.accesskey;"
                      value="h5"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_h6"        type="radio" name="1" label="&heading6Cmd.label;"             accesskey="&heading6.accesskey;"
                      value="h6"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_address"   type="radio" name="1" label="&paragraphAddressCmd.label;"     accesskey="&paragraphaddress.accesskey;"
                      value="address"  observes="cmd_renderedHTMLEnabler"/>   
            <menuitem id="menu_pre"       type="radio" name="1" label="&paragraphPreformatCmd.label;"   accesskey="&paragraphpreformat.accesskey;"
                      value="pre"   observes="cmd_renderedHTMLEnabler"/>       
            <menuseparator/>
            <menuitem id="menu_div"       type="radio" name="1" label="&genericContainerCmd.label;"     accesskey="&genericcontainer.accesskey;"
                      value="div"   observes="cmd_renderedHTMLEnabler"/>       
          </menupopup>
        </menu>

        <!-- List Style submenu -->
        <menu id="listMenu" label="&formatlistMenu.label;"
              accesskey="&formatlistmenu.accesskey;"
              position="12" onpopupshowing="InitListMenu()">
          <menupopup>
            <menuitem id="menu_noList" type="radio" name="1" label="&noneCmd.label;"           accesskey="&none.accesskey;"           observes="cmd_removeList"/>
            <menuitem id="menu_ul"     type="radio" name="1" label="&listBulletCmd.label;"     accesskey="&listbullet.accesskey;"     observes="cmd_ul"/>
            <menuitem id="menu_ol"     type="radio" name="1" label="&listNumberedCmd.label;"   accesskey="&listnumbered.accesskey;"   observes="cmd_ol"/>
            <menuitem id="menu_dt"     type="radio" name="1" label="&listTermCmd.label;"       accesskey="&listterm.accesskey;"       observes="cmd_dt"/>
            <menuitem id="menu_dd"     type="radio" name="1" label="&listDefinitionCmd.label;" accesskey="&listdefinition.accesskey;" observes="cmd_dd"/>
            <menuseparator/>
            <menuitem id="listProps" label="&listProps.label;" accesskey="&listprops.accesskey;" observes="cmd_listProperties"/>
          </menupopup>
        </menu>
        <menuseparator id="identingSep" position="13"/>

        <menuitem id="increaseIndent" label="&increaseIndent.label;"  accesskey="&increaseindent.accesskey;"  key="increaseindentkb"
                    observes="cmd_indent" position="14"/>
        <menuitem id="decreaseIndent" label="&decreaseIndent.label;"  accesskey="&decreaseindent.accesskey;"  key="decreaseindentkb"
                  observes="cmd_outdent"  position="15"/>

        <menu id="alignMenu" label="&alignMenu.label;" accesskey="&formatalignmenu.accesskey;"
            onpopupshowing="InitAlignMenu()"
            position="16">
          <!-- Align submenu -->
          <menupopup oncommand="doStatefulCommand('cmd_align', event.target.getAttribute('value'))">
            <menuitem id="menu_left"    label="&alignLeft.label;"  accesskey="&alignleft.accesskey;"      type="radio" name="1"
                      value="left"    observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_center"  label="&alignCenter.label;"  accesskey="&aligncenter.accesskey;"  type="radio" name="1"
                      value="center"  observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_right"   label="&alignRight.label;"   accesskey="&alignright.accesskey;"   type="radio" name="1"
                      value="right"   observes="cmd_renderedHTMLEnabler"/>
            <menuitem id="menu_justify" label="&alignJustify.label;" accesskey="&alignjustify.accesskey;" type="radio" name="1"
                      value="justify" observes="cmd_renderedHTMLEnabler"/>
          </menupopup>
        </menu>
        <menuseparator id="tableSep" position="17"/>
        <!-- Merge Table Menu and separator in Messenger Composer here -->
        <!-- Merge property items here -->
        <menuitem id="snapToGrid" label="&grid.label;" accesskey="&grid.accesskey;"
                  oncommand="goDoCommand('cmd_grid')"   observes="cmd_renderedHTMLEnabler"/>
        <menuseparator/>
        <menuitem id="objectProperties" oncommand="goDoCommand('cmd_objectProperties')" observes="cmd_renderedHTMLEnabler"/>
        <menuitem id="colorsAndBackground" label="&colorsAndBackground.label;"  accesskey="&colorsandbackground.accesskey;"
                  oncommand="goDoCommand('cmd_colorProperties')" observes="cmd_renderedHTMLEnabler"/>
        <menuitem id="pageProperties" label="&pageProperties.label;" accesskey="&pageproperties.accesskey;"      
                  oncommand="goDoCommand('cmd_pageProperties')"  observes="cmd_renderedHTMLEnabler"/>
      </menupopup>
    </menu>

    <menu id="tableMenu" label="&tableMenu.label;" accesskey="&tablemenu.accesskey;">
      <menupopup  onpopupshowing="EditorInitTableMenu()">
        <!-- From EditorCommandOverlay.xul (shared with context popup) -->
        <menu id="tableInsertMenu" label="&tableInsertMenu.label;" accesskey="&tableinsertmenu.accesskey;">
          <menupopup>
            <menuitem label="&insertTableCmd.label;"    accesskey="&tabletable.accesskey;"        observes="cmd_InsertTable"/>
            <menuseparator />
            <menuitem label="&tableRowAbove.label;"     accesskey="&tablerow.accesskey;"          observes="cmd_InsertRowAbove"/>
            <menuitem label="&tableRowBelow.label;"     accesskey="&tablerowbelow.accesskey;"     observes="cmd_InsertRowBelow"/>
            <menuseparator />
            <menuitem label="&tableColumnBefore.label;" accesskey="&tablecolumn.accesskey;"       observes="cmd_InsertColumnBefore"/>
            <menuitem label="&tableColumnAfter.label;"  accesskey="&tablecolumnafter.accesskey;"  observes="cmd_InsertColumnAfter"/>
            <menuseparator />
            <menuitem label="&tableCellBefore.label;"   accesskey="&tablecell.accesskey;"         observes="cmd_InsertCellBefore"/>
            <menuitem label="&tableCellAfter.label;"    accesskey="&tablecellafter.accesskey;"    observes="cmd_InsertCellAfter"/>
          </menupopup>
        </menu>
        <menu id="tableSelectMenu" label="&tableSelectMenu.label;" accesskey="&tableselectmenu.accesskey;">
          <menupopup id="tableSelectPopup">
            <menuitem id="menu_SelectTable"    label="&tableTable.label;"    accesskey="&tabletable.accesskey;"    observes="cmd_SelectTable"    />
            <menuitem id="menu_SelectRow"      label="&tableRow.label;"      accesskey="&tablerow.accesskey;"      observes="cmd_SelectRow"      />
            <menuitem id="menu_SelectColumn"   label="&tableColumn.label;"   accesskey="&tablecolumn.accesskey;"   observes="cmd_SelectColumn"   />
            <menuitem id="menu_SelectCell"     label="&tableCell.label;"     accesskey="&tablecell.accesskey;"     observes="cmd_SelectCell"     />
            <menuitem id="menu_SelectAllCells" label="&tableAllCells.label;" accesskey="&tableallcells.accesskey;" observes="cmd_SelectAllCells" />
          </menupopup>
        </menu>
        <menu id="tableDeleteMenu" label="&tableDeleteMenu.label;" accesskey="&tabledeletemenu.accesskey;">
          <menupopup id="tableDeletePopup">
            <menuitem id="menu_DeleteTable"         label="&tableTable.label;"        accesskey="&tabletable.accesskey;"          observes="cmd_DeleteTable"/>
            <menuitem id="menu_DeleteRow"           label="&tableRows.label;"         accesskey="&tablerow.accesskey;"            observes="cmd_DeleteRow"/>
            <menuitem id="menu_DeleteColumn"        label="&tableColumns.label;"      accesskey="&tablecolumn.accesskey;"         observes="cmd_DeleteColumn"/>
            <menuitem id="menu_DeleteCell"          label="&tableCells.label;"        accesskey="&tablecell.accesskey;"           observes="cmd_DeleteCell"/>
            <menuitem id="menu_DeleteCellContents"  label="&tableCellContents.label;" accesskey="&tablecellcontents.accesskey;"   observes="cmd_DeleteCellContents"/>
          </menupopup>
        </menu>
        <menuseparator />
        <!-- menu label is set in InitTableMenu -->
        <menuitem id="menu_JoinTableCells"   label="&tableJoinCells.label;"   accesskey="&tablejoincells.accesskey;"   observes="cmd_JoinTableCells"/>
        <menuitem id="menu_SlitTableCell"    label="&tableSplitCell.label;"   accesskey="&tablesplitcell.accesskey;"   observes="cmd_SplitTableCell"/>
        <menuitem id="menu_ConvertToTable"   label="&convertToTable.label;"   accesskey="&converttotable.accesskey;"   observes="cmd_ConvertToTable"/>
        <menuseparator />
        <menuitem id="menu_TableOrCellColor" label="&tableOrCellColor.label;" accesskey="&tableOrCellColor.accesskey;" observes="cmd_TableOrCellColor"/>
        <menuitem id="menu_tableProperties"  label="&tableProperties.label;"  accesskey="&tableProperties.accesskey;"  observes="cmd_editTable"/>
      </menupopup>
    </menu>

    <!-- tasks menu filled from tasksOverlay -->
    <menu id="tasksMenu">
      <menupopup id="taskPopup">
        <menuitem      id="menu_cleanup"     observes="cmd_cleanup"/>
        <menuitem      id="menu_validate"    observes="cmd_validate"/>
        <menuseparator id="sep_validate"/>
        <!-- Kaze: add hidden separators for addons overlays -->
        <menuseparator id="sep_addon_menu" hidden="true"/>
        <menuseparator id="sep_addon_list" hidden="true"/>
        <!--<menuseparator id="sep_preferences"/>-->
        <menuitem      id="menu_preferences" observes="cmd_preferences"/>
      </menupopup>
    </menu>

    <!--menu id="windowMenu"/-->

    <!-- help menu filled from globalOverlay -->
    <menu label="&helpMenu.label;" accesskey="&helpmenu.accesskey;" id="helpMenu">
      <!-- Kaze: disable most items for now
      <menupopup id="menu_HelpPopup">
        <menuitem accesskey="&nvucommenu.accesskey;" label="&nvuComMenu.label;" id="nvuComMenu"
                  oncommand="loadExternalURLPref('editor.site.url');"/>
        <menuitem accesskey="&userguidemenu.accesskey;" label="&userGuideMenu.label;" id="userGuideMenu"
                  oncommand="loadExternalURLPref('editor.CCuserGuide.url');"/>
        <menuitem accesskey="&faqmenu.accesskey;" label="&faqMenu.label;"
                  oncommand="loadExternalURLPref('editor.faq.url');"/>
        <menuitem accesskey="&bugreportsmenu.accesskey;" label="&bugReportsMenu.label;"
                  oncommand="loadExternalURLPref('editor.bugReports.url');"/>
        <menuseparator/>
        <menuitem accesskey="&nvudevorgmenu.accesskey;" label="&nvudevOrgMenu.label;"
                  oncommand="loadExternalURLPref('editor.devorg.url');"/>

        <menuitem accesskey="&localizingnvu.accesskey;" label="&localizingNvu.label;"
                  oncommand="loadExternalURLPref('editor.L10N.url');"/>

        <menuitem accesskey="&nvuforumsmenu.accesskey;" label="&nvuForumsMenu.label;"
                  oncommand="loadExternalURLPref('editor.forums.url');"/>
        <menuseparator/>
        <menuitem accesskey="&tipofthedaymenu.accesskey;" label="&tipofthedayMenu.label;"
                  oncommand="document.getElementById('tipoftheday').open(true);"/>
        <menuseparator id="menu_HelpAboutSeparator"/>
        <menuitem accesskey="&aboutlinspire.accesskey;" label="&aboutLinspire.label;"
                  oncommand="loadExternalURLPref('editor.aboutLinspire.url');"/>
        <menuitem accesskey="&aboutDI.accesskey;" label="&aboutDI.label;"
                  oncommand="loadExternalURLPref('editor.aboutDI.url');"/>
        <menuitem id="aboutName" accesskey="&aboutmenu.accesskey;"
                  label="&aboutMenu.label;"
                  oncommand="window.openDialog('chrome://editor/content/aboutDialog.xul', 'About', 'modal,centerscreen,chrome,resizable=no');"/>
      </menupopup>
      -->
      <menupopup id="menu_HelpPopup">
        <menuitem accesskey="&nvuforumsmenu.accesskey;" label="&nvuForumsMenu.label;"
                  oncommand="loadExternalURLPref('editor.forums.url');"/>
        <menuitem accesskey="&bugreportsmenu.accesskey;" label="&bugReportsMenu.label;"
                  oncommand="loadExternalURLPref('editor.bugReports.url');"/>
        <menuitem accesskey="&supportKompoZer.accesskey;" label="&supportKompoZer.label;"
                  oncommand="loadExternalURLPref('editor.support.url');"/>
        <menuseparator/>
        <menuitem accesskey="&tipofthedaymenu.accesskey;" label="&tipofthedayMenu.label;"
                  oncommand="document.getElementById('tipoftheday').open(true);"/>
        <menuseparator id="menu_HelpAboutSeparator"/>
        <menuitem accesskey="&nvucommenu.accesskey;" label="&nvuComMenu.label;" id="nvuComMenu"
                  oncommand="loadExternalURLPref('editor.site.url');"/>
        <menuitem id="aboutName" accesskey="&aboutmenu.accesskey;"
                  label="&aboutMenu.label;"
                  oncommand="window.openDialog('chrome://editor/content/aboutDialog.xul', 'About', 'modal,centerscreen,chrome,resizable=no');"/>
      </menupopup>
    </menu>

    <spacer flex="1"/>
  </menubar>
