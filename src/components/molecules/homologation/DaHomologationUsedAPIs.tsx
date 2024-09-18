import { useCallback, useEffect, useState } from 'react'

import clsx from 'clsx'
import HomologationUsedAPIsHeader from './DaHomologationUsedAPIsHeader'
import { VehicleAPI } from '@/types/api.type'
import useCurrentModel from '@/hooks/useCurrentModel'
import { supportedCertivityApis } from '@/services/certivity.service'
import { DaApiListItem } from '../DaApiList'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useApiByModelId from '@/hooks/useApisByModelId'
import DaHomologationApiListItem from './DaHomologationApiListItem'

type DaHomologationUsedAPIsProps = {
  selectedAPIs: Set<VehicleAPI>
  setSelectedAPIs: (apis: Set<VehicleAPI>) => void
}

const DaHomologationUsedAPIs = ({
  selectedAPIs,
  setSelectedAPIs,
}: DaHomologationUsedAPIsProps) => {
  const [usedAPIs, setUsedAPIs] = useState<VehicleAPI[]>([])
  const { data: model } = useCurrentModel()
  const { data: prototype } = useCurrentPrototype()
  const { data: api } = useApiByModelId(model?.id)

  const convertNodeToItem = useCallback(
    (
      parent: string | null,
      name: string,
      node: any,
      returnList: VehicleAPI[],
    ) => {
      if (!node || !name) return
      let item: VehicleAPI = {
        name: parent ? parent + '.' + name : name,
        type: node.type,
        uuid: node.uuid,
        description: node.description,
        parent: parent,
        isWishlist: false,
      }
      returnList.push(item)
      if (node.children) {
        for (let childKey in node.children) {
          convertNodeToItem(
            item.name,
            childKey,
            node.children[childKey],
            returnList,
          )
        }
      }
    },
    [],
  )

  const convertCVITreeToList = useCallback(
    (apiData: any) => {
      if (!apiData) return []
      let ret: any[] = []
      convertNodeToItem(null, 'Vehicle', apiData['Vehicle'], ret)
      return ret
    },
    [convertNodeToItem],
  )

  const fetchAPIs = useCallback(async () => {
    const cvi = JSON.parse(api?.cvi ?? '{}')
    const cviList = convertCVITreeToList(cvi)
    let wishlistApi: VehicleAPI[] = []

    if (model?.custom_apis) {
      for (let key in model.custom_apis) {
        let node: any = model.custom_apis[key]
        for (let childKey in node) {
          convertNodeToItem(key, childKey, node[childKey], wishlistApi)
        }
      }

      wishlistApi.forEach((a) => (a.isWishlist = true))
    }
    const combine = [...wishlistApi, ...cviList]
    const finalResult: VehicleAPI[] = []
    combine.forEach((item) => {
      if (item.type == 'branch') return
      let arName = item.name.split('.')
      if (arName.length > 1) {
        item.shortName = '.' + arName.slice(1).join('.')
        finalResult.push(item)
      }
    })

    return finalResult
  }, [convertCVITreeToList, convertNodeToItem, model?.custom_apis, api?.cvi])

  // Sort by supported and not supported APIs
  const compareFn = useCallback((a: VehicleAPI, b: VehicleAPI) => {
    const aIsSupported = supportedCertivityApis.has('Vehicle' + a.shortName)
    const bIsSupported = supportedCertivityApis.has('Vehicle' + b.shortName)
    if (Number(aIsSupported) < Number(bIsSupported)) return 1
    if (Number(aIsSupported) > Number(bIsSupported)) return -1
    return a.name.localeCompare(b.name)
  }, [])

  useEffect(() => {
    ;(async () => {
      if (prototype?.code) {
        const allAPIs = await fetchAPIs()
        const res: VehicleAPI[] = []
        for (let api of allAPIs) {
          if (api.shortName && prototype.code.includes(api.shortName)) {
            res.push(api)
          }
        }

        return setUsedAPIs(res.sort(compareFn))
      }
      setUsedAPIs([])
    })()
  }, [])

  const selectAPIHandler = (api: VehicleAPI) => () => {
    if (selectedAPIs.has(api)) {
      selectedAPIs.delete(api)
    } else {
      selectedAPIs.add(api)
    }
    setSelectedAPIs(new Set(selectedAPIs))
  }

  const getRoundedClassesOfRow = useCallback(
    (index: number) => {
      const res: string[] = []
      if (!selectedAPIs.has(usedAPIs[index])) {
        res.push('rounded-lg')
        return res
      }
      if (index === 0) res.push('rounded-t-lg')
      if (index === usedAPIs.length - 1) res.push('rounded-b-lg')
      if (
        index + 1 >= usedAPIs.length ||
        !selectedAPIs.has(usedAPIs[index + 1])
      )
        res.push('rounded-b-lg')
      if (index - 1 < 0 || !selectedAPIs.has(usedAPIs[index - 1]))
        res.push('rounded-t-lg')
      return res
    },
    [selectedAPIs, usedAPIs],
  )

  return (
    <div className="rounded-3xl flex flex-col w-full bg-da-gray-light/20 px-5 pt-5 pb-3 h-full text-da-gray-medium">
      <HomologationUsedAPIsHeader
        selectedAPIs={selectedAPIs}
        setSelectedAPIs={setSelectedAPIs}
        usedAPIs={usedAPIs}
      />

      {/* List of used APIs */}
      {usedAPIs.length > 0 ? (
        <ul className="flex-1 min-h-0 overflow-y-auto scroll-gray -mx-2">
          {usedAPIs.map((api, index) => (
            <div key={api.name}>
              <DaHomologationApiListItem
                api={{
                  ...api,
                  name: api.name,
                }}
                onClick={selectAPIHandler(api)}
                isSelected={selectedAPIs.has(api)}
                className={getRoundedClassesOfRow(index).join(' ')}
                isDisabled={
                  !supportedCertivityApis.has('Vehicle' + api.shortName)
                }
              />
            </div>
          ))}
        </ul>
      ) : (
        <div className="da-label-small h-full flex italic items-center text-da-gray-medium justify-center py-6">
          {'<'}No APIs used{'>'}
        </div>
      )}
    </div>
  )
}

export default DaHomologationUsedAPIs
