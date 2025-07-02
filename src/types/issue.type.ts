// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface IssueCreate {
  extendedApi: string
  title: string
  githubAccessToken: string
  content?: string
  model: string
}

export interface Issue {
  id: string
  extendedApi: string
  createdAt: string
  link: string
  updatedAt: string
}
