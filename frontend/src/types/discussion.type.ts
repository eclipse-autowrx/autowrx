// Discussion type definitions
export type DISCUSSION_REF_TYPE = 'model' | 'prototype' | 'discussion' | 'api'

export interface Discussion {
  id: string
  title?: string
  content: string
  created_at: string
  updated_at: string
  created_by: string
  ref?: string
  ref_type?: DISCUSSION_REF_TYPE
  parent?: string
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
