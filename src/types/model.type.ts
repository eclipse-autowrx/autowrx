// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
  api_version?: string
  stats?: {
    apis: {
      total: { count: number }
      used: { count: number }
    }
    prototypes: { count: number }
    architecture: {
      prototypes: { count: number }
      model: { count: number }
      total: { count: number }
    }
    collaboration: {
      contributors: { count: number }
      members: { count: number }
    }
  }
}

export type Model = {
  id: string
  custom_apis?: any[]
  api_version?: string
  main_api: string
  model_home_image_file?: string
  detail_image_file?: string
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
  extend?: any
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
  editors_choice?: boolean
  extend?: any
}
export interface CustomRequirement {
  text?: string
  url?: string
}

export type RequirementType =
  | 'Functional Requirement'
  | 'System Integration Requirement'
  | 'Safety & Security Requirement'
  | 'User Experience Requirement'
  | 'Regulatory & Homologation Requirement'
  | 'Operational Requirement'
  | 'Deployment & Ecosystem Requirement'

export interface RequirementSource {
  type: 'external' | 'internal'
  link: string
}

export interface RequirementRating {
  priority: number
  relevance: number
  impact: number
}

export interface Requirement {
  id: string
  title: string
  description: string
  type: RequirementType
  source: RequirementSource
  rating: RequirementRating
  creatorUserId?: string
  createdAt?: Date
  updatedAt?: Date
  priority?: number
  relevance?: number
  impact?: number
  isNew?: boolean
  isHidden?: boolean
  angle?: number
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
  api_data_url?: string
}

export type VehicleApi = {
  name: string
  datatype?: string | null
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
  datatype?: string | null
}

export type Cvi = Record<string, VehicleApi>

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
