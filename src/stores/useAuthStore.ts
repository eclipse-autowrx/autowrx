import { Token } from '@/types/token.type'
import { create } from 'zustand'
import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'

type AuthState = {
    access?: Token | null
}

type Actions = {
    setAccess: (_: Token) => void
    logOut: () => void
}

const useAuthStore = create<AuthState & Actions>()(
    immer((set) => ({
        access: undefined,
        setAccess: (access) =>
            set((state) => {
                state.access = access
            }),
        logOut: () =>
            set((state) => {
                // if (state.access) {
                //     logoutService().then(() => {
                //         window.location.pathname = '/'
                //     })
                // }
                state.access = null
            }),
    }))
)

if (process.env.NODE_ENV === 'development') {
    mountStoreDevtool('AuthStore', useAuthStore)
}

export default useAuthStore
