// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export type ActivityLog = {
  _id: string
  id: string
  name: string
  type: string
  create_by: string
  created_time: string
  origin: string
  ref_type?: string
  ref_id?: string
  parent_id?: string
  project_id?: string
  image?: string
  description?: string
}

export type CreateActivityLog = Omit<
  ActivityLog,
  '_id' | 'id' | 'created_time' | 'origin'
>
