import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  DaBreadcrumb,
  DaBreadcrumbItem,
  DaBreadcrumbLink,
  DaBreadcrumbList,
  DaBreadcrumbSeparator,
} from '@/components/atoms/DaBreadcrumb'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'

const breadcrumbNames: { [key: string]: string } = {
  home: 'Home',
  model: 'Vehicle Models',
  library: 'Prototype Library',
  prototype: 'Vehicle Prototypes',
  api: 'Vehicle Signals',
  architecture: 'Vehicle Architecture',
}

const DaBreadcrumbBar = () => {
  const { data: model } = useCurrentModel()
  const { data: prototype } = useCurrentPrototype()
  const location = useLocation()
  const [breadcrumbs, setBreadcrumbs] = useState<JSX.Element[]>([])

  const generateBreadcrumbItem = (
    path: string,
    name: string,
    isLast: boolean,
  ) => (
    <>
      <DaBreadcrumbSeparator />
      <DaBreadcrumbItem>
        <DaBreadcrumbLink>
          <Link
            to={path}
            className={cn(
              'text-da-white hover:opacity-75',
              isLast && 'font-bold border-b',
            )}
          >
            {name}
          </Link>
        </DaBreadcrumbLink>
      </DaBreadcrumbItem>
    </>
  )

  //   useEffect(() => {
  //     console.log('current model', model)
  //     console.log('current prototype', prototype)
  //   }, [model, prototype])

  useEffect(() => {
    const pathnames = location.pathname.split('/').filter((x) => x)
    const breadcrumbList: JSX.Element[] = []

    breadcrumbList.push(
      <DaBreadcrumbItem key="home">
        <Link to="/" className={cn('flex', 'text-primary')}>
          Home
        </Link>
      </DaBreadcrumbItem>,
    )

    const paths: { path: string; name: string; key: string }[] = []

    if (pathnames.includes('model')) {
      paths.push({
        path: '/model',
        name: breadcrumbNames['model'],
        key: 'model',
      })

      if (model && pathnames[1] === model.id) {
        paths.push({
          path: `/model/${model.id}`,
          name: model.name,
          key: model.id,
        })
      }

      if (pathnames.includes('library')) {
        paths.push({
          path: `/model/${model?.id}/library`,
          name: breadcrumbNames['library'],
          key: 'library',
        })

        if (prototype && pathnames.includes('prototype')) {
          paths.push({
            path: `/model/${model?.id}/library/prototype/${prototype.id}`,
            name: prototype.name,
            key: prototype.id,
          })
        }
      }

      if (pathnames.includes('api')) {
        paths.push({
          path: `/model/${model?.id}/api`,
          name: breadcrumbNames['api'],
          key: 'api',
        })
      }

      if (
        pathnames.includes('architecture') &&
        !pathnames.includes('library')
      ) {
        paths.push({
          path: `/model/${model?.id}/architecture`,
          name: breadcrumbNames['architecture'],
          key: 'architecture',
        })
      }
    }

    paths.forEach((breadcrumb, index) => {
      const isLast = index === paths.length - 1
      breadcrumbList.push(
        generateBreadcrumbItem(breadcrumb.path, breadcrumb.name, isLast),
      )
    })

    setBreadcrumbs(breadcrumbList)
  }, [location.pathname, model, prototype])

  return (
    <>
      <DaBreadcrumb className="flex text-da-white da-label-regular-bold">
        <DaBreadcrumbList>{breadcrumbs}</DaBreadcrumbList>
      </DaBreadcrumb>
    </>
  )
}

export default DaBreadcrumbBar
