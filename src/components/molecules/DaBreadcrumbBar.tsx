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
import DaPopup from '../atoms/DaPopup'
import DaDiscussions from './DaDiscussions'
import { DaButton } from '../atoms/DaButton'
import { TbMessage } from 'react-icons/tb'
import { PERMISSIONS } from '@/data/permission'
import usePermissionHook from '@/hooks/usePermissionHook'

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
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  const generateBreadcrumbItem = (
    path: string,
    name: string,
    isLast: boolean,
    key: string,
  ) => (
    <React.Fragment key={key}>
      <DaBreadcrumbSeparator />
      <DaBreadcrumbItem>
        <Link
          to={path}
          className={cn(
            'text-da-white hover:opacity-75',
            isLast && ' border-b',
          )}
        >
          {name}
        </Link>
      </DaBreadcrumbItem>
    </React.Fragment>
  )
  const pathnames = location.pathname.split('/').filter((x) => x)

  useEffect(() => {
    const breadcrumbList: JSX.Element[] = []

    breadcrumbList.push(
      <DaBreadcrumbItem key="home">
        <Link to="/" className="flex text-primary">
          Home
        </Link>
      </DaBreadcrumbItem>,
    )

    const paths: { path: string; name: string; key: string }[] = []

    if (model && model.id && pathnames.includes('model')) {
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

        if (prototype && prototype.id && pathnames.includes('prototype')) {
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
        generateBreadcrumbItem(
          breadcrumb.path,
          breadcrumb.name,
          isLast,
          breadcrumb.key,
        ),
      )
    })

    setBreadcrumbs(breadcrumbList)
  }, [location.pathname, model, prototype])

  return (
    <div className="flex w-full justify-between">
      <DaBreadcrumb className="flex text-da-white da-label-regular-bold">
        <DaBreadcrumbList>{breadcrumbs}</DaBreadcrumbList>
      </DaBreadcrumb>
      {isAuthorized && pathnames.includes('prototype') && prototype?.id && (
        <DaPopup
          trigger={
            <DaButton
              variant="plain"
              className="!text-da-white !bg-transparent hover:opacity-75"
              size="sm"
            >
              <TbMessage className="w-5 h-5 mr-2" />
              Discussion
            </DaButton>
          }
        >
          <DaDiscussions
            refId={prototype?.id ?? ''}
            refType="prototype"
            className="max-h-[80vh] xl:max-h-[60vh]"
          />
        </DaPopup>
      )}
    </div>
  )
}

export default DaBreadcrumbBar
