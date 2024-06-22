import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'
import ModelApiList from '@/components/organisms/ModelApiList'
import { DaImage } from '@/components/atoms/DaImage'
import { DaText } from '@/components/atoms/DaText'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaTreeView from '@/components/molecules/DaTreeView'

const PageVehicleApi = () => {
  const { model_id, tab } = useParams()
  const navigate = useNavigate()
  const [selectedApi, setSelectedApi] = useState<VehicleApi | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'tree'>('list')

  const handleApiClick = (apiDetails: VehicleApi) => {
    setSelectedApi(apiDetails)
    navigate(`/model/${model_id}/api/${apiDetails.name}`)
  }

  return (
    <div className="grid grid-cols-12 auto-cols-max h-full border">
      <div className="col-span-12 flex w-full h-12 items-center justify-between px-4 bg-da-primary-100 sticky top-0 z-20 ">
        <DaText variant="regular-bold" className="text-da-primary-500">
          COVESA VSS 4.1
        </DaText>
        <div className="flex space-x-2">
          <DaTabItem
            active={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
          >
            List View
          </DaTabItem>
          <DaTabItem
            active={activeTab === 'tree'}
            onClick={() => setActiveTab('tree')}
          >
            Tree View
          </DaTabItem>
        </div>
      </div>
      {activeTab === 'list' && (
        <>
          <div className="col-span-6 flex w-full h-full overflow-auto border-r">
            <ModelApiList onApiClick={handleApiClick} />
          </div>
          <div className="col-span-6 flex w-full h-full overflow-auto">
            {selectedApi ? (
              <ApiDetail apiDetails={selectedApi} />
            ) : (
              <div className="flex justify-center w-full h-full">
                <DaImage
                  src="https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png"
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </>
      )}
      {activeTab === 'tree' && (
        <div className="col-span-12 flex w-full h-[85vh] overflow-auto items-center justify-center">
          <DaTreeView />
        </div>
      )}
    </div>
  )
}

export default PageVehicleApi
