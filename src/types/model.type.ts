type Tag = {
  tag: string
  tagCategoryId?: string
  tagCategoryName?: string
}

export type ModelLite = {
  name: string
  visibility: string
  model_home_image_file: string
  id: string
  created_at: Date
  created_by: string
  tags?: Tag[]
}

export type Model = {
  id: string
  custom_apis?: Record<string, unknown>
  main_api: string
  model_home_image_file?: string
  model_files?: Record<string, unknown>
  name: string
  visibility: 'public' | 'private'
  vehicle_category: string
  property: {
    [key: string]: string | number | undefined
  }
  created_by: string
  created_at?: Date
  skeleton?: string
  tags?: Tag[]
}

export type Prototype = {
  id: string
  apis: any
  model_id: string
  name: string
  code: string
  complexity_level: string
  customer_journey: string
  portfolio: any
  skeleton: any
  state: string
  widget_config: string
  image_file: string
  created_by: string
  description: any
  created_at?: Date
  tags?: Tag[]
}
export type ModelCreate = {
  name: string
  cvi: string
  main_api: string
}
