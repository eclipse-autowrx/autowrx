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
