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
import {
  TbBinaryTree2,
  TbGitCompare,
  TbList,
  TbDownload,
  TbListTree,
} from 'react-icons/tb'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import VssComparator from '@/components/organisms/VssComparator'
import { getComputedAPIs } from '@/services/model.service'

const PageVehicleApi = () => {
  const { model_id, tab } = useParams()
  const navigate = useNavigate()
  const [selectedApi, setSelectedApi] = useState<VehicleApi | null>(null)
  const [activeTab, setActiveTab] = useState<
    'list' | 'tree' | 'compare' | 'hierarchical'
  >('list')
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
      loadingMessage="Loading Vehicle API..."
      emptyMessage="No Signals found."
      timeoutMessage="Failed to load Signals. Please try again."
    >
      <div className="bg-white rounded-md h-full w-full flex flex-col">
        <div className="flex w-full min-h-10 items-center justify-between">
          <div className="flex space-x-2 h-full">
            <DaTabItem
              active={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
            >
              <TbList className="w-5 h-5 mr-2" />
              List View
            </DaTabItem>

            {/* <DaTabItem
              active={activeTab === 'hierarchical'}
              onClick={() => setActiveTab('hierarchical')}
            >
              <TbListTree className="w-5 h-5 mr-2" />
              Hierarchical View
            </DaTabItem> */}

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
              <TbGitCompare className="w-5 h-5 mr-2" />
              Version Diff
            </DaTabItem>
            <DaTabItem
              active={false}
              onClick={async () => {
                if (!model) return
                try {
                  const data = await getComputedAPIs(model.id)
                  const link = document.createElement('a')
                  link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 4))}`
                  link.download = `${model.name}_vss.json`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                } catch (e) {
                  console.error(e)
                }
              }}
            >
              <TbDownload className="w-5 h-5 mr-2" />
              Download as JSON
            </DaTabItem>
          </div>
          <DaText variant="regular-bold" className="text-da-primary-500 pr-4">
            COVESA VSS {(model && model.api_version) ?? 'v4.1'}
          </DaText>
        </div>
        {(activeTab === 'list' || activeTab === 'hierarchical') && (
          <div className="grow w-full flex overflow-auto">
            <div className="flex-1 flex w-full h-full overflow-auto border-r">
              <ModelApiList
                onApiClick={handleApiClick}
                viewMode={activeTab === 'list' ? 'list' : 'hierarchical'}
              />
            </div>
            <div className="flex-1 flex w-full h-full overflow-auto">
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
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="flex w-full grow overflow-auto items-center justify-center">
            <DaTreeView onNodeClick={() => setActiveTab('list')} />
          </div>
        )}
        {activeTab === 'compare' && (
          <div className="flex w-full grow overflow-auto justify-center">
            <VssComparator />
          </div>
        )}
      </div>
    </DaLoadingWrapper>
  )
}

export default PageVehicleApi
