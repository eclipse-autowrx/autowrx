import { DaItemVerticalType2 } from '../molecules/DaItemVerticalType2'
import { Link } from 'react-router-dom'
import useListModelLite from '@/hooks/useListModelLite'
import DaLoadingWrapper from '../molecules/DaLoadingWrapper'

const ModelGrid: React.FC = () => {
  const { data: data, isLoading } = useListModelLite()

  return (
    <DaLoadingWrapper
      loadingMessage="Loading models..."
      isLoading={isLoading}
      data={data?.results}
      emptyMessage="No models found. Please create a new model."
      timeoutMessage="Failed to load models. Please try again."
    >
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-4">
        {data?.results?.map((item, index) => (
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
  )
}

export { ModelGrid }
