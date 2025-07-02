// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { create } from 'zustand'
import { Requirement } from '@/types/model.type'
interface RequirementState {
  // scanning state
  isScanning: boolean
  startScanning: () => void
  stopScanning: () => void
  toggleScanning: () => void

  // requirements data
  requirements: Requirement[]
  setRequirements: (reqs: Requirement[]) => void
  addRequirement: (r: Requirement) => void
  removeRequirement: (id: string) => void
  updateRequirement: (r: Requirement) => void
  // optionally used to drop in some AI‐mocked set
  applyAISuggestions: () => void
}

export const useRequirementStore = create<RequirementState>((set) => ({
  // scanning
  isScanning: false,
  startScanning: () => set({ isScanning: true }),
  stopScanning: () => set({ isScanning: false }),
  toggleScanning: () => set((s) => ({ isScanning: !s.isScanning })),

  // real requirements array, start empty
  requirements: [],
  setRequirements: (requirements) => set({ requirements }),
  addRequirement: (req) =>
    set((state) => ({ requirements: [...state.requirements, req] })),
  removeRequirement: (id) =>
    set((s) => ({
      requirements: s.requirements.filter((r) => r.id !== id),
    })),
  updateRequirement: (updated) =>
    set((s) => ({
      requirements: s.requirements.map((r) =>
        r.id === updated.id ? updated : r,
      ),
    })),
  applyAISuggestions: () =>
    set({
      requirements: [],
    }),
}))
