// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface GitCredential {
  user_id: string
  github_username: string
  github_user_id: string
  github_avatar_url?: string
  github_email?: string
  expires_at?: string
  createdAt: string
  updatedAt: string
}

export interface GitRepository {
  id: string
  user_id: string
  prototype_id?: string
  github_repo_id: string
  github_repo_name: string
  github_repo_full_name: string
  github_repo_url: string
  github_repo_clone_url: string
  github_default_branch: string
  github_repo_private: boolean
  last_commit_sha?: string
  last_sync_at?: string
  createdAt: string
  updatedAt: string
}

export interface GithubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  clone_url: string
  description?: string
  default_branch: string
  owner: {
    login: string
    avatar_url: string
  }
  updated_at: string
  pushed_at: string
}

export interface GithubUser {
  login: string
  id: number
  avatar_url: string
  username: string
  email?: string
  name?: string
}

export interface GithubAuthStatus {
  authenticated: boolean
  username?: string
  avatar_url?: string
  email?: string
}

export interface GithubFileContent {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url?: string
  type: 'file' | 'dir'
  content?: string
  encoding?: string
}

export interface GithubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author?: {
    login: string
    avatar_url: string
  }
}

export interface GithubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export interface CreateRepoRequest {
  name: string
  description?: string
  private?: boolean
  auto_init?: boolean
}

export interface LinkRepoRequest {
  prototype_id: string
  repo_id: string
  repo_name: string
  repo_full_name: string
  repo_url: string
  clone_url: string
  default_branch?: string
  is_private?: boolean
}

export interface CommitFileRequest {
  path: string
  content: string
  message: string
  sha?: string | null
  branch?: string
}
