/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Nvu.
 *
 * The Initial Developer of the Original Code is Linspire Inc..
 *
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <glazman@disruptive-innovations.com> on behalf of Linspire Inc.
 *
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

#include "diIIconFinder.h"

#define DIICONFINDER_CONTRACTID "@disruptive-innovations.com/nvu/iconfinder;1"

//{f4e63120-8a32-49ac-b9e6-098bbdfa27ca}
#define DIICONFINDER_CID { 0xf4e63120, 0x8a32, 0x49ac, { 0xb9, 0xe6 ,0x09, 0x8b, 0xbd, 0xfa, 0x27, 0xca}}

// the following ifdef LINSPIRE section _must_ occur before the
// ifdef SITE_MANAGER_KDE_ICON_STYLE section
#ifdef LINSPIRE
#define KDE_ICONS NS_LITERAL_STRING("file:/usr/share/icons/Lindows-Crystal/16x16/mimetypes/")
#endif

#ifdef SITE_MANAGER_KDE_ICON_STYLE
#include <kurl.h>
#include <kmimetype.h>
#define KDE_ICONS NS_LITERAL_STRING("file:/usr/share/icons/default.kde/16x16/mimetypes/")
#endif

/* Header file */
class diIconFinder : public diIIconFinder
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_DIIICONFINDER

  diIconFinder();

private:
  ~diIconFinder();

protected:
  /* additional members */
};

