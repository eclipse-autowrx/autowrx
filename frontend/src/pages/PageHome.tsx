// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { configManagementService } from '@/services/configManagement.service'
import { Spinner } from '@/components/atoms/spinner'
import DaDialog from '@/components/molecules/DaDialog'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
import { getHomeComponent } from '@/utils/homeComponentMap'

const PageHome = () => {
  const [homeElements, setHomeElements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const createModelParam = searchParams.get('create-model')
  const [openCreateModelDialog, setOpenCreateModelDialog] = useState(false)

  useEffect(() => {
    if (createModelParam !== null) {
      setOpenCreateModelDialog(true)
    }
  }, [createModelParam])

  useEffect(() => {
    const loadHomeConfig = async () => {
      try {
        setIsLoading(true)
        // Use public endpoint - no authentication required
        const res = await configManagementService.getPublicConfig('CFG_HOME_CONTENT', 'site')

        // Backend returns { key: string, value: any }
        if (res.value && Array.isArray(res.value)) {
          setHomeElements(res.value)
        }
      } catch (err) {
        console.error('Failed to load home config:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadHomeConfig()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {homeElements.map((element, index) => {
        const Component = getHomeComponent(element.type) as any
        if (!Component) return null
        return <Component key={index} {...element} />
      })}

      <DaDialog
        open={openCreateModelDialog}
        onOpenChange={(v) => {
          setOpenCreateModelDialog(v)
          if (!v) {
            searchParams.delete('create-model')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        className="w-115 max-w-[calc(100vw-40px)]"
        dialogTitle="Create New Model"
      >
        <FormCreateModel />
      </DaDialog>
    </div>
  )
}

export default PageHome
