import { discussionMock } from '@/data/discussion_mock'

const IS_MOCK = true

export const listDiscussionsService = async (
  ref_id: string,
  ref_type: string,
) => {
  if (IS_MOCK) {
    return {
      results: discussionMock,
    }
  }
  return {
    results: discussionMock,
  }
}
