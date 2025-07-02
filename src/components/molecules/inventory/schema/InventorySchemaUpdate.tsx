// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import InventorySchemaForm from './InventorySchemaForm' // Adjust path
import type { SubmitHandler } from 'react-hook-form'
import { InventorySchemaFormData } from '@/types/inventory.type'
import { updateSchemaService } from '@/services/inventory.service'
import useGetInventorySchema from '@/hooks/useGetInventorySchema'
import DaLoading from '@/components/atoms/DaLoading'
import DaText from '@/components/atoms/DaText'

const InventorySchemaUpdate: React.FC = () => {
  const { schemaId } = useParams<{ schemaId: string }>()
  const navigate = useNavigate()

  // Type the state
  const {
    data: initialData,
    isLoading,
    error,
    refetch,
  } = useGetInventorySchema(schemaId)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false) // For submission loading
  const [submissionError, setSubmissionError] = useState<string | null>(null) // For submission error

  // Type the handler
  const handleUpdateSchema: SubmitHandler<InventorySchemaFormData> = async (
    formData,
  ) => {
    if (!schemaId) {
      setSubmissionError('Schema ID is required for update.')
      return
    }
    setIsSubmitting(true)
    setSubmissionError(null) // Clear previous submission errors
    try {
      await updateSchemaService(schemaId, formData)
      await refetch()
      navigate(`/inventory/schema/${schemaId}`) // Navigate back to the detail page
    } catch (err: unknown) {
      setSubmissionError((err as Error).message || 'Failed to update schema.')
      setIsSubmitting(false) // Stop submitting loading indicator on error
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
  if (error && !initialData) {
    return (
      <div className="text-center p-4 text-red-600">
        Error: {error?.message || 'Error fetching schema data'}
      </div>
    )
  }

  if (!initialData && !isLoading) {
    // Handle case where loading finished but no data
    return (
      <div className="text-center p-4 text-red-600">
        Error: Schema could not be loaded or not found.{' '}
        {error?.message || 'Error fetching schema data'}
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-12">
      <div className="mx-auto bg-white shadow-small rounded-lg px-6 py-4">
        <div className="w-full flex justify-center">
          <DaText
            variant="title"
            className="text-2xl text-da-primary-500 font-bold mb-6 text-center"
          >
            Update Schema
          </DaText>
        </div>{' '}
        {/* Pass fetched data, submit handler, and loading state */}
        {initialData && (
          <InventorySchemaForm
            initialData={initialData}
            onSubmit={handleUpdateSchema}
            isUpdating={true}
            loading={isSubmitting}
            error={submissionError}
          />
        )}
      </div>
    </div>
  )
}

export default InventorySchemaUpdate
