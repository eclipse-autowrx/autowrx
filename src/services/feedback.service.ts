// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'
import { Feedback, FeedbackCreate } from '@/types/model.type'
import { List } from '@/types/common.type'

export const createFeedback = async (
  data: FeedbackCreate,
): Promise<Feedback> => {
  return (await serverAxios.post<Feedback>('/feedbacks', data)).data
}

export const listPrototypeFeedback = async (
  id: string,
  page = 1,
): Promise<List<Feedback>> => {
  return (
    await serverAxios.get(
      `/feedbacks?ref_type=prototype&ref=${id}&page=${page}`,
    )
  ).data
}

export const deleteFeedback = async (id: string) => {
  return (await serverAxios.delete<Feedback>(`/feedbacks/${id}`)).data
}
