// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
import { API_V2 } from './base'

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

export const githubOAuthCallback = async (code: string) => {
  return (await API_V2.post<{ message: string; user: GithubUser }>('/git/github/callback', { code })).data
}

export const getGithubAuthStatus = async () => {
  return (await API_V2.get<GithubAuthStatus>('/git/github/status')).data
}

export const disconnectGithub = async () => {
  return (await API_V2.delete<{ message: string }>('/git/github/disconnect')).data
}

export const listGithubRepositories = async (params?: {
  page?: number
  per_page?: number
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
}) => {
  return (await API_V2.get<GithubRepo[]>('/git/repositories', { params })).data
}

export const createGithubRepository = async (data: CreateRepoRequest) => {
  return (await API_V2.post<GithubRepo>('/git/repositories', data)).data
}

export const linkRepositoryToPrototype = async (data: LinkRepoRequest) => {
  return (await API_V2.post<GitRepository>('/git/repositories/link', data)).data
}

export const getLinkedRepository = async (prototypeId: string) => {
  return (await API_V2.get<GitRepository>(`/git/repositories/prototype/${prototypeId}`)).data
}

export const getGithubFileContents = async (owner: string, repo: string, path: string, ref?: string) => {
  return (
    await API_V2.get<GithubFileContent>(`/git/repos/${owner}/${repo}/contents`, {
      params: { path, ref },
    })
  ).data
}

export const commitGithubFile = async (owner: string, repo: string, data: CommitFileRequest) => {
  return (await API_V2.put<any>(`/git/repos/${owner}/${repo}/contents`, data)).data
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
  return (await API_V2.get<GithubCommit[]>(`/git/repos/${owner}/${repo}/commits`, { params })).data
}

export const getGithubBranches = async (owner: string, repo: string) => {
  return (await API_V2.get<GithubBranch[]>(`/git/repos/${owner}/${repo}/branches`)).data
}

