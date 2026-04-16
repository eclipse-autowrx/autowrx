// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'
import { Discussion, DiscussionCreate, DiscussionUpdate, DISCUSSION_REF_TYPE } from '@/types/discussion.type'
import { List } from '@/types/common.type'

export const listDiscussionsService = async (
  ref: string,
  refType: DISCUSSION_REF_TYPE,
  page: number = 1,
): Promise<List<Discussion>> => {
  return (
    await serverAxios.get<List<Discussion>>(
      `/discussions?ref=${encodeURIComponent(ref)}&ref_type=${refType}&page=${page}&sortBy=createdAt:desc`,
    )
  ).data
}

export const createDiscussionService = async (
  data: DiscussionCreate,
): Promise<Discussion> => {
  return (await serverAxios.post<Discussion>('/discussions', data)).data
}

export const updateDiscussionService = async (
  id: string,
  data: DiscussionUpdate,
): Promise<Discussion> => {
  return (await serverAxios.patch<Discussion>(`/discussions/${id}`, data)).data
}

export const deleteDiscussionService = async (id: string): Promise<void> => {
  await serverAxios.delete(`/discussions/${id}`)
}
