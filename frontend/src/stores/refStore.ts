import { create } from 'zustand'

interface RefStore {
  value: Record<string, HTMLElement[]>
  setValue: (key: string, refs: HTMLElement[]) => void
}

const useRefStore = create<RefStore>((set) => ({
  value: {},
  setValue: (key, refs) =>
    set((state) => ({
      value: { ...state.value, [key]: refs },
    })),
}))

export default useRefStore
