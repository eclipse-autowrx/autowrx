export type Direction =
  | 'left'
  | 'right'
  | 'bi-direction'
  | 'down-right'
  | 'down-left'

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
