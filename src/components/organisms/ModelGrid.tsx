import { useState, useEffect } from 'react'
import { DaItemVerticalType2 } from '../molecules/DaItemVerticalType2'
import { Link } from 'react-router-dom'
import useListModelLite from '@/hooks/useListModelLite'
import useListModelContribution from '@/hooks/useListModelContribution'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaLoadingWrapper from '../molecules/DaLoadingWrapper'
import DaTabItem from '../atoms/DaTabItem'
import { ModelLite } from '@/types/model.type'

const ModelGrid: React.FC = () => {
  const { data: allModel, isLoading: isLoadingPublicModel } = useListModelLite()
  const { data: contributionModel, isLoading: isLoadingContributionModel } =
    useListModelContribution()
  const { data: user } = useSelfProfileQuery()
  const [activeTab, setActiveTab] = useState<
    'public' | 'myModel' | 'myContribution'
  >('myContribution')
  const [filteredModels, setFilteredModels] = useState<ModelLite[]>([])

  useEffect(() => {
    if (!user) {
      setActiveTab('public')
    }
    if (activeTab === 'myContribution' && user) {
      setFilteredModels(contributionModel?.results || [])
    } else if (activeTab === 'myModel' && user) {
      setFilteredModels(
        contributionModel?.results?.filter(
          (model) => model.created_by === user.id,
        ) || [],
      )
    } else if (activeTab === 'public') {
      const publicModels =
        allModel?.results?.filter((model) => model.visibility === 'public') ||
        []
      setFilteredModels(publicModels)
    }
  }, [activeTab, contributionModel, allModel, user])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex w-full mb-4 space-x-2">
        {user && (
          <>
            <DaTabItem
              small
              active={activeTab === 'myContribution'}
              onClick={() => setActiveTab('myContribution')}
            >
              My Contributions
            </DaTabItem>
            <DaTabItem
              small
              active={activeTab === 'myModel'}
              onClick={() => setActiveTab('myModel')}
            >
              My Models
            </DaTabItem>
          </>
        )}
        <DaTabItem
          small
          active={activeTab === 'public'}
          onClick={() => setActiveTab('public')}
        >
          Public
        </DaTabItem>
      </div>
      <DaLoadingWrapper
        loadingMessage="Loading models..."
        isLoading={isLoadingPublicModel || isLoadingContributionModel}
        data={filteredModels}
        emptyMessage="No models found. Please create a new model."
        timeoutMessage="Failed to load models. Please try again."
      >
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-4">
          {filteredModels?.map((item, index) => (
            <Link key={index} to={`/model/${item.id}`}>
              <DaItemVerticalType2
                title={item.name}
                imageUrl={item.model_home_image_file}
                tags={item.tags?.map((tag) => `${tag.tag}`) || []}
                maxWidth="800px"
              />
            </Link>
          ))}
        </div>
      </DaLoadingWrapper>
    </div>
  )
}

export { ModelGrid }
