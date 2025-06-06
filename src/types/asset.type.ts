import { ListQueryParams } from './common.type'

export type Asset = {
  name: string
  type: string
  data: string
  id?: string
}

export type QueryAssetsParams = Omit<ListQueryParams, 'search'> & {
  name?: string
  type?: string | string[]
}
