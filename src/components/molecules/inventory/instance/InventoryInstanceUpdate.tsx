// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import DaText from '@/components/atoms/DaText'
import InventoryInstanceForm from './InventoryInstanceForm'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { updateInventoryInstanceService } from '@/services/inventory.service'
import { InventoryInstanceFormData } from '@/types/inventory.type'
import useGetInventoryInstance from '@/hooks/useGetInventoryInstance'
import DaLoading from '@/components/atoms/DaLoading'

const InventoryInstanceUpdate = () => {
  const { instanceId } = useParams<{ instanceId: string }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    data: initialData,
    isLoading,
    error: fetchingInstanceError,
    refetch,
  } = useGetInventoryInstance(instanceId)

  const handleUpdateInstance = async (
    _: string,
    data: InventoryInstanceFormData,
  ) => {
    if (!instanceId) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      // The data is already validated by RJSF based on the schema
      await updateInventoryInstanceService(instanceId, data)
      await refetch()
      toast.success(`Instance updated successfully!`)
      navigate(`/inventory/instance/${instanceId}`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update instance.')
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] items-center justify-center p-4">
        <DaLoading />
      </div>
    )
  }

  // Show fetch error prominently only if data couldn't load
  if (fetchingInstanceError) {
    return (
      <div className="text-center p-4 text-red-600">
        Error: {fetchingInstanceError?.message || 'Error fetching schema data'}
      </div>
    )
  }

  if (!initialData) {
    // Handle case where loading finished but no data
    return (
      <div className="text-center p-4 text-red-600">
        Error: Schema could not be loaded or not found.{' '}
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-12">
      <div className="rounded-lg shadow-small px-6 py-4 bg-white mx-auto">
        <div className="w-full flex justify-center">
          <DaText
            variant="title"
            className="text-2xl text-da-primary-500 font-bold mb-6 text-center"
          >
            Update Instance
          </DaText>
        </div>
        <InventoryInstanceForm
          isUpdating
          onCancel={() => navigate(`/inventory/instance/${instanceId}`)}
          onSubmit={handleUpdateInstance}
          error={error}
          loading={loading}
          initialData={initialData}
          initialSchemaId={initialData?.schema?.id}
        />
      </div>
    </div>
  )
}

export default InventoryInstanceUpdate
