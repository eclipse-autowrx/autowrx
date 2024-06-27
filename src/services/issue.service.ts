import { Issue, IssueCreate } from '@/types/issue.type'
import { serverAxios } from './base'

const createIssueService = async (data: IssueCreate): Promise<Issue> => {
  const response = (await serverAxios.post<Issue>('/issues', data)).data
  return response
}

const getIssuesService = async (
  params?: Record<string, unknown>,
): Promise<Issue[]> => {
  const response = (
    await serverAxios.get<{ results: Issue[] }>('/issues', { params })
  ).data
  return response.results
}

const getIssueByIdService = async (issueId: string): Promise<Issue> => {
  const response = (await serverAxios.get<Issue>(`/issues/${issueId}`)).data
  return response
}

const updateIssueService = async (
  issueId: string,
  data: Partial<Issue>,
): Promise<Issue> => {
  const response = (await serverAxios.patch<Issue>(`/issues/${issueId}`, data))
    .data
  return response
}

const deleteIssueService = async (issueId: string): Promise<void> => {
  await serverAxios.delete(`/issues/${issueId}`)
}

const getIssueByModelAndApiService = async (
  modelId: string,
  apiId: string,
): Promise<Issue[]> => {
  const response = (
    await serverAxios.get<{ results: Issue[] }>(`/issues/by-model-api`, {
      params: { model: modelId, api: apiId },
    })
  ).data
  return response.results
}

export {
  createIssueService,
  getIssuesService,
  getIssueByIdService,
  updateIssueService,
  deleteIssueService,
  getIssueByModelAndApiService,
}
