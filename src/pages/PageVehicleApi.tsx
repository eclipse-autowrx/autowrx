import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import ApiList from '@/components/organisms/ApiList'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'

interface Cvi {
  Vehicle: VehicleApi
}

interface ApiItem {
  api: string
  type: string
  details: VehicleApi
}

const parseCvi = (cvi: Cvi) => {
  const traverse = (
    node: VehicleApi,
    prefix: string = 'Vehicle',
  ): { api: string; type: string; details: VehicleApi }[] => {
    let result: { api: string; type: string; details: VehicleApi }[] = []
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        node.children[key].api = newPrefix
        result.push({ api: newPrefix, type: child.type, details: child })
        result = result.concat(traverse(child, newPrefix))
      }
    }
    return result
  }
  return traverse(cvi.Vehicle)
}

const PageVehicleApi = () => {
  const { model_id, api } = useParams()
  const navigate = useNavigate()
  const [apiList, setApiList] = useState<ApiItem[]>([])
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)

  useEffect(() => {
    const cviData: Cvi = JSON.parse(CVI_v4_1)
    const parsedApiList = parseCvi(cviData)
    setApiList(parsedApiList)
    // console.log('CVI_v4_1', cviData)
    // console.log('parsedApiList', parsedApiList)
  }, [])

  useEffect(() => {
    if (api) {
      const foundApi = apiList.find((apiItem) => apiItem.api === api)
      if (foundApi) {
        setSelectedApi(foundApi)
      }
    }
  }, [api, apiList])

  // useEffect(() => {
  //   console.log('selectedApi', selectedApi)
  // }, [selectedApi])

  const handleApiClick = (apiDetails: ApiItem) => {
    setSelectedApi(apiDetails)
    navigate(`/model/${model_id}/api/${apiDetails.api}`)
  }

  return (
    <>
      <div className="flex col-span-6 w-full overflow-auto border-r">
        <ApiList
          apiList={apiList}
          onApiClick={handleApiClick}
          selectedApi={selectedApi}
        />
      </div>
      <div className="flex col-span-6 w-full h-full overflow-auto">
        {selectedApi && <ApiDetail apiDetails={selectedApi} />}
      </div>
    </>
  )
}

export default PageVehicleApi
