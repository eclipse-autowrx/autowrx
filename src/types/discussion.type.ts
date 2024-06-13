import { User } from './user.type'

export type DISCUSSION_REF_TYPE = 'prototype' | 'model' | 'api' | 'issue'

export type DiscussionCreate = {
  content: string
  ref: string
  ref_type: DISCUSSION_REF_TYPE
  parent?: string
}

export type Discussion = DiscussionCreate & {
  created_at: Date
  created_by: User
  id: string
  replies?: Discussion[]
}
