KompoZer - developer notes

+===============================+
| 1. MAIN CHROME (COMPOSER)     |
+===============================+

  The 'mozilla/composer' dir has been deeply modified.
  There is no patch for that, but all changes should be marked in the code. 

  The 'cascades' extension has been modified, too.
  It has been moved from mozilla/extensions/editor to mozilla/composer/extensions

  KompoZer contributors should focus on the mozilla/composer dir. Most bugs are there.


+===============================+
| 2. CORE PATCHES               |
+===============================+

  Outside of the 'mozilla/composer' directory, I've kept original files with a .orig extension.
  There is one patch per bug found (diff -u file.cpp.orig file.cpp > bugfix.patch).

  # HTML 4.01 doctype bug (packed)
  > mozilla/netwerk/protocol/about/src/nsAboutBlank.cpp
  > mozilla/netwerk/protocol/about/src/nsAboutStrictBlank.cpp

  # menulist.xml bug (packed)
  > mozilla/toolkit/content/widgets/menulist.xml
  this does NOT solve the problem but the error is now hidden (I should apply for a job at Microsoft).

  # Absolute position handler bug (still in progress)
  > mozilla/editor/composer/src/res/EditorOverride.css
  > mozilla/editor/libeditor/html/nsHTMLAbsPosition.cpp
  The grabber icon, the shadow and the resizers are created as anonymous children of <body>
  whereas they should be siblings of the element itself.

  ? nsHTMLEditRules.cpp has been patched but some lines have been rejected.

  # 233861.NSS-deadcode.patch
  > mozilla/security/coreconf/rules.mk
  Removes dead code in the NSS (security) subdir + GNUmake 3.81 doesn't output such errors any more :
      syntax error at -e line 3, near "while"
      syntax error at -e line 7, near "}"
      Execution of -e aborted due to compilation errors.
  see https://bugzilla.mozilla.org/show_bug.cgi?id=325148 for more information.

  # small changes related to KaZcadeS
  > mozilla/editor/ui/composer/content/editorUtilities.js
  > mozilla/editor/ui/composer/locale/en-US/editorOverlay.dtd
  > mozilla/editor/ui/dialogs/content/EdDialogOverlay.xul


+===============================+
| 3. CONTRIBUTED CORE PATCHES   |
+===============================+

  # 1540469-motohiko.patch (Motohiko)
  enable the extension manager to uninstall language packs
  make the extension manager really multilingual - BIG THANKS FOR THAT ONE!

  # 171349-aviary.patch (Motohiko)
  correctly display the application icon on win9x

  # 292530.aviary_10x.2.patch
  required to build on MacOS X Tiger

  # os2warp.zip 
  various patches required to build on OS/2

  # amd64.patch (aj@indaco.de)
  required to build on amd64 + solves bug #284386 related to GCC 4.1
  https://bugzilla.mozilla.org/show_bug.cgi?id=284386
  http://live.gnome.org/JhbuildIssues/mozilla#line-63 

  # JP_BP.patch
  required to build with GCC 4.1 but doesn't work with GCC4.0 and earlier
  mozilla-1.7.12-dumpstack.patch should do the work, too, but it's way more complex - couldn't get the point


+===============================+
| 4. BUILDING FROM SOURCE       |
+===============================+

  adapted from http://www.nvu.com/Building_From_Source.php

   1. Check the build requirements: 
        Linux  : http://developer.mozilla.org/en/docs/Linux_Build_Prerequisites
	MacOS X: http://developer.mozilla.org/en/docs/Mac_OS_X_Build_Prerequisites
	Windows: http://developer.mozilla.org/en/docs/Windows_Build_Prerequisites
      Warning: Nvu and KompoZer are based upon Gecko 1.7 (aviary branch).
      With Ubuntu 6.10 (Dapper Drake), this command should be enough:
	sudo apt-get install build-essential pkg-config gtk2-dev libidl-dev libxt-dev 

   2. Get the code tarball here:
        http://prdownloads.sourceforge.net/kompozer/kompozer-XXX-src.tar-bz2?download

   3. Unzip the source:
        tar xfj kompozer-XXX-src.tar.bz2

   4. Edit the mozilla/.mozconfig file according to your wishes and system configuration.
      This default .mozconfig file is the one I've used to build KompoZer on Slackware (ZenWalk 4.6.1).
      There are mozconfig files for Fedora, Linspire, Debian/Ubuntu, MacOS X and Windows in the mozilla/composer/config directory.

   5. Build the code in the 'mozilla' directory:
        make -f client.mk build_all
      or since we don't care about CVS any more for this branch:
        ./configure
	./make

   6. Test your build in the mozilla/dist/bin directory:
        dist/bin/kompozer


  WARNING #1: On *NIX systems, the mozilla/dist/bin directory is full of symlinks.
  To make a valid binary archive, these symlinks have to be dereferenced.
  It is recommended to use the included snapshot* scripts to make source and binary tarballs.

  WARNING #2: when using GNU make > 3.80, the following errors will be reported:
      syntax error at -e line 3, near "while"
      syntax error at -e line 7, near "}"
      Execution of -e aborted due to compilation errors.
  This seems harmless on Linux. This *WILL* break the build on Windows.
  This happens mostly (if not only) in the NSS subdir. See bug #325148 for more information:
    https://bugzilla.mozilla.org/show_bug.cgi?id=325148

  WARNING #3: on most Linux distros (at least Slackware and Debian), the 'enable-xprint' compilation option won't work.
  workaround #1: unzip the included 'x11proto-print-dev_1.0.3-1.tgz' tarball
  workaround #2: disable-xprint in the .mozconfig file


+===============================+
| 5. CHANGELOG                  |
+===============================+

Locales

  * reorganize all current langpacks
  * totd.dtd > shorter button names
  * pref. window > char encoding > no-break-space
  * format toolbar 1 & 2 > format toolbar | (inline) style toolbar
  + new buttons: div (block container), span (inline container)


_________________________________

Version 0.8.x

  Application
  * fixed: the extension manager is now able to use the extensions proper locales (BIG thanks to Motohiko!)
  * TODO : in the locales, all branding has been moved to a single file
  * fixed: the same source code now builds on Linux (gcc4.1), MacOSX (gcc3.5), Win32 (vs7.0) and OS/2 (?).
  * TODO : (win**) cannot launch KompoZer and Nvu simultaneously + various similary bugs
  * fixed: (win9x) KompoZer now has its own icon in the taskbar (Motohiko again)
  * fixed: the icon has been changed (thanks Alain & Aubin!)... /Besser so?/ ;-)

  HTML Editor
  * TODO : absolute position handler & shadow
  * fixed: links can be styled in wysiwyg ('why do my links stay blue?')
  * fixed: display a clickable label on objects, scripts and hidden form inputs ('normal' & 'HTML tags' views)
  * added: red dotted borders around <div> containers ('normal' & 'HTML tags' views)
  * fixed: hiding the rulers improves speed and reliability
  * fixed: bug in the vertical ruler that causes Nvu/KompoZer to be stuck in 'source' mode
  * TODO : design 'properties' boxes for <object>, <script> and <div>
  * TODO : bug fixing in the Markup Cleaner (cf. Charles Cooke + empty id/class attributes)
  * TODO : remember choices in the Markup Cleaner
  * TODO : opening two tabs and right-click > refresh on the first one crashes Kz 0.7x (this was a regression :-/)
  * TODO : the tabeditor does not remember the 'block outlines' pref
  * TODO : no more freeze after joining cells in a table (http://forum.nvudev.org/viewtopic.php?p=15271#15271)
  * TODO : no more freeze when getting back from source mode (http://forum.nvudev.org/viewtopic.php?t=4440)
  * TODO : no more freeze when dragging a layer above over the toolbar (http://forum.nvudev.org/viewtopic.php?p=15278#15278)
  * TODO : better <iframe> support
  * TODO : new 'made with KompoZer' icon hosted on SourceForge.net
  * TODO : reorganize toolbars (one 'format' toolbar + one 'inline styles' toolbar)

  CSS Editor
  * added: 'Edit selector' dialog in the CSS editor
  * fixed: a few bugs in the 'background' tab (opacity, background-position)
  * fixed: small UI bug in the 'border' tab
  * added: spin buttons in the 'box' tab
  * modified: no more 'expert' mode in the CSS editor
  * modified: -100px on the CSS editor window width :-)
  * modified: single window for all inline styles
  * TODO : classes and inline styles should be applied to the first container (http://www.nvu-composer.de/forum/viewtopic.php?p=7675#7675)
  * added: in the status bar, tags are written in italic if they have inline styles

  Site Manager
  ? fixed: (Linux) when no browser is available by default, ask user to choose one
  ? added: external application support
  ? added: dual local/remote view (eases publishing with external apps)
  ? added: option to init the filepicker on the current document's directory instead of the last open directory
  * TODO : more file types (html, css, text, images, media) with user-defined file extensions
  ? fixed: file types are now consistent in all filepickers
  * TODO : shows the last open file on startup
  * NOTA : this site manager is already part of Mozilla Composer 2


