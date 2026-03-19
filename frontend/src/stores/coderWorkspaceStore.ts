import { createWithEqualityFn } from 'zustand/traditional'
import type {
  WorkspaceAgentLog,
  WorkspaceInfo,
  WorkspaceStatus,
} from '@/services/coder.service'

export type CoderWorkspaceCacheEntry = {
  prototypeId: string
  workspaceInfo: WorkspaceInfo | null
  workspaceStatus: WorkspaceStatus | null
  workspaceLogs: WorkspaceAgentLog[]
  isWorkspaceReadyFromLogs: boolean
  lastUpdatedAt: number
}

type State = {
  byPrototypeId: Record<string, CoderWorkspaceCacheEntry | undefined>
}

type Actions = {
  getEntry: (prototypeId: string) => CoderWorkspaceCacheEntry | undefined
  upsertEntry: (
    prototypeId: string,
    patch: Partial<Omit<CoderWorkspaceCacheEntry, 'prototypeId'>>,
  ) => void
  clearEntry: (prototypeId: string) => void
  clearAll: () => void
}

const useCoderWorkspaceStore = createWithEqualityFn<State & Actions>()(
  (set, get) => ({
    byPrototypeId: {},
    getEntry: (prototypeId) => get().byPrototypeId[prototypeId],
    upsertEntry: (prototypeId, patch) =>
      set((state) => {
        const prev = state.byPrototypeId[prototypeId]
        const next: CoderWorkspaceCacheEntry = {
          prototypeId,
          workspaceInfo: prev?.workspaceInfo ?? null,
          workspaceStatus: prev?.workspaceStatus ?? null,
          workspaceLogs: prev?.workspaceLogs ?? [],
          isWorkspaceReadyFromLogs: prev?.isWorkspaceReadyFromLogs ?? false,
          lastUpdatedAt: Date.now(),
          ...patch,
        }
        return {
          byPrototypeId: {
            ...state.byPrototypeId,
            [prototypeId]: next,
          },
        }
      }),
    clearEntry: (prototypeId) =>
      set((state) => {
        const { [prototypeId]: _removed, ...rest } = state.byPrototypeId
        return { byPrototypeId: rest }
      }),
    clearAll: () => set({ byPrototypeId: {} }),
  }),
)

export default useCoderWorkspaceStore
