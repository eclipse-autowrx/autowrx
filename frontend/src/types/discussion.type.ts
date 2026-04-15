export type DISCUSSION_REF_TYPE = 'model' | 'prototype' | 'discussion' | 'api'

export interface DiscussionUser {
  id: string
  name: string
  image_file?: string
}

export interface Discussion {
  id: string
  title?: string
  content: string
  created_at: string
  updated_at: string
  created_by: DiscussionUser
  ref?: string
  ref_type?: DISCUSSION_REF_TYPE
  parent?: string
  replies?: Discussion[]
}

export interface DiscussionCreate {
  title?: string
  content: string
  ref?: string
  ref_type?: DISCUSSION_REF_TYPE
  parent?: string
}

export interface DiscussionUpdate {
  title?: string
  content?: string
}
