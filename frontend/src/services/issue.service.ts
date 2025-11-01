// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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

const getIssueByApiService = async (apiId: string): Promise<Issue> => {
  const response = (
    await serverAxios.get<Issue>(`/issues/by-api`, {
      params: { extendedApi: apiId },
    })
  ).data
  return response
}

export {
  createIssueService,
  getIssuesService,
  getIssueByIdService,
  updateIssueService,
  deleteIssueService,
  getIssueByApiService,
}
