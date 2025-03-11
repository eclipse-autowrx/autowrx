import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  DaBreadcrumb,
  DaBreadcrumbItem,
  DaBreadcrumbList,
  DaBreadcrumbSeparator,
} from '@/components/atoms/DaBreadcrumb'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useCurrentInventoryData from '@/hooks/useCurrentInventoryData'

const breadcrumbNames: { [key: string]: string } = {
  home: 'Home',
  model: 'Vehicle Models',
  library: 'Prototype Library',
  prototype: 'Vehicle Prototypes',
  api: 'Vehicle API',
  architecture: 'Vehicle Architecture',
  genai: 'Vehicle App Generator',
}

const DaBreadcrumbBar = () => {
  const { data: model } = useCurrentModel()
  const { data: prototype } = useCurrentPrototype()
  const { data: inventoryData } = useCurrentInventoryData()
  const location = useLocation()
  const [breadcrumbs, setBreadcrumbs] = useState<JSX.Element[]>([])

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
          className={cn('text-da-white hover:opacity-75', isLast && 'border-b')}
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
        <Link to="/" className="text-primary flex">
          Home
        </Link>
      </DaBreadcrumbItem>,
    )

    const paths: { path: string; name: string; key: string }[] = []

    if (pathnames[0] === 'model') {
      paths.push({
        path: '/model',
        name: breadcrumbNames['model'],
        key: 'model',
      })
    }

    if (model) {
      if (model && pathnames[1] === model.id) {
        paths.push({
          path: `/model/${model.id}`,
          name: model.name,
          key: model.id,
        })
      }

      if (pathnames.includes('prototype')) {
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
    }

    if (pathnames.includes('genai-wizard')) {
      paths.push({
        path: `/genai-wizard`,
        name: breadcrumbNames['genai'],
        key: 'genai',
      })
    }

    if (pathnames.includes('privacy-policy')) {
      paths.push({
        path: `/privacy-policy`,
        name: 'Privacy Policy',
        key: 'privacy-policy',
      })
    }

    if (pathnames.includes('inventory')) {
      paths.push({
        path: `/inventory`,
        name: 'Inventory',
        key: 'inventory',
      })

      if (pathnames.includes('new')) {
        paths.push({
          path: `/inventory/new`,
          name: 'New Inventory Item',
          key: 'new',
        })
      }

      if (inventoryData.roleData) {
        paths.push({
          path: `/inventory/role/${inventoryData.roleData.name}`,
          key: inventoryData.roleData.name,
          name: inventoryData.roleData.name,
        })

        if (inventoryData.inventoryItem) {
          paths.push({
            path: `/inventory/role/${inventoryData.roleData.name}/item/${inventoryData.inventoryItem.id}`,
            name:
              inventoryData.inventoryItem.data?.name ||
              inventoryData.inventoryItem.id,
            key: inventoryData.inventoryItem.id,
          })
        }
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
    <div className="flex h-[52px] w-full justify-between">
      <DaBreadcrumb className="da-label-regular-bold flex text-da-white">
        <DaBreadcrumbList>{breadcrumbs}</DaBreadcrumbList>
      </DaBreadcrumb>
    </div>
  )
}

export default DaBreadcrumbBar
