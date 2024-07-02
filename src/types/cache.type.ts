import { Prototype } from './model.type'
import { Model } from './model.type'

export type CachePrototype = Prototype & {
  page: string
  model: Model
  time: Date
  executedTimes?: number
}

export type CacheEntity = {
  referenceId: string
  type: string
  page: string
  time: Date
}
