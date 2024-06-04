export type VehicleAPI = {
  name: string
  type: string
  uuid: string
  description: string
  parent: string | null
  isWishlist: boolean
  shortName?: string
}

export type CVI = {
  model_id: string
  cvi: string
  id: string
  created_at: string
}
