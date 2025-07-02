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
    created_at: new Date(),
    created_by: {
      id: '1',
      name: 'John Doe',
      email: 'test@gmail.com',
      image_file: '/user.png',
      roles: { model_contributor: [], model_member: [], tenant_admin: [] },
      created_at: new Date(),
      email_verified: true,
      provider: 'email',
    },
    ref: '',
    ref_type: 'api',
    parent: '',
    replies: [
      {
        ref: '',
        ref_type: 'api',
        parent: '1',
        id: '4',
        content: 'This is a reply',
        created_at: new Date(),
        created_by: {
          id: '1',
          name: 'John Doe',
          email: 'test@gmail.com',
          image_file: '/user.png',
          roles: { model_contributor: [], model_member: [], tenant_admin: [] },
          created_at: new Date(),
          email_verified: true,
          provider: 'email',
        },
      },
      {
        ref: '',
        ref_type: 'api',
        parent: '1',
        id: '4',
        content: 'This is a reply',
        created_at: new Date(),
        created_by: {
          id: '1',
          name: 'John Doe',
          email: 'test@gmail.com',
          image_file: '/user.png',
          roles: { model_contributor: [], model_member: [], tenant_admin: [] },
          created_at: new Date(),
          email_verified: true,
          provider: 'email',
        },
      },
    ],
  },
]
