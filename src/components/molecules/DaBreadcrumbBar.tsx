// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
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
import { rolesTypeMap } from './inventory/data'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'

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
  const { wizardPrototype } = useWizardGenAIStore()
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

  const pathnames = location.pathname.split('/').filter((x: string) => x)

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
          path: `/model/${model.id}/library`,
          name: breadcrumbNames['library'],
          key: 'library',
        })

        if (prototype && prototype.id && pathnames.includes('prototype')) {
          paths.push({
            path: `/model/${model.id}/library/prototype/${prototype.id}`,
            name: prototype.name,
            key: prototype.id,
          })
        }
      }
    }

    if (pathnames.includes('genai-wizard')) {
      // First, add the "Vehicle App Generator" breadcrumb
      paths.push({
        path: `/genai-wizard`,
        name: breadcrumbNames['genai'],
        key: 'genai',
      })

      // Then, add the wizardPrototype.modelName if available
      if (
        wizardPrototype &&
        wizardPrototype.modelName &&
        wizardPrototype.modelName.trim()
      ) {
        paths.push({
          path: `/genai-wizard`, // Adjust the path if needed
          name: wizardPrototype.modelName,
          key: 'genai-modelName',
        })
      }

      // And finally, add the wizardPrototype.name if available
      if (
        wizardPrototype &&
        wizardPrototype.name &&
        wizardPrototype.name.trim()
      ) {
        paths.push({
          path: `/genai-wizard`, // Adjust the path if needed
          name: wizardPrototype.name,
          key: 'genai-prototypeName',
        })
      }
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

      if (pathnames.includes('schema')) {
        paths.push({
          path: `/inventory/schema`,
          name: 'Schemas',
          key: 'schema',
        })

        const slug = pathnames[pathnames.indexOf('schema') + 1]
        if (slug === 'new') {
          paths.push({
            path: `/inventory/schema/new`,
            key: 'new-schema',
            name: 'New',
          })
        } else if (slug) {
          paths.push({
            path: `/inventory/schema/${slug}`,
            name: slug,
            key: slug,
          })

          if (pathnames.includes('edit')) {
            paths.push({
              path: `/inventory/schema/${slug}/edit`,
              name: 'Edit Schema',
              key: `${slug}-edit`,
            })
          }
        }
      }

      if (pathnames.includes('instance')) {
        paths.push({
          path: `/inventory/instance`,
          name: 'Instances',
          key: 'instance',
        })

        const slug = pathnames[pathnames.indexOf('instance') + 1]
        if (slug === 'new') {
          paths.push({
            path: `/inventory/instance/new`,
            key: 'new-instance',
            name: 'New',
          })
        } else if (slug) {
          paths.push({
            path: `/inventory/instance/${slug}`,
            name: slug,
            key: slug,
          })

          if (pathnames.includes('edit')) {
            paths.push({
              path: `/inventory/instance/${slug}/edit`,
              name: 'Edit Instance',
              key: `${slug}-edit`,
            })
          }
        }
      }

      if (inventoryData.roleData) {
        paths.push({
          path: `/inventory/role/${inventoryData.roleData.name}?type=${rolesTypeMap[inventoryData.roleData.name]}`,
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
  }, [location.pathname, model, prototype, inventoryData, wizardPrototype])

  return (
    <div className="flex h-[52px] w-full justify-between">
      <DaBreadcrumb className="da-label-regular-bold flex text-da-white">
        <DaBreadcrumbList>{breadcrumbs}</DaBreadcrumbList>
      </DaBreadcrumb>
    </div>
  )
}

export default DaBreadcrumbBar
