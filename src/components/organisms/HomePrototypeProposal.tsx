import { useEffect, useState } from 'react'
import { DaItemVerticalStandard } from '../molecules/DaItemVerticalStandard'
import { DaText } from '../atoms/DaText'
import { Link } from 'react-router-dom'
import useListPrototypeProposal from '@/hooks/useListPrototypeProposal'
import useListModelLite from '@/hooks/useListModelLite'
import { Prototype } from '@/types/model.type'
import { ModelLite } from '@/types/model.type'

const HomePrototypeProposal = () => {
  const { data: models } = useListModelLite()
  const { data } = useListPrototypeProposal()
  const [renderedPrototypes, setRenderedPrototypes] = useState<Prototype[]>([])

  useEffect(() => {
    // console.log('Models: ', models)
    if (data && models) {
      const filteredPrototypes = data.results.filter((prototype) => {
        const model = models.results.find(
          (model: ModelLite) => model.id === prototype.model_id,
        )
        return model && model.visibility === 'public'
      })
      setRenderedPrototypes(filteredPrototypes)
    }
  }, [data, models])

  if (!data || !models) {
    return null
  }

  return (
    renderedPrototypes.length > 0 && (
      <div className="flex container flex-col w-full items-center">
        <DaText variant="sub-title" className="text-da-primary-500 pt-6 pb-10">
          Popular Prototypes
        </DaText>
        <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {renderedPrototypes.map((prototype, pIndex) => (
            <Link
              to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
              key={pIndex}
            >
              <DaItemVerticalStandard
                title={prototype.name}
                content={prototype.description?.solution}
                imageUrl={prototype.image_file}
                maxWidth="400px"
              />
            </Link>
          ))}
        </div>
      </div>
    )
  )
}

export { HomePrototypeProposal }
