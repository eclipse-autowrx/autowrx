import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import ApiList from '@/components/organisms/ApiList'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'
import ModelApiList from '@/components/organisms/ModelApiList'

interface Cvi {
  Vehicle: VehicleApi
}

interface ApiItem {
  api: string
  type: string
  details: VehicleApi
}

const PageVehicleApi = () => {
  const { model_id, api } = useParams()
  const navigate = useNavigate()
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)

  const handleApiClick = (apiDetails: ApiItem) => {
    setSelectedApi(apiDetails)
    navigate(`/model/${model_id}/api/${apiDetails.api}`)
  }

  return (
    <div className="grid grid-cols-12 auto-cols-max">
      <div className="col-span-6 w-full flex overflow-auto border-r">
        <ModelApiList
          onApiClick={handleApiClick}
          onApiSelected={setSelectedApi}
        />
      </div>
      <div className="col-span-6 w-full flex h-full overflow-auto">
        {selectedApi && <ApiDetail apiDetails={selectedApi} />}
      </div>
    </div>
  )
}

export default PageVehicleApi
