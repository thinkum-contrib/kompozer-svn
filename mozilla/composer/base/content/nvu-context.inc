    <popup id="editorContentContext"   
      onpopupshowing="EditorFillContextMenu(event, this); RealTimeSpell.updateMenu('spellSuggestionsMenu','spellSuggestionsMenuSeparator')"> 
       <menu id="spellSuggestionsMenu" label="&spellSuggestions.label;"
                                       accesskey="&spellSuggestions.accesskey;">
         <menupopup id="spellSuggestionsMenuPopup"
                    onpopupshowing="RealTimeSpell.updateSuggestionsMenu(this,'spellAddToDictionary','spellAddSep',null);"
                    oncommand="RealTimeSpell.selectSuggestion(event.target.value,null,null);">
           <menuitem id="spellAddToDictionary" label="&spellAddToDictionary.label;"
                     oncommand="RealTimeSpell.addToDictionary(null,null);"/>
           <menuseparator id="spellAddSep"/>
         </menupopup>
       </menu>
       <menuseparator id="spellSuggestionsMenuSeparator"/>

       <menuitem id="menu_undo_cm"   label="&undoCmd.label;" accesskey="&undo.accesskey;" command="cmd_undo"/>
       <menuitem id="menu_redo_cm"   label="&redoCmd.label;" accesskey="&redo.accesskey;" command="cmd_redo"/>
       <menuseparator id="undoredo-separator"/>
       
       <menuitem id="menu_cut_cm"    label="&cutCmd.label;"    accesskey="&cut.accesskey;"   command="cmd_cut"/>
       <menuitem id="menu_copy_cm"   label="&copyCmd.label;"   accesskey="&copy.accesskey;"  command="cmd_copy"/>
       <menuitem id="menu_paste_cm"  label="&pasteCmd.label;"  accesskey="&paste.accesskey;" command="cmd_paste"/>
       <menuitem id="menu_pasteNoFormatting_cm" command="cmd_pasteNoFormatting"/>
       <menuitem id="menu_delete_cm" label="&deleteCmd.label;" accesskey="&delete.accesskey;" command="cmd_delete"/>
       <menuseparator id="edit-separator"/>
       <menuitem id="menu_selectAll_cm" label="&selectAllCmd.label;" accesskey="&selectall.accesskey;" command="cmd_selectAll"/>
       <menuseparator id="selectAll-separator"/>
       
       <!-- label and accesskey set at runtime from strings -->
       <menuitem id="removeStylesMenuitem_cm"
             observes="cmd_removeStyles"/>
       <menuitem id="createLink_cm" label="&createLinkCmd.label;" accesskey="&createlink.accesskey;" command="cmd_link"/>
       <!-- label and accesskey set at runtime from strings -->
       <menuitem id="removeLinksMenuitem_cm" observes="cmd_removeLinks"/>
       <menuitem id="removeNamedAnchorsMenuitem_cm"  label="&formatRemoveNamedAnchors.label;"   
             accesskey="&formatRemoveNamedAnchors.accesskey;"
             observes="cmd_removeNamedAnchors"/>
       <menuseparator id="styles-separator"/>

       <!-- label and accesskey are set in InitObjectProperties -->
       <menuitem id="objectProperties_cm" observes="cmd_objectProperties"/>
       <menuitem id="editLink_cm" label="&editLinkCmd.label;" accesskey="&editlink.accesskey;" command="cmd_editLink"/>
       <menuseparator id="property-separator"/>

       <!-- Can't get submenus to load from a shared overlay -->
       <menu id="tableInsertMenu_cm" label="&tableInsertMenu2.label;" accesskey="&tableinsertmenu.accesskey;">
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
       <menu id="tableSelectMenu_cm" label="&tableSelectMenu2.label;" accesskey="&tableselectmenu.accesskey;">
         <menupopup>
           <menuitem id="menu_SelectTable"    label="&tableTable.label;"    accesskey="&tabletable.accesskey;"    observes="cmd_SelectTable"    />
           <menuitem id="menu_SelectRow"      label="&tableRow.label;"      accesskey="&tablerow.accesskey;"      observes="cmd_SelectRow"      />
           <menuitem id="menu_SelectColumn"   label="&tableColumn.label;"   accesskey="&tablecolumn.accesskey;"   observes="cmd_SelectColumn"   />
           <menuitem id="menu_SelectCell"     label="&tableCell.label;"     accesskey="&tablecell.accesskey;"     observes="cmd_SelectCell"     />
           <menuitem id="menu_SelectAllCells" label="&tableAllCells.label;" accesskey="&tableallcells.accesskey;" observes="cmd_SelectAllCells" />
         </menupopup>
       </menu>
       <menu id="tableDeleteMenu_cm" label="&tableDeleteMenu2.label;" accesskey="&tabledeletemenu.accesskey;">
         <menupopup>
           <menuitem id="menu_DeleteTable"         label="&tableTable.label;"        accesskey="&tabletable.accesskey;"          observes="cmd_DeleteTable"/>
           <menuitem id="menu_DeleteRow"           label="&tableRows.label;"         accesskey="&tablerow.accesskey;"            observes="cmd_DeleteRow"/>
           <menuitem id="menu_DeleteColumn"        label="&tableColumns.label;"      accesskey="&tablecolumn.accesskey;"         observes="cmd_DeleteColumn"/>
           <menuitem id="menu_DeleteCell"          label="&tableCells.label;"        accesskey="&tablecell.accesskey;"           observes="cmd_DeleteCell"/>
           <menuitem id="menu_DeleteCellContents"  label="&tableCellContents.label;" accesskey="&tablecellcontents.accesskey;"   observes="cmd_DeleteCellContents"/>
         </menupopup>
       </menu>
       <!-- menu label is set in InitTableMenu -->
       <menuitem id="joinTableCells_cm"   label="&tableJoinCells.label;" accesskey="&tablejoincells.accesskey;" observes="cmd_JoinTableCells"/>
       <menuitem id="splitTableCell_cm"   label="&tableSplitCell.label;" accesskey="&tablesplitcell.accesskey;" observes="cmd_SplitTableCell"/>
       <menuitem id="tableOrCellColor_cm" label="&tableOrCellColor.label;" accesskey="&tableOrCellColor.accesskey;" observes="cmd_TableOrCellColor"/>
    </popup>

    <popup id="editorSourceContext">
      <menuitem label="&undoCmd.label;"      accesskey="&undo.accesskey;"      command="cmd_undo"/>
      <menuitem label="&redoCmd.label;"      accesskey="&redo.accesskey;"      command="cmd_redo"/>
      <menuseparator/>
      <menuitem label="&cutCmd.label;"       accesskey="&cut.accesskey;"       command="cmd_cut"/>
      <menuitem label="&copyCmd.label;"      accesskey="&copy.accesskey;"      command="cmd_copy"/>
      <menuitem label="&pasteCmd.label;"     accesskey="&paste.accesskey;"     command="cmd_paste"/>
      <menuitem label="&deleteCmd.label;"    accesskey="&delete.accesskey;"    command="cmd_delete"/>
      <menuseparator/>
      <menuitem label="&selectAllCmd.label;" accesskey="&selectall.accesskey;" command="cmd_selectAll"/>
    </popup>

    <popup id="structToolbarContext">
      <menuitem id="structSelect"     label="&structSelect.label;"
                                      accesskey="&structSelect.accesskey;"
                                      oncommand="StructSelectTag()"/>
      <menuseparator/>
      <menuitem id="structRemoveTag"  label="&structRemoveTag.label;"
                                      accesskey="&structRemoveTag.accesskey;"
                                      oncommand="StructRemoveTag()"/>
      <menuitem id="structChangeTag"  label="&structChangeTag.label;"
                                      accesskey="&structChangeTag.accesskey;"
                                      oncommand="StructChangeTag()"/>
      <menuseparator/>
      <menu id="templateElementsContextMenu" label="&templatesMenu.label;">
        <menupopup onpopupshowing="TweakTemplateContextMenu()">
          <menuitem label="&makeEditableArea.label;"
                    id="makeEditableContextMenu"
                    oncommand="InsertEditableArea(true)"/>
          <menuitem label="&removeEditableArea.label;"
                    id="removeEditableContextMenu"
                    oncommand="RemoveEditableArea()"/>
        </menupopup>
      </menu>
      <menuseparator/>
      <!-- Kaze: some items have been moved to KaZcadeS' overlay -->
      <menuitem id="advancedPropsTag" label="&advancedPropertiesCmd.label;"
                                      accesskey="&advancedproperties.accesskey;"
                                      oncommand="OpenAdvancedProperties()"/>
    </popup>
