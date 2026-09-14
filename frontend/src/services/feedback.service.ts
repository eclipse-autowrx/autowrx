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

export const createFeedbackService = createFeedback

export const listPrototypeFeedback = async (
  prototypeId: string,
  page: number = 1,
): Promise<List<Feedback>> => {
  return (
    await serverAxios.get<List<Feedback>>(
      `/feedbacks?ref_type=prototype&ref=${prototypeId}&page=${page}`,
    )
  ).data
}

export const deleteFeedback = async (id: string): Promise<Feedback> => {
  return (await serverAxios.delete<Feedback>(`/feedbacks/${id}`)).data
}

export const deleteFeedbackService = deleteFeedback

export const updateFeedbackService = async (
  id: string,
  data: Partial<FeedbackCreate>,
): Promise<Feedback> => {
  return (await serverAxios.patch<Feedback>(`/feedbacks/${id}`, data)).data
}
