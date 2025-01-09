import { User } from './user.type'

export type Tag = {
  tag: string
  tagCategoryId?: string
  tagCategoryName?: string
}

export type ModelLite = {
  name: string
  visibility: string
  model_home_image_file: string
  id: string
  created_at?: Date
  created_by: string
  tags?: Tag[]
  state?: 'draft' | 'released' | 'blocked'
}

export type Model = {
  id: string
  custom_apis?: Record<string, any>
  api_version?: string
  main_api: string
  model_home_image_file?: string
  model_files?: Record<string, unknown>
  name: string
  cvi?: string
  visibility: 'public' | 'private'
  vehicle_category: string
  property: string
  created_by?: {
    name: string
    id: string
    image_file?: string
    email?: string
  }
  created_at?: Date
  skeleton?: string
  tags?: Tag[]
  contributors?: User[]
  members?: User[]
  state?: 'draft' | 'released' | 'blocked'
}

export type Prototype = {
  id: string
  apis: any
  language: string
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
  created_by?: {
    name: string
    image_file: string
    id: string
  }
  description: any
  created_at?: Date
  tags?: Tag[]
  avg_score?: number
  requirements?: string
  executed_turns?: number
  flow?: string
}
export interface CustomRequirement {
  text?: string
  url?: string
}

export type SearchPrototype = {
  id: string
  name: string
  image_file: string
  model?: {
    id?: string
    name?: string
  }
}

export type ModelCreate = {
  name: string
  cvi?: string
  main_api: string
  api_version?: string
  custom_apis?: string
  model_home_image_file?: string
  model_files?: object
  visibility?: 'public' | 'private'
  extended_apis?: any[]
}

export type VehicleApi = {
  name: string
  datatype?: string
  description: string
  type: string
  uuid?: string
  allowed?: string[]
  comment?: string
  unit?: string
  max?: number
  min?: number
  children?: { [key: string]: VehicleApi }
  shortName?: string
  isWishlist?: boolean
}

export type CustomApi = {
  name: string
  description: string
  type: string
  datatype?: string
}

export interface Cvi {
  Vehicle: VehicleApi
}

export interface Feedback {
  id: string
  interviewee: {
    name: string
    organization?: string
  }
  recommendation: string
  question: string
  model_id: string
  score: {
    easy_to_use?: number
    need_address?: number
    relevance?: number
  }
  created_by: string
  created_at: Date
  avg_score: number
}

export interface FeedbackCreate {
  interviewee: {
    name: string
    organization?: string
  }
  recommendation: string
  question: string
  model_id: string
  score: {
    easy_to_use?: number
    need_address?: number
    relevance?: number
  }
  ref: string
  ref_type: string
}
