import { List } from '@/types/common.type'
import { serverAxios, cacheAxios } from './base'
import { Prototype } from '@/types/model.type'
import { CacheEntity, CachePrototype } from '@/types/cache.type'
import { User } from '@/types/user.type'
import { listModelsLite } from './model.service'
import dayjs from 'dayjs'

export const listPopularPrototypes = async (): Promise<List<Prototype>> => {
  let page = 1
  const limit = 12
  let allResults: Prototype[] = []
  let totalPages = 1
  const addedIds = new Set<string>() // To track added prototype IDs

  // console.log('Fetching models...')
  const allModels = await listModelsLite()
  const publicModelIds = allModels.results
    .filter((model) => model.visibility === 'public')
    .map((model) => model.id)

  // console.log('Public Model IDs:', publicModelIds)

  // Fetch all prototypes with pagination
  do {
    console.log(`Fetching prototypes - Page: ${page}`)
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

    // console.log(
    //   `Fetched ${response.data.results.length} prototypes on page ${page}`,
    // )
    response.data.results.forEach((prototype) => {
      if (addedIds.has(prototype.id)) {
        // console.log(
        //   `Duplicate found: Prototype ID ${prototype.id} on page ${page}`,
        // )
      } else {
        addedIds.add(prototype.id)
        allResults.push(prototype)
      }
    })

    totalPages = response.data.totalPages
    page++
  } while (page <= totalPages)

  // Filter results to only include prototypes with the specified conditions
  const filteredResults = allResults.filter(
    (prototype) =>
      publicModelIds.includes(prototype.model_id) &&
      prototype.image_file !== 'https://placehold.co/600x400' &&
      prototype.state === 'Released',
  )

  return {
    results: filteredResults,
    totalPages: 1, // Since we are returning all filtered results in one page
    totalResults: filteredResults.length,
    page: 1,
    limit: filteredResults.length, // Limit is set to the length of filtered results
  }
}

export const listAllPrototypes = async (): Promise<List<Prototype>> => {
  let page = 1
  const limit = 12
  let allResults: Prototype[] = []
  let totalPages = 1
  const addedIds = new Set<string>() // To track added prototype IDs, BE have duplicate data

  // const allModels = await listModelsLite()
  // const publicModelIds = allModels.results
  //   .filter((model) => model.visibility === 'public')
  //   .map((model) => model.id)

  // Fetch all prototypes with pagination
  do {
    console.log(`Fetching prototypes - Page: ${page}`)
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

    // console.log(
    //   `Fetched ${response.data.results.length} prototypes on page ${page}`,
    // )
    response.data.results.forEach((prototype) => {
      if (addedIds.has(prototype.id)) {
        // console.log(
        //   `Duplicate found: Prototype ID ${prototype.id} on page ${page}`,
        // )
      } else {
        addedIds.add(prototype.id)
        allResults.push(prototype)
      }
    })

    totalPages = response.data.totalPages
    // console.log(`Total pages: ${totalPages}`)
    page++
  } while (page <= totalPages)

  // const filteredResults = allResults.filter((prototype) =>
  //   publicModelIds.includes(prototype.model_id),
  // )

  // console.log('Filtered Results:', filteredResults)

  return {
    results: allResults,
    totalPages: 1, // Since we are returning all filtered results in one page
    totalResults: allResults.length,
    page: 1,
    limit: allResults.length, // Limit is set to the length of filtered results
  }
}

export const getPrototype = async (prototype_id: string) => {
  if (!prototype_id) return null
  return (await serverAxios.get<Prototype>(`/prototypes/${prototype_id}`)).data
}

export const listModelPrototypes = async (model_id: string) => {
  return (
    await serverAxios.get<List<Prototype>>(`/prototypes?model_id=${model_id}`)
  ).data.results
}

export const createPrototypeService = async (prototype: any) => {
  return (await serverAxios.post<Prototype>('/prototypes', prototype)).data
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

export const listRecentPrototypes = async (user: User) => {
  const cachePrototypes = (
    await cacheAxios.get<CacheEntity[]>(`/get-recent-activities/${user.id}`)
  ).data

  const allPrototypes = await listAllPrototypes()

  let results: CachePrototype[] = []

  // Iterate over user prototypes and find corresponding cache entries
  allPrototypes.results.forEach((prototype) => {
    const cachePrototype = cachePrototypes.find(
      (cachePrototype) => cachePrototype.referenceId === prototype.id,
    )

    // Only push prototypes that have a corresponding cache entry
    if (cachePrototype) {
      results.push({
        ...prototype,
        page: cachePrototype.page || '',
        time: cachePrototype.time,
      } as CachePrototype)
    }
  })

  results = results.sort((a, b) => dayjs(b.time).unix() - dayjs(a.time).unix())
  return {
    data: results,
  }
}

export const saveRecentPrototype = async (
  userId: string,
  referenceId: string,
  type: string,
  page: string,
) => {
  return cacheAxios.post('/save-to-db', {
    userId,
    referenceId,
    type,
    page,
  })
}
