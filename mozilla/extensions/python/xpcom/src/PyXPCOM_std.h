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
 * The Original Code is the Python XPCOM language bindings.
 *
 * The Initial Developer of the Original Code is
 * ActiveState Tool Corp.
 * Portions created by the Initial Developer are Copyright (C) 2000
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Mark Hammond <mhammond@skippinet.com.au> (original author)
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

// standard include - sets up all the defines used by
// the mozilla make process - too lazy to work out how to integrate
// with their make, so this will do!

//
// This code is part of the XPCOM extensions for Python.
//
// Written May 2000 by Mark Hammond.
//
// Based heavily on the Python COM support, which is
// (c) Mark Hammond and Greg Stein.
//
// (c) 2000, ActiveState corp.

#include <Python.h>

#ifdef HAVE_LONG_LONG
	// Mozilla also defines this - we undefine it to
	// prevent a compiler warning.
#	undef HAVE_LONG_LONG
#endif // HAVE_LONG_LONG

#include "nsIAllocator.h"
#include "nsIWeakReference.h"
#include "nsIInterfaceInfoManager.h"
#include "nsIClassInfo.h"
#include "nsIComponentManager.h"
#include "nsIComponentManagerObsolete.h"
#include "nsIServiceManager.h"
#include "nsIInputStream.h"
#include "nsIVariant.h"

#include "nsXPIDLString.h"
#include "nsCRT.h"
#include "xptcall.h"
#include "xpt_xdr.h"

// This header is considered internal - hence
// we can use it to trigger "exports"
#define BUILD_PYXPCOM

#include "PyXPCOM.h"
