#! gmake
# 
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is the Netscape Portable Runtime (NSPR).
#
# The Initial Developer of the Original Code is
# Netscape Communications Corporation.
# Portions created by the Initial Developer are Copyright (C) 1998-2000
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

# Configuration information for building in the NSPR source module

# Define an include-at-most-once-flag
NSPR_CONFIG_MK	= 1

#
# The variable definitions in this file are inputs to NSPR's
# build system.  This file, if present, is included at the
# beginning of config.mk.
#
# For example:
#
# BUILD_OPT=1
# USE_PTHREADS=1
# NS_USE_GCC=
#
ifndef topsrcdir
topsrcdir=$(MOD_DEPTH)
endif

ifndef srcdir
srcdir=.
endif

ifdef USE_AUTOCONF

NFSPWD		= $(MOD_DEPTH)/config/nfspwd

CFLAGS		= $(CC_ONLY_FLAGS) $(OPTIMIZER) $(OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)
CCCFLAGS	= $(CCC_ONLY_FLAGS) $(OPTIMIZER) $(OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)
# For purify
NOMD_CFLAGS	= $(CC_ONLY_FLAGS) $(OPTIMIZER) $(NOMD_OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)
NOMD_CCFLAGS	= $(CCC_ONLY_FLAGS) $(OPTIMIZER) $(NOMD_OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)

ifeq ($(OS_ARCH),Darwin)
ifndef NSDISTMODE
NSDISTMODE=absolute_symlink
endif
PWD := $(shell pwd)
endif

ifeq ($(NSDISTMODE),copy)
# copy files, but preserve source mtime
INSTALL		= $(NSINSTALL) -t
else
ifeq ($(NSDISTMODE),absolute_symlink)
# install using absolute symbolic links
ifeq ($(OS_ARCH),Darwin)
INSTALL		= $(NSINSTALL) -L $(PWD)
else
INSTALL		= $(NSINSTALL) -L `$(NFSPWD)`
endif
else
# install using relative symbolic links
INSTALL		= $(NSINSTALL) -R
endif
endif

ifdef BUILD_DEBUG_GC
DEFINES		+= -DDEBUG_GC
endif

GARBAGE		+= $(DEPENDENCIES) core $(wildcard core.[0-9]*)

ifdef USE_AUTOCONF
DIST_GARBAGE += Makefile
endif

DEFINES += -DFORCE_PR_LOG

ifeq ($(_PR_NO_CLOCK_TIMER),1)
DEFINES += -D_PR_NO_CLOCK_TIMER
endif

ifeq ($(USE_PTHREADS), 1)
DEFINES += -D_PR_PTHREADS -UHAVE_CVAR_BUILT_ON_SEM
endif

ifeq ($(PTHREADS_USER), 1)
DEFINES += -DPTHREADS_USER -UHAVE_CVAR_BUILT_ON_SEM
endif

ifeq ($(USE_IPV6),1)
DEFINES += -D_PR_INET6
endif

else # ! USE_AUTOCONF

ifndef NSPR_MY_CONFIG_MK
NSPR_MY_CONFIG_MK = $(MOD_DEPTH)/config/my_config.mk
endif

#
# The variable definitions in this file are used to
# override variable values set by NSPR's build system.
# This file, if present, is included at the end of config.mk.
#
# For example:
#
# DIST=/usr/local/nspr
#
ifndef NSPR_MY_OVERRIDES_MK
NSPR_MY_OVERRIDES_MK = $(MOD_DEPTH)/config/my_overrides.mk
endif

-include $(NSPR_MY_CONFIG_MK)

include $(MOD_DEPTH)/config/module.df

include $(MOD_DEPTH)/config/arch.mk

ifndef NSDEPTH
NSDEPTH = $(MOD_DEPTH)/..
endif

#
# Default command macros; can be overridden in <arch>.mk.
#
# XXX FIXME: I removed CCF and LINKEXE.
AS		= $(CC)
ASFLAGS		= $(CFLAGS)
PURIFY		= purify $(PURIFYOPTIONS)
LINK_DLL	= $(LINK) $(OS_DLLFLAGS) $(DLLFLAGS)
NFSPWD		= $(MOD_DEPTH)/config/nfspwd

CFLAGS		= $(CC_ONLY_FLAGS) $(OPTIMIZER) $(OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)
CCCFLAGS	= $(CCC_ONLY_FLAGS) $(OPTIMIZER) $(OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)
# For purify
NOMD_CFLAGS	= $(CC_ONLY_FLAGS) $(OPTIMIZER) $(NOMD_OS_CFLAGS)\
		  $(XP_DEFINE) $(DEFINES) $(INCLUDES) $(XCFLAGS)

include $(MOD_DEPTH)/config/$(OS_TARGET).mk

# Figure out where the binary code lives.
BUILD		= $(OBJDIR_NAME)
OBJDIR		= $(OBJDIR_NAME)
DIST		= $(NSDEPTH)/dist/$(OBJDIR_NAME)
ifeq ($(MOZ_BITS),16)
MOZ_INCL	= $(NSDEPTH)/dist/public/win16
MOZ_DIST	= $(NSDEPTH)/dist/WIN16D_D.OBJ
endif

VPATH		= $(OBJDIR)
DEPENDENCIES	= $(OBJDIR)/.md

ifdef BUILD_DEBUG_GC
DEFINES		+= -DDEBUG_GC
endif

GARBAGE		+= $(DEPENDENCIES) core $(wildcard core.[0-9]*)

####################################################################
#
# The NSPR-specific configuration
#
####################################################################

OS_CFLAGS += -DFORCE_PR_LOG

ifeq ($(_PR_NO_CLOCK_TIMER),1)
OS_CFLAGS += -D_PR_NO_CLOCK_TIMER
endif

ifeq ($(USE_PTHREADS), 1)
OS_CFLAGS += -D_PR_PTHREADS -UHAVE_CVAR_BUILT_ON_SEM
endif

ifeq ($(PTHREADS_USER), 1)
OS_CFLAGS += -DPTHREADS_USER -UHAVE_CVAR_BUILT_ON_SEM
endif

ifeq ($(USE_IPV6),1)
OS_CFLAGS += -D_PR_INET6
endif

ifdef GC_LEAK_DETECTOR
OS_CFLAGS += -DGC_LEAK_DETECTOR
endif

####################################################################
#
# Configuration for the release process
#
####################################################################

MDIST = /share/builds/components
ifeq ($(OS_ARCH),WINNT)
MDIST = //helium/dist
MDIST_DOS = $(subst /,\\,$(MDIST))
endif

# RELEASE_DIR is ns/dist/<module name>

RELEASE_DIR = $(NSDEPTH)/dist/release/$(MOD_NAME)

RELEASE_INCLUDE_DIR = $(RELEASE_DIR)/$(BUILD_NUMBER)/$(OBJDIR_NAME)/include
RELEASE_BIN_DIR = $(RELEASE_DIR)/$(BUILD_NUMBER)/$(OBJDIR_NAME)/bin
RELEASE_LIB_DIR = $(RELEASE_DIR)/$(BUILD_NUMBER)/$(OBJDIR_NAME)/lib

-include $(NSPR_MY_OVERRIDES_MK)

endif # USE_AUTOCONF
