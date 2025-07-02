// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'
import { DISCUSSION_REF_TYPE } from '@/types/discussion.type'

type DiscussionIdentifierState = {
  identifier?: {
    refId: string
    refType: DISCUSSION_REF_TYPE
  }
}

type Actions = {
  setIdentifier: (refId: string, refType: DISCUSSION_REF_TYPE) => void
}

const useDiscussionIdentifier = create<DiscussionIdentifierState & Actions>()(
  immer((set) => ({
    setIdentifier(refId, refType) {
      set((state) => {
        state.identifier = {
          refId,
          refType,
        }
      })
    },
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('DiscussionIdentifier', useDiscussionIdentifier)
}

export default useDiscussionIdentifier
