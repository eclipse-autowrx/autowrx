// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export type Direction =
  | 'left'
  | 'right'
  | 'bi-direction'
  | 'reverse-bi-direction'
  | 'down-right'
  | 'down-left'

export type Interface = 'p2c' | 'v2c' | 's2s' | 's2e'

export interface SignalFlow {
  direction: Direction
  signal: string
}

export interface FlowStep {
  title: string
  flows: {
    offBoard: {
      smartPhone: string
      p2c: SignalFlow | null
      cloud: string
    }
    v2c: SignalFlow | null
    onBoard: {
      sdvRuntime: string
      s2s: SignalFlow | null
      embedded: string
      s2e: SignalFlow | null
      sensors: string
    }
  }[]
}

export type ASILLevel = 'A' | 'B' | 'C' | 'D' | 'QM'

export interface FlowItemData {
  type: string
  component: string
  description: string
  preAsilLevel: ASILLevel
  postAsilLevel: ASILLevel
  riskAssessment?: string
  riskAssessmentEvaluation?: string
  approvedBy?: string
  approvedAt?: string
  generatedAt?: string
  [key: string]: string | ASILLevel | undefined
}
