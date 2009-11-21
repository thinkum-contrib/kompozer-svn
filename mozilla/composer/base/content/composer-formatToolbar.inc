  <toolbarpalette>

    <toolbaritem id="ParagraphSelectBox">
      <menulist id="ParagraphSelect" observes="cmd_renderedHTMLEnabler"
        tooltiptext="&ParagraphSelect.tooltip;">
        <observes element="cmd_paragraphState" attribute="state" onbroadcast="onParagraphFormatChange(this.parentNode, 'cmd_paragraphState')"/>
        <menupopup id="ParagraphPopup" oncommand="doStatefulCommand('cmd_paragraphState', event.target.value)">
          <menuitem label="&bodyTextCmd.label;"            value=""/>
          <menuitem label="&paragraphParagraphCmd.label;"  value="p"/>
          <menuitem label="&heading1Cmd.label;"            value="h1"/>
          <menuitem label="&heading2Cmd.label;"            value="h2"/>
          <menuitem label="&heading3Cmd.label;"            value="h3"/>
          <menuitem label="&heading4Cmd.label;"            value="h4"/>
          <menuitem label="&heading5Cmd.label;"            value="h5"/>
          <menuitem label="&heading6Cmd.label;"            value="h6"/>
          <menuitem label="&paragraphAddressCmd.label;"    value="address"/>
          <menuitem label="&paragraphPreformatCmd.label;"  value="pre"/>
          <menuseparator />
          <menuitem label="&genericContainerCmd.label;"    value="div"/>
        </menupopup>
      </menulist>
    </toolbaritem>

    <!-- This one is not ready yet
    <toolbaritem id="FontSizeSelectBox">
      <menulist class="toolbar-focustarget" id="FontSizeSelect" oncommand="EditorSelectFontSize()"  tooltiptext="&FontSizeSelect.tooltip;" crop="right">
        <observes element="cmd_fontSize" attribute="state" onbroadcast="onFontSizeChange(this.parentNode, 'cmd_fontSize')"/>
        <menupopup>
          <menuitem label="&size-xx-smallCmd.label;"/>
          <menuitem label="&size-x-smallCmd.label;"/>
          <menuitem label="&size-smallCmd.label;"/>
          <menuitem label="&size-mediumCmd.label;"/>
          <menuitem label="&size-largeCmd.label;"/>
          <menuitem label="&size-x-largeCmd.label;"/>
          <menuitem label="&size-xx-largeCmd.label;"/>
        </menupopup>
      </menulist>
    </toolbaritem -->

    <toolbaritem id="FontFaceSelectBox">
      <menulist class="toolbar-focustarget" id="FontFaceSelect" observes="cmd_dtdStrictness2" tooltiptext="&FontFaceSelect.tooltip;" crop="right">
        <observes element="cmd_fontFace" attribute="state" onbroadcast="onFontFaceChange(this.parentNode, 'cmd_fontFace')"/>
        <menupopup id="FontFacePopup" oncommand="doStatefulCommand('cmd_fontFace', event.target.value)" onpopupshowing="initFontFaceMenu(this);">
          <menuitem label="&fontVarWidth.label;"      value=""/>
          <menuitem label="&fontFixedWidth.label;"    value="tt"/>
          <menuseparator/>
          <menuitem label="&fontHelveticaFont.label;" value="Helvetica, Arial, sans-serif"/>
          <menuitem label="&fontTimes.label;"         value="Times New Roman, Times, serif"/>
          <menuitem label="&fontCourier.label;"       value="Courier New, Courier, monospace"/>
          <menuseparator/>
        </menupopup>
      </menulist>
    </toolbaritem>

    <toolbaritem id="ColorButtonsBox">
      <stack id="ColorButtons" align="center" label="Colors">
        <observes element="cmd_fontColor"       attribute="state" onbroadcast="onFontColorChange()"/>
        <observes element="cmd_backgroundColor" attribute="state" onbroadcast="onBackgroundColorChange()"/>
        <box class="color-button" id="BackgroundColorButton"
              observes="cmd_dtdStrictness2"
              onclick="EditorSelectColor('', event, this);"
              tooltiptext="&BackgroundColorButton.tooltip;"/>
        <box class="color-button" id="TextColorButton"
              observes="cmd_dtdStrictness2"
              onclick="EditorSelectColor('Text', event, this);"
              tooltiptext="&TextColorButton.tooltip;"/>
      </stack>
    </toolbaritem>

    <toolbaritem id="ClassButtonsBox">
      <menulist class="toolbar-focustarget" id="ClassSelect" observes="cmd_renderedHTMLEnabler"
                tooltiptext="&applyClassToSelectionCmd.tooltip;">
        <observes element="cmd_class" attribute="state" onbroadcast="onClassChange(this.parentNode, 'cmd_class')"/>
        <menupopup id="ClassPopup" oncommand="doStatefulCommand('cmd_class', event.target.value)" onpopupshowing="initClassMenu(this);">
          <menuitem label="&noClass.label;" id="NoClassMenuItem"/>
        </menupopup>
      </menulist>
    </toolbaritem>

    <toolbarbutton id="HighlightColorButton" tooltip="aTooltip"
                   tooltiptext="&HighlightColorButton.tooltip;" command="cmd_highlight">
      <observes element="cmd_highlight" attribute="state" onbroadcast="onHighlightColorChange()"/>
      <observes element="cmd_highlight" attribute="collapsed"/>
    </toolbarbutton>

    <toolbarbutton id="DecreaseFontSizeButton" observes="cmd_decreaseFont"
                   tooltiptext="&decreaseFontSizeToolbarCmd.tooltip;"/>

    <toolbarbutton id="IncreaseFontSizeButton" observes="cmd_increaseFont"
                   tooltiptext="&increaseFontSizeToolbarCmd.tooltip;"/>

    <toolbarbutton id="boldButton" type="checkbox" autoCheck="false" observes="cmd_bold"
                   tooltiptext="&boldToolbarCmd.tooltip;">
      <observes element="cmd_bold" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_bold')"/>
    </toolbarbutton>

    <toolbarbutton id="emButton" type="checkbox" autoCheck="false" observes="cmd_em"
                   tooltiptext="&emButton.tooltip;">
      <observes element="cmd_em" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_em')"/>
    </toolbarbutton>

    <toolbarbutton id="strongButton" type="checkbox" autoCheck="false" observes="cmd_strong"
                   tooltiptext="&strongButton.tooltip;">
      <observes element="cmd_strong" type="checkbox" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_strong')"/>
    </toolbarbutton>

    <toolbarbutton id="italicButton" type="checkbox" autoCheck="false" observes="cmd_italic"
                   tooltiptext="&italicToolbarCmd.tooltip;">
      <observes element="cmd_italic" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_italic')"/>
    </toolbarbutton>

    <toolbarbutton id="underlineButton" type="checkbox" autoCheck="false" observes="cmd_underline"
                   tooltiptext="&underlineToolbarCmd.tooltip;">
      <observes element="cmd_underline" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_underline')"/>
    </toolbarbutton>

    <toolbarbutton id="ulButton" type="radio" group="lists" autoCheck="false" observes="cmd_ul"
                   tooltiptext="&bulletListToolbarCmd.tooltip;">
        <observes element="cmd_ul" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_ul')"/>
    </toolbarbutton>

    <toolbarbutton id="olButton" type="radio" group="lists" autoCheck="false" observes="cmd_ol"
                   tooltiptext="&numberListToolbarCmd.tooltip;">
        <observes element="cmd_ol" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_ol')"/>
    </toolbarbutton>

    <toolbarbutton id="dtButton" type="radio" group="lists" autoCheck="false" observes="cmd_dt"
                   tooltiptext="&definitionTermToolbarCmd.tooltip;">
        <observes element="cmd_dt" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_dt')"/>
    </toolbarbutton>

    <toolbarbutton id="ddButton" type="radio" group="lists" autoCheck="false" observes="cmd_dd"
                   tooltiptext="&definitionDescriptionToolbarCmd.tooltip;">
        <observes element="cmd_dd" attribute="state" onbroadcast="onButtonUpdate(this.parentNode, 'cmd_dd')"/>
    </toolbarbutton>

    <toolbarbutton id="outdentButton" observes="cmd_outdent"
                   tooltiptext="&outdentToolbarCmd.tooltip;"/>

    <toolbarbutton id="indentButton" observes="cmd_indent"
                   tooltiptext="&indentToolbarCmd.tooltip;"/>

    <toolbarbutton id="align-left-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_dtdStrictness2"
                   oncommand="doStatefulCommand('cmd_align', 'left')"
                   tooltiptext="&alignLeft.tooltip;" >
      <observes element="cmd_align" attribute="state" 
                onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_align', 'left')" />
    </toolbarbutton>

    <toolbarbutton id="align-center-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_dtdStrictness2"
                   oncommand="doStatefulCommand('cmd_align', 'center')"
                   tooltiptext="&alignCenter.tooltip;" >
      <observes element="cmd_align" attribute="state" 
                onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_align', 'center')"/>
    </toolbarbutton>

    <toolbarbutton id="align-right-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_dtdStrictness2"
                   oncommand="doStatefulCommand('cmd_align', 'right')"
                   tooltiptext="&alignRight.tooltip;" >
      <observes element="cmd_align" attribute="state"
                onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_align', 'right')"/>
    </toolbarbutton>

    <toolbarbutton id="align-justify-button" type="radio" group="align" autoCheck="false"
                   observes="cmd_dtdStrictness2"
                   oncommand="doStatefulCommand('cmd_align', 'justify')"
                   tooltiptext="&alignJustify.tooltip;" >
      <observes element="cmd_align" attribute="state"
                onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_align', 'justify')"/>
    </toolbarbutton>

    <toolbarbutton id="absolutePositionButton" type="checkbox" tooltiptext="&layer.tooltip;" observes="cmd_absPos">
      <observes element="cmd_absPos" attribute="state" onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_absPos', 'absolute')"/>
    </toolbarbutton>

    <toolbarbutton id="decreaseZIndexButton" observes="cmd_decreaseZIndex"
                   tooltiptext="&layerSendToBack.tooltip;"/>

    <toolbarbutton id="increaseZIndexButton" observes="cmd_increaseZIndex"
                   tooltiptext="&layerBringToFront.tooltip;"/>

    <toolbarbutton id="blockBordersButton" observes="cmd_blockBorders"
                   tooltiptext="&blockBorders.tooltip;"/>

    <toolbarbutton id="dirLtrButton" type="radio" group="direction" autoCheck="false"
                   oncommand="doStatefulCommand('cmd_direction', 'ltr')"
                   tooltiptext="&dirLtr.tooltip;" >
      <observes element="cmd_direction" attribute="state" 
                onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_direction', 'ltr')" />
    </toolbarbutton>

    <toolbarbutton id="dirRtlButton" type="radio" group="direction" autoCheck="false"
                   oncommand="doStatefulCommand('cmd_direction', 'rtl')"
                   tooltiptext="&dirRtl.tooltip;" >
      <observes element="cmd_direction" attribute="state" 
                onbroadcast="onStateButtonUpdate(this.parentNode, 'cmd_direction', 'rtl')" />
    </toolbarbutton>

    <toolbarbutton id="leftGluedButton" tooltiptext="&leftGlued.tooltip;" observes="cmd_glues"
                   oncommand="doStatefulCommand('cmd_glues', 'left-pixels')" />

    <toolbarbutton id="centerGluedButton" tooltiptext="&centerGlued.tooltip;" observes="cmd_glues"
                   oncommand="doStatefulCommand('cmd_glues', 'center-pixels')" />

    <toolbarbutton id="rightGluedButton" tooltiptext="&rightGlued.tooltip;" observes="cmd_glues"
                   oncommand="doStatefulCommand('cmd_glues', 'right-pixels')" />

    <toolbarbutton id="topGluedButton" tooltiptext="&topGlued.tooltip;" observes="cmd_glues"
                   oncommand="doStatefulCommand('cmd_glues', 'top-pixels')" />

    <toolbarbutton id="middleGluedButton" tooltiptext="&middleGlued.tooltip;" observes="cmd_glues"
                   oncommand="doStatefulCommand('cmd_glues', 'middle-pixels')" />

    <toolbarbutton id="bottomGluedButton" tooltiptext="&bottomGlued.tooltip;" observes="cmd_glues"
                   oncommand="doStatefulCommand('cmd_glues', 'bottom-pixels')" />

  </toolbarpalette>
  <!-- Kaze: splitting the format toolbar -->
  <toolbar class="chromeclass-toolbar" id="FormatToolbar1" persist="hidden" tbalign="center" grippytooltiptext="&formatToolbar.tooltip; 1"
           customizable="true"
           context="format-toolbar-context-menu"
           toolbarname="Format1"
           mode="icons"
defaultset="spacer,ParagraphSelectBox,ClassButtonsBox,separator,emButton,strongButton,separator,olButton,ulButton,separator,indentButton,outdentButton,separator,dtButton,ddButton,spring,absolutePositionButton,increaseZIndexButton,decreaseZIndexButton">
<!-- defaultset="spacer,ParagraphSelectBox,ClassButtonsBox,separator,emButton,strongButton,separator,olButton,ulButton,separator,indentButton,outdentButton,separator,dtButton,ddButton,separator,absolutePositionButton,increaseZIndexButton,decreaseZIndexButton,separator,leftGluedButton,centerGluedButton,rightGluedButton,separator,topGluedButton,middleGluedButton,bottomGluedButton" -->
  </toolbar>
  <toolbar class="chromeclass-toolbar" id="FormatToolbar2" persist="hidden" tbalign="center" grippytooltiptext="&formatToolbar.tooltip; 2"
           customizable="true"
           context="format-toolbar-context-menu"
           toolbarname="Format2"
           mode="icons"
defaultset="spacer,FontFaceSelectBox,separator,ColorButtonsBox,HighlightColorButton,separator,DecreaseFontSizeButton,IncreaseFontSizeButton,separator,boldButton,italicButton,underlineButton,separator,align-left-button,align-center-button,align-right-button,align-justify-button">
  </toolbar>
  <toolbarset id="customToolbars" context="format-toolbar-context-menu"/>
