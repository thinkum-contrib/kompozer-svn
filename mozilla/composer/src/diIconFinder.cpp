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

// Kaze: remove this shit ASAP
#define MOZILLA_INTERNAL_API

#include "plstr.h"
#include "stdio.h"
#include "nsCOMPtr.h"
#include "nsMemory.h"
#include "nsComponentManagerUtils.h"
#include "diIconFinder.h"

#include "nsString.h"
#include "nsUnicharUtils.h"
#include "nsNetUtil.h"
#include "nsIURI.h"
#include "nsIURL.h"

/* Implementation file */
NS_IMPL_ISUPPORTS1(diIconFinder, diIIconFinder)

diIconFinder::diIconFinder()
{
  /* member initializers and constructor code */
}

diIconFinder::~diIconFinder()
{
  /* destructor code */
}

NS_IMETHODIMP
diIconFinder::IconForURL(const PRUnichar * aUrl, PRUnichar ** _retval)
{

#ifdef SITE_MANAGER_KDE_ICON_STYLE

  KURL url(NS_ConvertUTF16toUTF8(aUrl).get());
  nsAutoString junkString;
  junkString.AssignWithConversion(KMimeType::iconForURL(url).utf8());
  *_retval = ToNewUnicode(KDE_ICONS + junkString + NS_LITERAL_STRING(".png"));

#else

  nsCOMPtr<nsIURI> uri;
  nsresult rv = NS_NewURI(getter_AddRefs(uri), NS_ConvertUTF16toUTF8(aUrl).get());
  if (NS_FAILED(rv))
    return rv;

  nsCOMPtr<nsIURL> url(do_QueryInterface(uri));

#ifdef LINSPIRE

  nsCAutoString cFileExtension;
  rv = url->GetFileExtension(cFileExtension);
  nsAutoString fileExtension;
  fileExtension.AssignWithConversion(cFileExtension);
  nsAutoString iconName;
  if (fileExtension.Equals(NS_LITERAL_STRING("html"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("htm"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("html"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("shtml"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("html");
  else if (fileExtension.Equals(NS_LITERAL_STRING("gif"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("png"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("xbm"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("jpg"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("jpeg"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("images");
  else if (fileExtension.Equals(NS_LITERAL_STRING("mpg"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("mpeg"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("avi"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("wsf"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("video");
  else if (fileExtension.Equals(NS_LITERAL_STRING("mp3"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("wma"),nsCaseInsensitiveStringComparator()) ||
      fileExtension.Equals(NS_LITERAL_STRING("ogg"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("sound");
  else if (fileExtension.Equals(NS_LITERAL_STRING("txt"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("txt");
  else if (fileExtension.Equals(NS_LITERAL_STRING("js"),nsCaseInsensitiveStringComparator()) ||
           fileExtension.Equals(NS_LITERAL_STRING("css"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("source");
  else if (fileExtension.Equals(NS_LITERAL_STRING("pdf"),nsCaseInsensitiveStringComparator()))
    iconName = NS_LITERAL_STRING("pdf");
  else
    iconName = NS_LITERAL_STRING("mime_empty");

  *_retval = ToNewUnicode(KDE_ICONS + iconName + NS_LITERAL_STRING(".png"));

#else

  nsCAutoString fileName;
  rv = url->GetFileName(fileName);
  nsAutoString junk;
  junk.AssignWithConversion(fileName);
  *_retval = ToNewUnicode(NS_LITERAL_STRING("moz-icon://") +
                          junk + NS_LITERAL_STRING("?size=16"));

#endif /* LINSPIRE */

#endif /* SITE_MANAGER_KDE_ICON_STYLE */

  return NS_OK;
}
