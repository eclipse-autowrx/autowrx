// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
