import { discussionMock } from '@/data/discussion_mock'
import {
  DISCUSSION_REF_TYPE,
  Discussion,
  DiscussionCreate,
} from '@/types/discussion.type'
import { serverAxios } from './base'
import { List } from '@/types/common.type'

const IS_MOCK = false

export const listDiscussionsService = async (
  ref: string,
  ref_type: DISCUSSION_REF_TYPE,
  populate?: string,
) => {
  if (IS_MOCK) {
    return {
      results: discussionMock,
    }
  }
  return (
    await serverAxios.get<List<Discussion>>('/discussions', {
      params: {
        ref,
        ref_type,
        populate,
      },
    })
  ).data
}

export const createDiscussionService = async (body: DiscussionCreate) => {
  return (await serverAxios.post<Discussion>('/discussions', body)).data
}

export const deleteDiscussionService = async (id: string) => {
  return await serverAxios.delete(`/discussions/${id}`)
}

export const updateDiscussionService = async (
  id: string,
  body: Partial<Discussion>,
) => {
  return (await serverAxios.patch<Discussion>(`/discussions/${id}`, body)).data
}
