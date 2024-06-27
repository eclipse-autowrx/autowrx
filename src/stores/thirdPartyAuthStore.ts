import { Token } from '@/types/token.type'
import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'

type ThirdPartyAuthState = {
  githubAccess?: string | null
}

type Actions = {
  setGithubAccess: (_?: string | null) => void
}

const useThirdPartyAuthStore = create<ThirdPartyAuthState & Actions>()(
  immer((set) => ({
    setGithubAccess: (access) =>
      set((state) => {
        state.githubAccess = access
      }),
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ThirdPartyAuthStore', useThirdPartyAuthStore)
}

export default useThirdPartyAuthStore
