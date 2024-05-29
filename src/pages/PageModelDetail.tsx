import React from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { models } from '@/data/models_mock'
import { DaText } from '@/components/atoms/DaText'
import { DaCardIntro } from '@/components/molecules/DaCardIntro'

const PageModelDetail: React.FC = () => {
  const { model_id } = useParams<{ model_id: string }>()
  const location = useLocation()

  const model = models.find((model) => model.id === model_id)

  if (!model) {
    return <div>Model not found</div>
  }

  const cardIntro = [
    {
      title: 'Architecture',
      content: 'Provide the big picture of the vehicle model',
      path: 'architecture',
    },
    {
      title: 'Prototype Library',
      content:
        'Build up, evaluate and prioritize your portfolio of connected vehicle applications',
      path: 'prototypes',
    },
    {
      title: 'Vehicle APIs',
      content:
        'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
      path: 'api',
    },
  ]

  return (
    <div className="grid grid-cols-12 h-full px-2 py-4 container space-y-2">
      <div className="col-span-7">
        <DaText variant="title" className="text-da-primary-500">
          {model.name}
        </DaText>

        {cardIntro.map((card, index) => (
          <Link key={index} to={`${location.pathname}/${card.path}`}>
            <div className="space-y-3 mt-3 da-clickable">
              <DaCardIntro
                key={index}
                title={card.title}
                content={card.content}
                maxWidth={'600px'}
              />
            </div>
          </Link>
        ))}
      </div>
      <div className="col-span-5">
        <img src={model.model_home_image_file} alt={model.name} />
      </div>
    </div>
  )
}

export default PageModelDetail
