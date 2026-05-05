// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { createWithEqualityFn } from 'zustand/traditional'

type State = {
  iframeLoadedByPrototypeId: Record<string, boolean | undefined>
}

type Actions = {
  setIframeLoaded: (prototypeId: string, loaded: boolean) => void
}

const useWorkspaceRuntimeUiStore = createWithEqualityFn<State & Actions>()(
  (set) => ({
    iframeLoadedByPrototypeId: {},
    setIframeLoaded: (prototypeId, loaded) =>
      set((state) => ({
        iframeLoadedByPrototypeId: {
          ...state.iframeLoadedByPrototypeId,
          [prototypeId]: loaded,
        },
      })),
  }),
)

export default useWorkspaceRuntimeUiStore
