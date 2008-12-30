/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * ***** BEGIN LICENSE BLOCK *****
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
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Stuart Parmenter <pavlov@netscape.com>
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

#include "imgThread.h"

#include "nsIEventQueueService.h"

#include "nsIComponentManager.h"
#include "nsIServiceManager.h"

#include "prlock.h"

#include "nsAutoLock.h"

NS_IMPL_THREADSAFE_ISUPPORTS1(imgThread, nsIRunnable)

imgThread::imgThread()
{
  /* member initializers and constructor code */
  mLock = PR_NewLock();
  mMonitor = PR_NewMonitor(); 
}

imgThread::~imgThread()
{
  /* destructor code */
  PR_DestroyLock(mLock);
  PR_DestroyMonitor(mMonitor);
}

nsresult imgThread::Init()
{
  if (!mThread) {
    nsresult rv = NS_NewThread(getter_AddRefs(mThread),
                               NS_STATIC_CAST(nsIRunnable*, this),
                               0,
                               PR_UNJOINABLE_THREAD,
                               PR_PRIORITY_NORMAL,
                               PR_GLOBAL_THREAD);
    if (NS_FAILED(rv))
      return rv;
  }

  return NS_OK;
}

nsresult imgThread::GetEventQueue(nsIEventQueue **aEventQueue)
{
  PR_EnterMonitor(mMonitor);

  if (!mEventQueue)
    PR_Wait(mMonitor, PR_INTERVAL_NO_TIMEOUT);

  *aEventQueue = mEventQueue;
  NS_ADDREF(*aEventQueue);

  PR_ExitMonitor(mMonitor);
  return NS_OK;
}


/** nsIRunnable methods **/

/* void Run(); */
NS_IMETHODIMP imgThread::Run()
{
  nsresult rv;

  nsCOMPtr<nsIEventQueue> currentThreadQ;

  PR_EnterMonitor(mMonitor);

  nsCOMPtr<nsIEventQueueService> eventService(do_GetService("@mozilla.org/event-queue-service;1", &rv));
  if (NS_FAILED(rv)) return rv;

  rv = eventService->CreateMonitoredThreadEventQueue();
  if (NS_FAILED(rv)) return rv;

  rv = eventService->GetThreadEventQueue(NS_CURRENT_THREAD, getter_AddRefs(mEventQueue));

  NS_ASSERTION(NS_SUCCEEDED(rv), "unable to create event queue");
  if (NS_FAILED(rv)) return rv;

  PR_Notify(mMonitor);

  PR_ExitMonitor(mMonitor);

  PLEvent *event;
  while (1) {
     rv = mEventQueue->WaitForEvent(&event);
     if (NS_FAILED(rv)) return rv;

     rv = mEventQueue->HandleEvent(event);
     if (NS_FAILED(rv)) return rv;
  }

  rv = eventService->DestroyThreadEventQueue();
  if (NS_FAILED(rv)) return rv;

  mEventQueue = nsnull;

  return NS_OK;
}
