/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
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
 *   Pierre Phaneuf             <pp@ludusdesign.com>
 *   Bradley Baetz              <bbaetz@student.usyd.edu.au>
 *   Jan Varga                  <jan@mozdevgroup.com>
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


// <Kaze>
// TODO: migrate from internal linkage to frozen linkage
// see https://developer.mozilla.org/en/Migrating_from_Internal_Linkage_to_Frozen_Linkage
#define MOZILLA_INTERNAL_API 1
#include "nsComponentManagerUtils.h"
#include "nsServiceManagerUtils.h"
#include "nsAString.h"
// </Kaze>

#include "nsHTTPIndex.h"
#include "nsIDirIndex.h"
#include "nsCRT.h"
#include "nsEnumeratorUtils.h"
#include "nsRDFCID.h"
#include "rdf.h"
#include "nsIFTPChannel.h"
#include "nsIWindowWatcher.h"
#include "nsIPrompt.h"
#include "nsIAuthPrompt.h"
#include "nsIDirectoryListing.h"
#include "nsIRDFPurgeableDataSource.h"

static NS_DEFINE_CID(kRDFServiceCID, NS_RDFSERVICE_CID);

static const char       kFTPProtocol[] = "ftp://";
static const char       kGopherProtocol[] = "gopher://";

nsIRDFService*          nsHTTPIndex::gRDFService;

nsIRDFResource*         nsHTTPIndex::kNC_Child;
nsIRDFResource*         nsHTTPIndex::kNC_Loading;
nsIRDFResource*         nsHTTPIndex::kNC_Comment;
nsIRDFResource*         nsHTTPIndex::kNC_URL;
nsIRDFResource*         nsHTTPIndex::kNC_Description;
nsIRDFResource*         nsHTTPIndex::kNC_ContentLength;
nsIRDFResource*         nsHTTPIndex::kNC_LastModified;
nsIRDFResource*         nsHTTPIndex::kNC_ContentType;
nsIRDFResource*         nsHTTPIndex::kNC_FileType;
nsIRDFResource*         nsHTTPIndex::kNC_IsDirectory;
nsIRDFResource*         nsHTTPIndex::kNC_Cached;
nsIRDFLiteral*          nsHTTPIndex::kTrueLiteral;
nsIRDFLiteral*          nsHTTPIndex::kFalseLiteral;


nsHTTPIndex::nsHTTPIndex()
    : mEncoding("ISO-8859-1"),
      mShowHidden(PR_FALSE)
{
}

nsHTTPIndex::~nsHTTPIndex()
{
    printf("nsHTTPIndex::~nsHTTPIndex()\n");
    // UnregisterDataSource() may fail, just ignore errors.
    gRDFService->UnregisterDataSource(this);

    if (mTimer) {
        // Be sure to cancel the timer, as it holds a weak reference back to us.
        mTimer->Cancel();
        mTimer = nsnull;
    }

    NS_RELEASE(kNC_Child);
    NS_RELEASE(kNC_Loading);
    NS_RELEASE(kNC_Comment);
    NS_RELEASE(kNC_URL);
    NS_RELEASE(kNC_Description);
    NS_RELEASE(kNC_ContentLength);
    NS_RELEASE(kNC_LastModified);
    NS_RELEASE(kNC_ContentType);
    NS_RELEASE(kNC_FileType);
    NS_RELEASE(kNC_IsDirectory);
    NS_RELEASE(kNC_Cached);
    NS_RELEASE(kTrueLiteral);
    NS_RELEASE(kFalseLiteral);

    nsServiceManager::ReleaseService(kRDFServiceCID, gRDFService);
    gRDFService = nsnull;
}

nsresult
nsHTTPIndex::Init()
{
    nsresult rv = nsServiceManager::GetService(kRDFServiceCID,
                                               NS_GET_IID(nsIRDFService),
                                               (nsISupports**) &gRDFService);
    if (NS_FAILED(rv)) return rv;

    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "child"),
                         &kNC_Child);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "loading"),
                         &kNC_Loading);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "Comment"),
                         &kNC_Comment);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "URL"),
                         &kNC_URL);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "Name"),
                         &kNC_Description);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "Content-Length"),
                         &kNC_ContentLength);
    gRDFService->GetResource(NS_LITERAL_CSTRING(WEB_NAMESPACE_URI "LastModifiedDate"),
                         &kNC_LastModified);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "Content-Type"),
                         &kNC_ContentType);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "File-Type"),
                         &kNC_FileType);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "IsDirectory"),
                         &kNC_IsDirectory);
    gRDFService->GetResource(NS_LITERAL_CSTRING(NC_NAMESPACE_URI "Cached"),
                         &kNC_Cached);

    rv = gRDFService->GetLiteral(NS_LITERAL_STRING("true").get(), &kTrueLiteral);
    if (NS_FAILED(rv)) return rv;
    rv = gRDFService->GetLiteral(NS_LITERAL_STRING("false").get(), &kFalseLiteral);
    if (NS_FAILED(rv)) return rv;

    mInner = do_CreateInstance("@mozilla.org/rdf/datasource;1?name=in-memory-datasource", &rv);
    if (NS_FAILED(rv)) return rv;

    rv = NS_NewISupportsArray(getter_AddRefs(mConnectionList));
    if (NS_FAILED(rv)) return rv;

    // Do this last, register this as a named data source with the RDF service.
    return gRDFService->RegisterDataSource(this, PR_FALSE);
}

NS_IMPL_THREADSAFE_ISUPPORTS8(nsHTTPIndex,
                              nsIHTTPIndex,
                              nsIRDFDataSource,
                              nsIRDFDirectoryDataSource,
                              nsIRDFRemoteDataSource,
                              nsIRequestObserver,
                              nsIStreamListener,
                              nsIDirIndexListener,
                              nsIInterfaceRequestor)

NS_IMETHODIMP
nsHTTPIndex::SetEncoding(const nsACString& aEncoding)
{
    mEncoding = aEncoding;
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::GetEncoding(nsACString& aEncoding)
{
    aEncoding = mEncoding;
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::GetURI(char** aURI)
{
    if (!aURI)
        return NS_ERROR_NULL_POINTER;

    *aURI = nsCRT::strdup("rdf:httpindex");
    if (!(*aURI))
        return NS_ERROR_OUT_OF_MEMORY;

    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::GetSource(nsIRDFResource* aProperty,
                       nsIRDFNode* aTarget,
                       PRBool aTruthValue,
                       nsIRDFResource** _retval)
{
    return mInner->GetSource(aProperty, aTarget, aTruthValue, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::GetSources(nsIRDFResource* aProperty,
                        nsIRDFNode* aTarget,
                        PRBool aTruthValue,
                        nsISimpleEnumerator **_retval)
{
    return mInner->GetSources(aProperty, aTarget, aTruthValue, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::GetTarget(nsIRDFResource* aSource,
                       nsIRDFResource* aProperty,
                       PRBool aTruthValue,
                       nsIRDFNode** _retval)
{
    PRBool isWellknownContainer;
    nsresult rv = IsWellknownContainer(aSource, &isWellknownContainer);
    if (NS_FAILED(rv)) return rv;

    if (isWellknownContainer && aProperty == kNC_Child && aTruthValue) {
        // Fake out the generic builder (i.e. return anything in this case)
        // so that search containers never appear to be empty.
        NS_IF_ADDREF(aSource);
        *_retval = aSource;
        return NS_OK;
    }

    return mInner->GetTarget(aSource, aProperty, aTruthValue, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::GetTargets(nsIRDFResource* aSource,
                        nsIRDFResource* aProperty,
                        PRBool aTruthValue,
                        nsISimpleEnumerator** _retval)
{
    PRBool isWellknownContainer;
    nsresult rv = IsWellknownContainer(aSource, &isWellknownContainer);
    if (NS_FAILED(rv)) return rv;

    if (isWellknownContainer && aProperty == kNC_Child) {
        // Check and see if we already have data for the search in question.
        // If we do, don't bother doing the search again.
        PRBool cached;
        nsresult rv = mInner->HasAssertion(aSource, kNC_Cached, kTrueLiteral,
                                           PR_TRUE, &cached);
        if (NS_FAILED(rv)) return rv;

        // If we need to do a network request, do it out-of-band
        // (because the XUL template builder isn't re-entrant)
        // by using a global connection list and an immediately-firing timer.

        if (!cached) {
            PRInt32 connectionIndex = mConnectionList->IndexOf(aSource);
            if (connectionIndex < 0) {
                rv = mInner->Assert(aSource, kNC_Cached, kTrueLiteral, PR_TRUE);
                if (NS_FAILED(rv)) return rv;

                // Add aSource into list of connections to make.
                mConnectionList->AppendElement(aSource);

                // If we don't have a timer about to fire, create one
                // which should fire as soon as possible (out-of-band).
                if (!mTimer) {
                    mTimer = do_CreateInstance("@mozilla.org/timer;1", &rv);
                    if (NS_FAILED(rv)) return rv;

                    mTimer->InitWithFuncCallback(nsHTTPIndex::FireTimer, this,
                                                 0, nsITimer::TYPE_ONE_SHOT);
                }
            }
        }
    }

    return mInner->GetTargets(aSource, aProperty, aTruthValue, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::Assert(nsIRDFResource* aSource,
                    nsIRDFResource* aProperty,
                    nsIRDFNode* aTarget,
                    PRBool aTruthValue)
{
    return mInner->Assert(aSource, aProperty, aTarget, aTruthValue);
}

NS_IMETHODIMP
nsHTTPIndex::Unassert(nsIRDFResource* aSource,
                      nsIRDFResource* aProperty,
                      nsIRDFNode* aTarget)
{
    return mInner->Unassert(aSource, aProperty, aTarget);
}

NS_IMETHODIMP
nsHTTPIndex::Change(nsIRDFResource* aSource,
                    nsIRDFResource* aProperty,
                    nsIRDFNode* aOldTarget,
                    nsIRDFNode* aNewTarget)
{
    return mInner->Change(aSource, aProperty, aOldTarget, aNewTarget);
}

NS_IMETHODIMP
nsHTTPIndex::Move(nsIRDFResource* aOldSource,
                  nsIRDFResource* aNewSource,
                  nsIRDFResource* aProperty,
                  nsIRDFNode *aTarget)
{
    return mInner->Move(aOldSource, aNewSource, aProperty, aTarget);
}

NS_IMETHODIMP
nsHTTPIndex::HasAssertion(nsIRDFResource* aSource,
                          nsIRDFResource* aProperty,
                          nsIRDFNode* aTarget,
                          PRBool aTruthValue,
                          PRBool* _retval)
{
    return mInner->HasAssertion(aSource, aProperty, aTarget, aTruthValue, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::AddObserver(nsIRDFObserver *aObserver)
{
    return mInner->AddObserver(aObserver);
}

NS_IMETHODIMP
nsHTTPIndex::RemoveObserver(nsIRDFObserver *aObserver)
{
    return mInner->RemoveObserver(aObserver);
}

NS_IMETHODIMP 
nsHTTPIndex::HasArcIn(nsIRDFNode* aNode,
                      nsIRDFResource* aArc,
                      PRBool* _retval)
{
    return mInner->HasArcIn(aNode, aArc, _retval);
}

NS_IMETHODIMP 
nsHTTPIndex::HasArcOut(nsIRDFResource* aSource,
                       nsIRDFResource* aArc,
                       PRBool* _retval)
{
    PRBool isWellknownContainer;
    nsresult rv = IsWellknownContainer(aSource, &isWellknownContainer);
    if (NS_FAILED(rv)) return rv;

    if (isWellknownContainer && aArc == kNC_Child) {
        *_retval = PR_TRUE;
        return NS_OK;
    }

    return mInner->HasArcOut(aSource, aArc, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::ArcLabelsIn(nsIRDFNode* aNode,
                         nsISimpleEnumerator** _retval)
{
    return mInner->ArcLabelsIn(aNode, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::ArcLabelsOut(nsIRDFResource* aSource,
                          nsISimpleEnumerator** _retval)
{
    nsCOMPtr<nsISupportsArray> array;
    nsresult rv = NS_NewISupportsArray(getter_AddRefs(array));
    if (NS_FAILED(rv)) return rv;

    PRBool isWellknownContainer;
    rv = IsWellknownContainer(aSource, &isWellknownContainer);
    if (NS_FAILED(rv)) return rv;

    if (isWellknownContainer)
        array->AppendElement(kNC_Child);

    nsISimpleEnumerator* enumerator = new nsArrayEnumerator(array);
    if (! enumerator)
        return NS_ERROR_OUT_OF_MEMORY;

    nsCOMPtr<nsISimpleEnumerator> enumerator2;
    rv = mInner->ArcLabelsOut(aSource, getter_AddRefs(enumerator2));
    if (NS_FAILED(rv)) return rv;

    return NS_NewUnionEnumerator(_retval, enumerator, enumerator2);
}

NS_IMETHODIMP
nsHTTPIndex::GetAllResources(nsISimpleEnumerator **_retval)
{
    return mInner->GetAllResources(_retval);
}

NS_IMETHODIMP
nsHTTPIndex::IsCommandEnabled(nsISupportsArray* aSources,
                              nsIRDFResource* aCommand,
                              nsISupportsArray* aArguments,
                              PRBool* _retval)
{
    return mInner->IsCommandEnabled(aSources, aCommand, aArguments, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::DoCommand(nsISupportsArray* aSources,
                       nsIRDFResource* aCommand,
                       nsISupportsArray* aArguments)
{
    return mInner->DoCommand(aSources, aCommand, aArguments);
}

NS_IMETHODIMP
nsHTTPIndex::BeginUpdateBatch()
{
    return mInner->BeginUpdateBatch();
}

NS_IMETHODIMP
nsHTTPIndex::EndUpdateBatch()
{
    return mInner->EndUpdateBatch();
}

NS_IMETHODIMP
nsHTTPIndex::GetAllCmds(nsIRDFResource* aSource,
                        nsISimpleEnumerator** _retval)
{
    return mInner->GetAllCmds(aSource, _retval);
}

NS_IMETHODIMP
nsHTTPIndex::GetShowHidden(PRBool* aShowHidden)
{
    *aShowHidden = mShowHidden;
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::SetShowHidden(PRBool aShowHidden)
{
    if (aShowHidden != mShowHidden) {
        mShowHidden = aShowHidden;
        return Refresh(PR_TRUE);
    }
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::GetParentDirectory(nsIRDFResource* aSource, nsIRDFResource** _retval)
{
    const char* spec;
    nsresult rv = aSource->GetValueConst(&spec);
    if (NS_FAILED(rv)) return rv;

    nsCOMPtr<nsIURI> uri;
    rv = NS_NewURI(getter_AddRefs(uri), nsDependentCString(spec));
    if (NS_FAILED(rv)) return rv;

    nsCAutoString path;
    rv = uri->GetPath(path);
    if (NS_FAILED(rv)) return rv;

    if (path.Equals(NS_LITERAL_CSTRING("/"))) {
        *_retval = nsnull;
    }
    else {
        nsCAutoString parentStr;
        rv = uri->Resolve(NS_LITERAL_CSTRING(".."), parentStr);
        if (NS_FAILED(rv)) return rv;

        rv = gRDFService->GetResource(parentStr, _retval);
        if (NS_FAILED(rv)) return rv;
    }

    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::GetParentDirectories(nsIRDFResource* aSource, nsISimpleEnumerator** _retval)
{
    nsCOMPtr<nsISupportsArray> array;
    nsresult rv = NS_NewISupportsArray(getter_AddRefs(array));
    if (NS_FAILED(rv)) return rv;

    while (PR_TRUE) {
        const char* spec;
        rv = aSource->GetValueConst(&spec);
        if (NS_FAILED(rv)) return rv;

        nsCOMPtr<nsIURI> uri;
        rv = NS_NewURI(getter_AddRefs(uri), nsDependentCString(spec));
        if (NS_FAILED(rv)) return rv;

        nsCAutoString path;
        rv = uri->GetPath(path);
        if (NS_FAILED(rv)) return rv;

        if (path.Equals(NS_LITERAL_CSTRING("/")))
            break;

        nsCAutoString parentStr;
        rv = uri->Resolve(NS_LITERAL_CSTRING(".."), parentStr);
        if (NS_FAILED(rv)) return rv;

        nsCOMPtr<nsIRDFResource> resource;
        rv = gRDFService->GetResource(parentStr, getter_AddRefs(resource));
        if (NS_FAILED(rv)) return rv;

        array->AppendElement(resource);

        aSource = resource;
    }

    nsISimpleEnumerator* enumerator = new nsArrayEnumerator(array);
    if (! enumerator)
        return NS_ERROR_OUT_OF_MEMORY;

    NS_ADDREF(*_retval = enumerator);
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::GetHomeDirectory(nsIRDFResource** _retval)
{
    *_retval = nsnull;

    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::CreateNewDirectory(nsIRDFResource* aSource, const nsAString& aNewDirName)
{
  nsCAutoString spec;
  nsresult rv = GetDestination(aSource, spec);
  if (NS_FAILED(rv)) return rv;

  spec.Append(NS_ConvertUCS2toUTF8(aNewDirName) + NS_LITERAL_CSTRING("/"));
          
  nsCOMPtr<nsIURI> uri;
  rv = NS_NewURI(getter_AddRefs(uri), spec.get());
  if (NS_FAILED(rv)) return rv;

  nsCOMPtr<nsIChannel> channel;
  rv = NS_NewChannel(getter_AddRefs(channel), uri, nsnull, nsnull);
  if (NS_FAILED(rv)) return rv;

  channel->SetNotificationCallbacks(this);

  nsCOMPtr<nsIFTPChannel> ftpChannel = do_QueryInterface(channel);
  if (!ftpChannel)
      return NS_OK;

  rv = ftpChannel->CreateDirectory();
  if (NS_FAILED(rv)) return rv;

  rv = channel->AsyncOpen(this, aSource);
  if (NS_FAILED(rv)) return rv;

  return mInner->Unassert(aSource, kNC_Cached, kTrueLiteral);
}

NS_IMETHODIMP
nsHTTPIndex::GetLoaded(PRBool* aLoaded)
{
    *aLoaded = PR_TRUE;
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::Init(const char* aURI)
{
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::Refresh(PRBool aBlocking)
{
    nsresult rv = mInner->BeginUpdateBatch();
    if (NS_FAILED(rv)) return rv;

    nsCOMPtr<nsIRDFPurgeableDataSource> purgeable = do_QueryInterface(mInner);
    if (!purgeable)
        return NS_ERROR_UNEXPECTED;

    rv = purgeable->Sweep();
    if (NS_FAILED(rv)) return rv;

    return mInner->EndUpdateBatch();
}

NS_IMETHODIMP
nsHTTPIndex::Flush()
{
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::FlushTo(const char* aURI)
{
    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::OnStartRequest(nsIRequest* aRequest, nsISupports* aContext)
{
    nsresult rv;

    mParser = do_CreateInstance(NS_DIRINDEXPARSER_CONTRACTID, &rv);
    if (NS_FAILED(rv)) return rv;
  
    rv = mParser->SetEncoding(mEncoding.get());
    if (NS_FAILED(rv)) return rv;

    rv = mParser->SetListener(this);
    if (NS_FAILED(rv)) return rv;

    rv = mParser->OnStartRequest(aRequest, aContext);
    if (NS_FAILED(rv)) return rv;

    rv = mInner->BeginUpdateBatch();
    if (NS_FAILED(rv)) return rv;
 
    nsCOMPtr<nsIRDFResource> resource = do_QueryInterface(aContext);
    if (!resource)
        return NS_ERROR_UNEXPECTED;

    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::OnStopRequest(nsIRequest *request,
                           nsISupports* aContext,
                           nsresult aStatus)
{
    nsresult rv = mInner->EndUpdateBatch();
    if (NS_FAILED(rv)) return rv;

    rv = mParser->OnStopRequest(request, aContext, aStatus);
    if (NS_FAILED(rv)) return rv;

    nsCOMPtr<nsIRDFResource> resource = do_QueryInterface(aContext);
    if (!resource)
        return NS_ERROR_UNEXPECTED;

    rv = mInner->Unassert(resource, kNC_Loading, kTrueLiteral);
    if (NS_FAILED(rv)) return rv;

    if (NS_SUCCEEDED(aStatus)) {
        nsXPIDLCString comment;
        mParser->GetComment(getter_Copies(comment));

        nsCOMPtr<nsIRDFLiteral> literal;
        rv = gRDFService->GetLiteral(NS_ConvertASCIItoUCS2(comment).get(),
                                     getter_AddRefs(literal));
        if (NS_FAILED(rv)) return rv;

        rv = mInner->Assert(resource, kNC_Comment, literal, PR_TRUE);
        if (NS_FAILED(rv)) return rv;
    }

    return NS_OK;
}

NS_IMETHODIMP
nsHTTPIndex::OnDataAvailable(nsIRequest* aRequest,
                             nsISupports* aContext,
                             nsIInputStream* aStream,
                             PRUint32 aSourceOffset,
                             PRUint32 aCount)
{
    nsCOMPtr<nsIRDFResource> resource = do_QueryInterface(aContext);
    if (!resource)
        return NS_ERROR_UNEXPECTED;

    return mParser->OnDataAvailable(aRequest, aContext, aStream,
                                    aSourceOffset, aCount);
}

NS_IMETHODIMP
nsHTTPIndex::OnIndexAvailable(nsIRequest* aRequest, nsISupports *aContext,
                              nsIDirIndex* aIndex)
{
    nsCOMPtr<nsIRDFResource> parentResource = do_QueryInterface(aContext);
    if (!parentResource)
        return NS_ERROR_UNEXPECTED;
  
    const char* parentSpec;
    nsresult rv = parentResource->GetValueConst(&parentSpec);
    if (NS_FAILED(rv)) return rv;

    // We found the filename, construct a resource for its entry.
    nsCAutoString entry(parentSpec);

    // Gopher resources don't point to an entry in the same directory
    // like ftp uris. So the entry is just a unique string, while
    // the URL attribute is the destination of this element.
    // The naming scheme for the attributes is taken from the bookmarks.
    nsXPIDLCString location;
    rv = aIndex->GetLocation(getter_Copies(location));
    if (NS_FAILED(rv)) return rv;

    entry.Append(location);

    // If its a directory, make sure it ends with a trailing slash.
    // This doesn't matter for gopher, (where directories don't have
    // to end in a trailing /), because the filename is used for the URL
    // attribute.
    PRUint32 type;
    rv = aIndex->GetType(&type);
    if (NS_FAILED(rv)) return rv;

    if (type == nsIDirIndex::TYPE_DIRECTORY)
        entry.Append('/');

    nsCOMPtr<nsIRDFResource> resource;
    rv = gRDFService->GetResource(entry, getter_AddRefs(resource));
    if (NS_FAILED(rv)) return rv;

    // At this point, we'll (hopefully) have found the filename and
    // constructed a resource for it, stored in entry. So now take a
    // second pass through the values and add as statements to the RDF
    // datasource.

    // For gopher, the target is the filename. We still have to do all
    // the above string manipulation though, because we need the entryuric
    // as the key for the RDF data source
    nsAutoString url;
    if (StringBeginsWith(entry, nsDependentCString(kGopherProtocol)))
        url.AssignWithConversion(location);
    else
        url.AssignWithConversion(entry);

    nsCOMPtr<nsIRDFLiteral> literal;
    rv = gRDFService->GetLiteral(url.get(), getter_AddRefs(literal));
    if (NS_FAILED(rv)) return rv;

    rv = mInner->Assert(resource, kNC_URL, literal, PR_TRUE);
    if (NS_FAILED(rv)) return rv;
      
    // description
    nsXPIDLString description;
    rv = aIndex->GetDescription(getter_Copies(description));
    if (NS_FAILED(rv)) return rv;

    rv = gRDFService->GetLiteral(description.get(), getter_AddRefs(literal));
    if (NS_FAILED(rv)) return rv;

    rv = mInner->Assert(resource, kNC_Description, literal, PR_TRUE);
    if (NS_FAILED(rv)) return rv;
      
    // contentlength
    if (type != nsIDirIndex::TYPE_DIRECTORY) {
        PRInt64 size;
        rv = aIndex->GetSize(&size);
        if (NS_FAILED(rv)) return rv;

        if (LL_NE(size, LL_INIT(0, -1))) {
            PRInt32 size32;
            LL_L2I(size32, size);

            nsCOMPtr<nsIRDFInt> intLiteral;
            rv = gRDFService->GetIntLiteral(size32, getter_AddRefs(intLiteral));
            if (NS_FAILED(rv)) return rv;

            rv = mInner->Assert(resource, kNC_ContentLength, intLiteral, PR_TRUE);
            if (NS_FAILED(rv)) return rv;
        }
    }

    // lastmodified
    PRTime tm;
    rv = aIndex->GetLastModified(&tm);
    if (NS_FAILED(rv)) return rv;

    if (tm != -1) {
        nsCOMPtr<nsIRDFDate> dateLiteral;
        rv = gRDFService->GetDateLiteral(tm, getter_AddRefs(dateLiteral));
        if (NS_FAILED(rv)) return rv;

        rv = mInner->Assert(resource, kNC_LastModified, dateLiteral, PR_TRUE);
        if (NS_FAILED(rv)) return rv;
    }

    // filetype
    switch (type) {
        case nsIDirIndex::TYPE_UNKNOWN:
            rv = gRDFService->GetLiteral(NS_LITERAL_STRING("UNKNOWN").get(),
                                         getter_AddRefs(literal));
            break;
        case nsIDirIndex::TYPE_DIRECTORY:
            rv = gRDFService->GetLiteral(NS_LITERAL_STRING("DIRECTORY").get(),
                                         getter_AddRefs(literal));
            break;
        case nsIDirIndex::TYPE_FILE:
            rv = gRDFService->GetLiteral(NS_LITERAL_STRING("FILE").get(),
                                         getter_AddRefs(literal));
            break;
        case nsIDirIndex::TYPE_SYMLINK:
            rv = gRDFService->GetLiteral(NS_LITERAL_STRING("SYMLINK").get(),
                                         getter_AddRefs(literal));
            break;
    }
    if (NS_FAILED(rv)) return rv;

    rv = mInner->Assert(resource, kNC_FileType, literal, PR_TRUE);
    if (NS_FAILED(rv)) return rv;

    // Since the definition of a directory depends on the protocol, we would have
    // to do string comparisons all the time.
    // But we're told if we're a container right here, so save that fact.
    if (type == nsIDirIndex::TYPE_DIRECTORY)
        rv = mInner->Assert(resource, kNC_IsDirectory, kTrueLiteral, PR_TRUE);
    else
        rv = mInner->Assert(resource, kNC_IsDirectory, kFalseLiteral, PR_TRUE);
    if (NS_FAILED(rv)) return rv;
    
    return mInner->Assert(parentResource, kNC_Child, resource, PR_TRUE);
}

NS_IMETHODIMP
nsHTTPIndex::GetInterface(const nsIID &anIID, void** aResult) 
{
    if (anIID.Equals(NS_GET_IID(nsIPrompt))) {
        nsCOMPtr<nsIWindowWatcher> wwatch(do_GetService(NS_WINDOWWATCHER_CONTRACTID));
        return wwatch->GetNewPrompter(nsnull, (nsIPrompt**)aResult);
    }  

    if (anIID.Equals(NS_GET_IID(nsIAuthPrompt))) {
        nsCOMPtr<nsIWindowWatcher> wwatch(do_GetService(NS_WINDOWWATCHER_CONTRACTID));
        return wwatch->GetNewAuthPrompter(nsnull, (nsIAuthPrompt**)aResult);
    }  

    return NS_ERROR_NO_INTERFACE;
}

// This function finds the destination when following a given nsIRDFResource
// If the resource has a URL attribute, we use that. If not, just use the uri.
// Do NOT try to get the destination of a uri in any other way.
nsresult
nsHTTPIndex::GetDestination(nsIRDFResource* aSource, nsACString& aResult) {
    // First try the URL attribute
    nsCOMPtr<nsIRDFNode> node;
    nsresult rv = mInner->GetTarget(aSource, kNC_URL, PR_TRUE, getter_AddRefs(node));
    if (NS_FAILED(rv)) return rv;

    nsCOMPtr<nsIRDFLiteral> url;
    if (node)
        url = do_QueryInterface(node);

    if (url) {
        const PRUnichar* spec;
        rv = url->GetValueConst(&spec);
        if (NS_FAILED(rv)) return rv;

        aResult.Assign(NS_ConvertUCS2toUTF8(spec));
    }
    else {
        const char* spec;
        rv = aSource->GetValueConst(&spec);
        if (NS_FAILED(rv)) return rv;

        aResult.Assign(spec);
    }

    return NS_OK;
}

// IsWellknownContainer() decides whether a URI is a container for which,
// when asked (say, by the template builder), we'll make a network connection
// to get its contents. For the moment, all we speak is ftp:// and gopher:// URLs
nsresult
nsHTTPIndex::IsWellknownContainer(nsIRDFResource* aSource, PRBool* aResult)
{
    *aResult = PR_FALSE;

    nsCOMPtr<nsIRDFNode> node;
    nsresult rv = mInner->GetTarget(aSource, kNC_IsDirectory, PR_TRUE,
                                    getter_AddRefs(node));
    if (NS_FAILED(rv)) return rv;

    if (node) {
        rv = node->EqualsNode(kTrueLiteral, aResult);
        if (NS_FAILED(rv)) return rv;
    }

    if (! *aResult) {
        // For gopher, we need to follow the URL attribute to get the
        // real destination.
        nsCAutoString spec;
        rv = GetDestination(aSource, spec);
        if (NS_FAILED(rv)) return rv;

        if (StringBeginsWith(spec, nsDependentCString(kFTPProtocol))) {
            if (spec.Last() == '/')
                *aResult = PR_TRUE;
        }
        else if (StringBeginsWith(spec, nsDependentCString(kGopherProtocol))) {
            // A gopher url is of the form:
            // gopher://example.com/xFileNameToGet
            // where x is a single character representing the type of file
            // 1 is a directory, and 7 is a search.
            // Searches will cause a dialog to be popped up (asking the user
            // what to search for), and so even though searches return a
            // directory as a result, don't treat it as a directory here.

            const char* s = spec.get();
            char* p = PL_strchr(s + sizeof(kGopherProtocol)-1, '/');
            if (!p || p[1] == '\0' || p[1] == '1')
                *aResult = PR_TRUE;
        }
    }

    return NS_OK;
}

void
nsHTTPIndex::FireTimer(nsITimer* aTimer, void* aClosure)
{
    nsHTTPIndex* self = NS_STATIC_CAST(nsHTTPIndex*, aClosure);
    if (!self) return;
  
    // Be sure to cancel the timer, as it holds a weak reference back to us.
    self->mTimer->Cancel();
    self->mTimer = nsnull;

    PRUint32 numItems;
    self->mConnectionList->Count(&numItems);
    if (numItems > 0) {
        nsCOMPtr<nsISupports> element;
        self->mConnectionList->GetElementAt(0, getter_AddRefs(element));
        self->mConnectionList->RemoveElementAt(0);
          
        nsCOMPtr<nsIRDFResource> resource = do_QueryInterface(element);
        if (!resource) return;
          
        nsCAutoString spec;
        self->GetDestination(resource, spec);
          
        nsCOMPtr<nsIURI> uri;
        nsresult rv = NS_NewURI(getter_AddRefs(uri), spec.get());
        if (NS_FAILED(rv)) return;

        nsCOMPtr<nsIChannel> channel;
        rv = NS_NewChannel(getter_AddRefs(channel), uri, nsnull, nsnull);
        if (NS_FAILED(rv)) return;

        channel->SetNotificationCallbacks(self);

        nsCOMPtr<nsIDirectoryListing> directoryListing = do_QueryInterface(channel);
        if (!directoryListing) return;

        rv = directoryListing->SetListFormat(nsIDirectoryListing::FORMAT_HTTP_INDEX);
        if (NS_FAILED(rv)) return;

        rv = directoryListing->SetShowHidden(self->mShowHidden);
        if (NS_FAILED(rv)) return;

        rv = channel->SetLoadFlags(nsIRequest::VALIDATE_ALWAYS);
        if (NS_FAILED(rv)) return;

        rv = channel->AsyncOpen(self, resource);
        if (NS_FAILED(rv)) return;

        // Mark the directory as "loading".

        rv = self->mInner->Assert(resource, self->kNC_Loading,
                                  self->kTrueLiteral, PR_TRUE);
        if (NS_FAILED(rv)) return;
    }
    
    // Check the list to see if the timer needs to continue firing.
    self->mConnectionList->Count(&numItems);
    if (numItems > 0) {
        nsresult rv;
        self->mTimer = do_CreateInstance("@mozilla.org/timer;1", &rv);
        if (NS_FAILED(rv)) return;

        self->mTimer->InitWithFuncCallback(nsHTTPIndex::FireTimer, aClosure, 0,
                                           nsITimer::TYPE_ONE_SHOT);
    }
}

// Kaze: nsIDirIndexListener exposes another method in Gecko 1.8
NS_IMETHODIMP
nsHTTPIndex::OnInformationAvailable(nsIRequest* aRequest,
                                    nsISupports *aContext,
                                    const nsAString_internal &aInfo)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

