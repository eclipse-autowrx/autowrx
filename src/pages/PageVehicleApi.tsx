import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'
import ModelApiList from '@/components/organisms/ModelApiList'
import { DaImage } from '@/components/atoms/DaImage'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaTreeView from '@/components/molecules/DaTreeView'
import DaLoadingWrapper from '@/components/molecules/DaLoadingWrapper'
import useModelStore from '@/stores/modelStore'
import { TbBinaryTree2, TbList } from 'react-icons/tb'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import VssComparator from '@/components/organisms/VssComparator'

const PageVehicleApi = () => {
  const { model_id, tab } = useParams()
  const navigate = useNavigate()
  const [selectedApi, setSelectedApi] = useState<VehicleApi | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'tree' | 'compare'>('list')
  const [activeModelApis] = useModelStore((state) => [state.activeModelApis])
  const { data: model } = useCurrentModel()

  const handleApiClick = (apiDetails: VehicleApi) => {
    // console.log('apiDetails', apiDetails)
    setSelectedApi(apiDetails)
    navigate(`/model/${model_id}/api/${apiDetails.name}`)
  }

  const isLoading = activeModelApis?.length === 0

  return (
    <DaLoadingWrapper
      isLoading={isLoading}
      data={activeModelApis}
      loadingMessage="Loading Vehicle Signals..."
      emptyMessage="No Signals found."
      timeoutMessage="Failed to load Signals. Please try again."
    >
      <div className="grid grid-cols-12 auto-cols-max bg-white rounded-md h-full w-full">
        <div className="sticky top-0 col-span-12 flex w-full h-10 items-center justify-between">
          <div className="flex space-x-2 h-full">
            <DaTabItem
              active={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
            >
              <TbList className="w-5 h-5 mr-2" />
              List View
            </DaTabItem>

            <DaTabItem
              active={activeTab === 'tree'}
              onClick={() => setActiveTab('tree')}
            >
              <TbBinaryTree2 className="w-5 h-5 mr-2 rotate-[270deg]" />
              Tree View
            </DaTabItem>

            <DaTabItem
              active={activeTab === 'compare'}
              onClick={() => setActiveTab('compare')}
            >
              <TbBinaryTree2 className="w-5 h-5 mr-2 rotate-[270deg]" />
              VSS Comparator
            </DaTabItem>
          </div>
          <DaText variant="regular-bold" className="text-da-primary-500 pr-4">
            COVESA VSS {(model && model.api_version) ?? 'v4.1'}
          </DaText>
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
        {activeTab === 'compare' && (
          <div className="col-span-12 flex w-full h-full overflow-auto items-center justify-center">
            <VssComparator/>
          </div>
        )}
      </div>
    </DaLoadingWrapper>
  )
}

export default PageVehicleApi
