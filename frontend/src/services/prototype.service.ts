// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { List } from '@/types/common.type'
import { serverAxios, cacheAxios } from './base'
import { Prototype } from '@/types/model.type'

export const listPopularPrototypes = async (): Promise<Prototype[]> => {
  const response = await serverAxios.get('/prototypes/popular')
  return response.data
}

export const listRecentPrototypes = async (): Promise<Prototype[]> => {
  const response = await serverAxios.get('/prototypes/recent')
  return response.data
}

export const listAllPrototypes = async (): Promise<List<Prototype>> => {
  let page = 1
  const limit = 12
  let allResults: Prototype[] = []
  let totalPages = 1
  const addedIds = new Set<string>() // To track added prototype IDs, BE have duplicate data

  do {
    const response = await serverAxios.get<List<Prototype>>('/prototypes', {
      params: {
        fields: [
          'model_id',
          'name',
          'visibility',
          'image_file',
          'id',
          'created_at',
          'created_by',
          'tags',
          'state',
        ].join(','),
        page,
        limit,
      },
    })

    response.data.results.forEach((prototype) => {
      if (addedIds.has(prototype.id)) {
      } else {
        addedIds.add(prototype.id)
        allResults.push(prototype)
      }
    })

    totalPages = response.data.totalPages
    page++
  } while (page <= totalPages)

  return {
    results: allResults,
    totalPages: 1,
    totalResults: allResults.length,
    page: 1,
    limit: allResults.length,
  }
}

export const getPrototype = async (prototype_id: string) => {
  if (!prototype_id) return null
  return (await serverAxios.get<Prototype>(`/prototypes/${prototype_id}`)).data
}

export const listModelPrototypes = async (model_id: string) => {
  return (
    await serverAxios.get<List<Prototype>>(
      `/prototypes?model_id=${model_id}&limit=50`,
    )
  ).data.results
}

export const createPrototypeService = async (prototype: any) => {
  return (await serverAxios.post<Prototype>('/prototypes', prototype)).data
}

export const createBulkPrototypesService = async (prototypes: any[]) => {
  return await serverAxios.post<Prototype[]>('/prototypes/bulk', prototypes)
}

export const updatePrototypeService = async (
  prototype_id: string,
  data: Partial<Prototype>,
) => {
  return (
    await serverAxios.patch<Prototype>(`/prototypes/${prototype_id}`, data)
  ).data
}

export const deletePrototypeService = async (prototype_id: string) => {
  return await serverAxios.delete(`/prototypes/${prototype_id}`)
}

export const saveRecentPrototype = async (
  userId: string,
  referenceId: string,
  type: string,
  page: string,
) => {
  // return cacheAxios.post('/save-to-db', {
  //   userId,
  //   referenceId,
  //   type,
  //   page,
  // })
}

export const countCodeExecution = async (prototypeId: string) => {
  return serverAxios.post(`/prototypes/${prototypeId}/execute-code`)
}

export type PrototypeUsedApisWorkspaceResponse = {
  folderPath: string
  source: string
  usedApiNames: string[]
}

export const getPrototypeUsedApisFromWorkspaceService = async (
  prototypeId: string,
): Promise<PrototypeUsedApisWorkspaceResponse> => {
  return (
    await serverAxios.get<PrototypeUsedApisWorkspaceResponse>(
      `/prototypes/${prototypeId}/used-apis`,
    )
  ).data
}

export const getPrototypeWorkspaceTreeService = async (
  prototypeId: string,
): Promise<any> => {
  return (await serverAxios.get(`/prototypes/${prototypeId}/workspace-tree`))
    .data
}

export const getPrototypeFileContentService = async (
  prototypeId: string,
  filePath: string,
): Promise<string> => {
  const response = await serverAxios.get<{ content: string }>(
    `/prototypes/${prototypeId}/files`,
    { params: { path: filePath } },
  )
  return response.data.content
}

export const savePrototypeFileContentService = async (
  prototypeId: string,
  filePath: string,
  content: string,
): Promise<void> => {
  await serverAxios.post(`/prototypes/${prototypeId}/files`, {
    path: filePath,
    content: content,
  })
}

export const createPrototypeFolderService = async (
  prototypeId: string,
  folderPath: string,
): Promise<void> => {
  await serverAxios.post(`/prototypes/${prototypeId}/folders`, {
    path: folderPath,
  })
}

export const deletePrototypeFileSystemItemService = async (
  prototypeId: string,
  itemPath: string,
): Promise<void> => {
  await serverAxios.delete(`/prototypes/${prototypeId}/files`, {
    params: { path: itemPath },
  })
}

export const renamePrototypeFileSystemItemService = async (
  prototypeId: string,
  oldPath: string,
  newPath: string,
): Promise<void> => {
  await serverAxios.patch(`/prototypes/${prototypeId}/files`, {
    oldPath,
    newPath,
  })
}
