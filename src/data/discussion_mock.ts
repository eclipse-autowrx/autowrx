import { Discussion } from '@/types/discussion.type'

export const discussionMock: Discussion[] = [
  {
    id: '1',
    content: 'This is a discussion',
    created_at: new Date(),
    created_by: {
      name: 'John Doe',
      email: 'test@gmail.com',
      image_file: '/user.png',
      role: 'admin',
      roles: { model_contributor: [], model_member: [], tenant_admin: [] },
      createdAt: new Date(),
      emailVerified: true,
      isSystemAdmin: true,
      provider: 'email',
    },
    ref: '',
    ref_type: '',
    parent: '',
    children: [
      {
        ref: '',
        ref_type: '',
        parent: '1',
        id: '4',
        content: 'This is a reply',
        created_at: new Date(),
        created_by: {
          name: 'John Doe',
          email: 'test@gmail.com',
          image_file: '/user.png',
          role: 'admin',
          roles: { model_contributor: [], model_member: [], tenant_admin: [] },
          createdAt: new Date(),
          emailVerified: true,
          isSystemAdmin: true,
          provider: 'email',
        },
        children: [],
      },
      {
        ref: '',
        ref_type: '',
        parent: '1',
        id: '4',
        content: 'This is a reply',
        created_at: new Date(),
        created_by: {
          name: 'John Doe',
          email: 'test@gmail.com',
          image_file: '/user.png',
          role: 'admin',
          roles: { model_contributor: [], model_member: [], tenant_admin: [] },
          createdAt: new Date(),
          emailVerified: true,
          isSystemAdmin: true,
          provider: 'email',
        },
        children: [],
      },
    ],
  },
  {
    id: '1',
    content: 'This is a discussion',
    created_at: new Date(),
    created_by: {
      name: 'John Doe',
      email: 'test@gmail.com',
      image_file: '/user.png',
      role: 'admin',
      roles: { model_contributor: [], model_member: [], tenant_admin: [] },
      createdAt: new Date(),
      emailVerified: true,
      isSystemAdmin: true,
      provider: 'email',
    },
    ref: '',
    ref_type: '',
    parent: '',
  },
]
