import { useEffect, useState } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import { matchRoutes, Outlet, useLocation } from 'react-router-dom'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import DaLoading from '@/components/atoms/DaLoading'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import { shallow } from 'zustand/shallow'
import useLastAccessedModel from '@/hooks/useLastAccessedModel'

const ModelDetailLayout = () => {
  const [model] = useModelStore((state) => [state.model as Model])
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const { data: fetchedPrototypes } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  const { setLastAccessedModel } = useLastAccessedModel()

  useEffect(() => {
    if (model) {
      setLastAccessedModel(model.id)
    }
  }, [model])

  useEffect(() => {
    // Simulate loading state for demonstration
    const timeout = setTimeout(() => setIsLoading(false), 500) // Adjust the time if needed
    return () => clearTimeout(timeout)
  }, [location.pathname])

  const skeleton = JSON.parse(model?.skeleton || '{}')
  const numberOfNodes = skeleton?.nodes?.length || 0
  const numberOfPrototypes = fetchedPrototypes?.length || 0
  const numberOfApis = activeModelApis?.length || 0

  const cardIntro = [
    {
      title: `Overview`,
      content: 'General information of the vehicle model',
      path: 'overview',
      subs: ['/model/:model_id'],
      count: null, // No count for Overview
    },
    {
      title: `Architecture`,
      content: 'Provide the big picture of the vehicle model',
      path: 'architecture',
      subs: ['/model/:model_id/architecture'],
      count: numberOfNodes,
    },
    {
      title: `Vehicle API`,
      content:
        'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
      path: 'api',
      subs: ['/model/:model_id/api', '/model/:model_id/api/:api'],
      count: model?.extend?.vehicle_api?.supports?.length || numberOfApis,
    },
    {
      title: `Prototype Library`,
      content:
        'Build up, evaluate and prioritize your portfolio of connected vehicle applications',
      path: 'library/list',
      subs: [
        '/model/:model_id/library',
        '/model/:model_id/library/:tab',
        '/model/:model_id/library/:tab/:prototype_id',
      ],
      count: numberOfPrototypes,
    },
  ]

  return (
    <div className="flex flex-col w-full h-full rounded-md bg-da-gray-light">
      <div className="flex min-h-[52px] border-b border-da-gray-medium/50 bg-da-white">
        {model ? (
          cardIntro.map((intro, index) => (
            <DaTabItem
              to={`/model/${model.id}/${intro.path === 'overview' ? '' : intro.path}`}
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
              {intro.count !== null && (
                <div className="flex min-w-5 px-1.5 !py-0.5 items-center justify-center text-xs ml-1 bg-gray-200 rounded-md">
                  {intro.count}
                </div>
              )}
            </DaTabItem>
          ))
        ) : (
          <div className="flex items-center h-full space-x-6 px-4">
            {cardIntro.map((_, index) => (
              <DaSkeleton key={index} className="w-[100px] h-6" />
            ))}
          </div>
        )}
      </div>

      <div className="p-2 h-[calc(100%-52px)] flex flex-col">
        {isLoading ? (
          <div className="flex w-full h-full bg-white rounded-lg">
            <DaLoading className="h-[80%] pt-2" text="Loading Model..." />
          </div>
        ) : (
          <div className="w-full h-full bg-white rounded-lg">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelDetailLayout
