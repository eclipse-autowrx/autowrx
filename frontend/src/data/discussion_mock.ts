// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Discussion } from '@/types/discussion.type'

export const discussionMock: Discussion[] = [
  {
    id: '1',
    content: 'This is a discussion',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '1',
    ref: '',
    ref_type: 'api',
    parent: '',
  },
  {
    id: '2',
    content: 'This is a reply',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '1',
    ref: '',
    ref_type: 'api',
    parent: '1',
  },
  {
    id: '3',
    content: 'This is another reply',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '1',
    ref: '',
    ref_type: 'api',
    parent: '1',
  },
]
