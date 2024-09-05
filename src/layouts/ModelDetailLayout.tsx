import DaTabItem from '@/components/atoms/DaTabItem'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import { matchRoutes, Outlet, useLocation } from 'react-router-dom'

const cardIntro = [
  {
    title: 'Overview',
    content: 'General information of the vehicle model',
    path: 'overview',
    subs: ['/model/:model_id'],
  },
  {
    title: 'Architecture',
    content: 'Provide the big picture of the vehicle model',
    path: 'architecture',
    subs: ['/model/:model_id/architecture'],
  },
  {
    title: 'Prototype Library',
    content:
      'Build up, evaluate and prioritize your portfolio of connected vehicle applications',
    path: 'library/list',
    subs: [
      '/model/:model_id/library',
      '/model/:model_id/library/:tab',
      '/model/:model_id/library/:tab/:prototype_id',
    ],
  },
  {
    title: 'Vehicle Signals',
    content:
      'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
    path: 'api',
    subs: ['/model/:model_id/api', '/model/:model_id/api/:api'],
  },
]

const ModelDetailLayout = () => {
  const [model] = useModelStore((state) => [state.model as Model])

  const location = useLocation()

  return (
    <div className="flex flex-col w-full h-full rounded-md bg-da-gray-light">
      <div className="flex min-h-[52px] border-b border-da-gray-medium/50 bg-da-white">
        {cardIntro.map((intro, index) => (
          <DaTabItem
            to={`/model/${model?.id}/${intro.path === 'overview' ? '' : intro.path}`}
            active={
              !!matchRoutes(
                intro.subs.map((sub) => ({
                  path: sub,
                })),
                location.pathname,
              )?.at(0)
            }
            key={index}
          >
            {intro.title}
          </DaTabItem>
        ))}
      </div>

      <div className="p-2 h-[calc(100%-52px)] flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}

export default ModelDetailLayout
