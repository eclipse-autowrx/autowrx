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
}

export type Model = {
  id: string
  custom_apis?: Record<string, any>
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
  created_by?: {
    name: string
    image_file: string
    id: string
  }
  description: any
  created_at?: Date
  tags?: Tag[]
  avg_score?: number
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
  cvi: string
  main_api: string
  custom_apis?: string
  model_home_image_file?: string
  model_files?: object
  visibility?: 'public' | 'private'
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

export interface GithubRelease {
  url: string
  html_url: string
  assets_url: string
  upload_url: string
  tarball_url: string | null
  zipball_url: string | null
  id: number
  node_id: string
  tag_name: string
  target_commitish: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string | null
  author: SimpleUser
  assets: ReleaseAsset[]
  body_html: string
  body_text: string
  mentions_count: number
  discussion_url: string
  reactions: ReactionRollup
}

interface SimpleUser {
  name: string | null
  email: string | null
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  starred_at: string
}

interface ReleaseAsset {
  url: string
  browser_download_url: string
  id: number
  node_id: string
  name: string
  label: string | null
  state: 'uploaded' | 'open'
  content_type: string
  size: number
  download_count: number
  created_at: string
  updated_at: string
  uploader: SimpleUser | null
}

interface ReactionRollup {
  url: string
  total_count: number
  '+1': number
  '-1': number
  laugh: number
  confused: number
  heart: number
  hooray: number
  eyes: number
  rocket: number
}
