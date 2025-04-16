import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InventorySchemaForm from './InventorySchemaForm' // Adjust path
import { createSchemaService } from '@/services/inventory.service'
import type { InventorySchemaFormData } from '@/types/inventory.type' // Adjust path
import type { SubmitHandler } from 'react-hook-form'
import DaText from '@/components/atoms/DaText'
import { toast } from 'react-toastify'

const InventorySchemaCreate: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Type the handler using SubmitHandler and SchemaFormData
  const handleCreateSchema: SubmitHandler<InventorySchemaFormData> = async (
    formData,
  ) => {
    setLoading(true)
    setError(null)
    try {
      // The API service handles parsing schema_definition string to JSON
      const newSchema = await createSchemaService(formData)
      toast.success('Schema created successfully!') // Show success message
      navigate(`/inventory/schemas/${newSchema?.id}`) // Navigate to the new schema's detail page
    } catch (err: unknown) {
      setError(
        (err as Error).message ||
          'Failed to create schema. Please check your details and try again.',
      )
      setLoading(false) // Keep loading false only if error occurs
    }
    // No finally block needed here for setLoading, as it's set in catch or navigation happens on success
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto bg-white shadow-small rounded-lg px-6 py-4">
        <div className="w-full flex justify-center">
          <DaText
            variant="title"
            className="text-2xl text-da-primary-500 font-bold mb-6 text-center"
          >
            Create New Schema
          </DaText>
        </div>
        <InventorySchemaForm
          onSubmit={handleCreateSchema}
          loading={loading}
          error={error}
          isUpdating={false}
        />
      </div>
    </div>
  )
}

export default InventorySchemaCreate
