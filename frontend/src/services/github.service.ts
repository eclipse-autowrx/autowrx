// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'
import {
  GithubUser,
  GithubAuthStatus,
  GithubRepo,
  GitRepository,
  CreateRepoRequest,
  LinkRepoRequest,
  GithubFileContent,
  CommitFileRequest,
  GithubCommit,
  GithubBranch,
} from '@/types/git.type'
import axios from 'axios'

export const getGithubCurrentUser = async (accessToken: string) => {
  return (
    await axios.get<GithubUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ).data
}

// Backend API calls

export const githubOAuthCallback = async (code: string, userId?: string) => {
  return (await serverAxios.post<{ message: string; user: GithubUser }>('/git/github/callback', { code, userId })).data
}

export const getGithubAuthStatus = async () => {
  return (await serverAxios.get<GithubAuthStatus>('/git/github/status')).data
}

export const disconnectGithub = async () => {
  return (await serverAxios.delete<{ message: string }>('/git/github/disconnect')).data
}

export const listGithubRepositories = async (params?: {
  page?: number
  per_page?: number
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
}) => {
  return (await serverAxios.get<GithubRepo[]>('/git/repositories', { params })).data
}

export const createGithubRepository = async (data: CreateRepoRequest) => {
  return (await serverAxios.post<GithubRepo>('/git/repositories', data)).data
}

export const linkRepositoryToPrototype = async (data: LinkRepoRequest) => {
  return (await serverAxios.post<GitRepository>('/git/repositories/link', data)).data
}

export const getLinkedRepository = async (prototypeId: string) => {
  return (await serverAxios.get<GitRepository>(`/git/repositories/prototype/${prototypeId}`)).data
}

export const getGithubFileContents = async (owner: string, repo: string, path: string, ref?: string) => {
  return (
    await serverAxios.get<GithubFileContent>(`/git/repos/${owner}/${repo}/contents`, {
      params: { path, ref },
    })
  ).data
}

export const commitGithubFile = async (owner: string, repo: string, data: CommitFileRequest) => {
  return (await serverAxios.put<any>(`/git/repos/${owner}/${repo}/contents`, data)).data
}

export const commitMultipleGithubFiles = async (
  owner: string,
  repo: string,
  data: {
    branch: string
    message: string
    files: Array<{ path: string; content: string }>
  }
) => {
  return (
    await serverAxios.post<{
      success: boolean
      commitSha: string
      filesCount: number
    }>(`/git/repos/${owner}/${repo}/commit`, data)
  ).data
}

export const getGithubCommits = async (
  owner: string,
  repo: string,
  params?: {
    sha?: string
    per_page?: number
    page?: number
  }
) => {
  return (await serverAxios.get<GithubCommit[]>(`/git/repos/${owner}/${repo}/commits`, { params })).data
}

export const getGithubBranches = async (owner: string, repo: string) => {
  return (await serverAxios.get<GithubBranch[]>(`/git/repos/${owner}/${repo}/branches`)).data
}

export const createGithubBranch = async (
  owner: string,
  repo: string,
  data: {
    branchName: string
    baseBranch?: string
  }
) => {
  return (
    await serverAxios.post<{
      success: boolean
      branchName: string
    }>(`/git/repos/${owner}/${repo}/branches`, data)
  ).data
}

