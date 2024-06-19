import { serverAxios } from './base'
import { Feedback, FeedbackCreate } from '@/types/model.type'

export const createFeedback = async (
  data: FeedbackCreate,
): Promise<Feedback> => {
  return (await serverAxios.post<Feedback>('/feedbacks', data)).data
}

export const listPrototypeFeedback = async (
  id: string,
): Promise<Feedback[]> => {
  return (await serverAxios.get(`/feedbacks?ref_type=prototype&ref=${id}`)).data
    .results
}

export const deleteFeedback = async (id: string) => {
  return (await serverAxios.delete<Feedback>(`/feedbacks/${id}`)).data
}
