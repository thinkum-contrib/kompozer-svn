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
 * The Original Code is Mozilla Communicator client code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Chris Waterson             <waterson@netscape.com>
 *   Robert John Churchill      <rjc@netscape.com>
 *   Jan Varga                  <jan@mozdevgroup.com
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

#ifndef nsHTTPIndex_h__
#define nsHTTPIndex_h__

// Kaze
#define MOZILLA_INTERNAL_API 1
#include "nsComponentManagerUtils.h"
#include "nsServiceManagerUtils.h"

#include "prcvar.h"
#include "nsCOMArray.h"
#include "nsNetUtil.h"
#include "nsIHTTPIndex.h"
#include "nsIRDFService.h"
#include "nsIRDFDataSource.h"
#include "nsIRDFDirectoryDataSource.h"
#include "nsIRDFRemoteDataSource.h"
#include "nsIDirIndexListener.h"
#include "nsITimer.h"

#define NS_HTTPINDEX_SERVICE_CLASSNAME "HTTP Index"
#define NS_HTTPINDEX_SERVICE_CID \
{0x2587e382, 0x1324, 0x11d4, {0xa6, 0x52, 0xea, 0xdb, 0xb2, 0xbe, 0x34, 0x84}}
#define NS_HTTPINDEX_SERVICE_CONTRACTID "@mozilla.org/browser/httpindex-service;1"
#define NS_HTTPINDEX_DATASOURCE_CONTRACTID "@mozilla.org/rdf/datasource;1?name=httpindex"

class nsHTTPIndex : public nsIHTTPIndex,
                    public nsIRDFDataSource,
                    public nsIRDFDirectoryDataSource,
                    public nsIRDFRemoteDataSource,
                    public nsIStreamListener,
                    public nsIDirIndexListener,
                    public nsIInterfaceRequestor
{
public:
    nsHTTPIndex();
    virtual ~nsHTTPIndex();
    nsresult Init();

    NS_DECL_ISUPPORTS
    NS_DECL_NSIHTTPINDEX
    NS_DECL_NSIRDFDATASOURCE
    NS_DECL_NSIRDFDIRECTORYDATASOURCE
    NS_DECL_NSIRDFREMOTEDATASOURCE
    NS_DECL_NSIREQUESTOBSERVER
    NS_DECL_NSISTREAMLISTENER
    NS_DECL_NSIDIRINDEXLISTENER
    NS_DECL_NSIINTERFACEREQUESTOR

protected:
    nsresult GetDestination(nsIRDFResource* aSource, nsACString& aResult);
    nsresult IsWellknownContainer(nsIRDFResource* aSource, PRBool* aResult);

    static void FireTimer(nsITimer* aTimer, void* aClosure);

private:
    static nsIRDFService*               gRDFService;

    static nsIRDFResource*              kNC_Child;
    static nsIRDFResource*              kNC_Comment;
    static nsIRDFResource*              kNC_Loading;
    static nsIRDFResource*              kNC_URL;
    static nsIRDFResource*              kNC_Description;
    static nsIRDFResource*              kNC_ContentLength;
    static nsIRDFResource*              kNC_LastModified;
    static nsIRDFResource*              kNC_ContentType;
    static nsIRDFResource*              kNC_FileType;
    static nsIRDFResource*              kNC_IsDirectory;
    static nsIRDFResource*              kNC_Cached;
    static nsIRDFLiteral*               kTrueLiteral;
    static nsIRDFLiteral*               kFalseLiteral;

    nsCString                           mEncoding;
    PRBool                              mShowHidden;
    nsCOMPtr<nsIRDFDataSource>          mInner;
    nsCOMPtr<nsISupportsArray>          mConnectionList;
    nsCOMPtr<nsITimer>                  mTimer;
    nsCOMPtr<nsIDirIndexParser>         mParser;
};

#endif // nsHTTPIndex_h__
