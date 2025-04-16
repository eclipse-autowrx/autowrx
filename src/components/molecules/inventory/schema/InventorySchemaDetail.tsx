// src/components/schemas/SchemaDetail.tsx
import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { deleteSchemaService } from '@/services/inventory.service'
import useGetInventorySchema from '@/hooks/useGetInventorySchema'
import { DaButton } from '@/components/atoms/DaButton'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { TbEdit, TbLoader, TbTrash } from 'react-icons/tb'
import DaText from '@/components/atoms/DaText'
import dayjs from 'dayjs'
import DaUserProfile from '../../DaUserProfile'
import DaPopup from '@/components/atoms/DaPopup'
import { toast } from 'react-toastify'
import useListInventorySchemas from '@/hooks/useListInventorySchemas'
import DaLoading from '@/components/atoms/DaLoading'

const InventorySchemaDetail: React.FC = () => {
  const { schemaId } = useParams<{ schemaId: string }>()
  const { data: self } = useSelfProfileQuery()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: schema, isLoading, error } = useGetInventorySchema(schemaId)
  const { refetch } = useListInventorySchemas({ enabled: false })

  const handleDelete = async () => {
    if (schema) {
      try {
        setLoading(true)
        await deleteSchemaService(schema.id)
        toast.success('Deleted schema successfully!')
        await refetch()
        navigate('/inventory/schemas') // Navigate back to list after delete
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to delete schema.')
        setLoading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] items-center justify-center p-4">
        <DaLoading />
      </div>
    )
  }

  // Prioritize showing error if loading failed
  if (error) {
    return (
      <div className="text-center p-4 text-red-600">Error: {error.message}</div>
    )
  }

  if (!schema) {
    // This case might be covered by the error state if API returns 404 or schemaId was invalid
    return (
      <div className="text-center p-4">Schema not found or ID is invalid.</div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
          <div className="flex-grow">
            <DaText variant="title" className="!text-da-primary-500">
              {schema.name}
            </DaText>
            <br />
            <DaText variant="small">
              {schema.description || 'No description provided.'}
            </DaText>
          </div>
          {self?.id === schema.created_by?.id && (
            <div className="flex flex-shrink-0 space-x-2">
              <Link
                to={`/inventory/schemas/${schema.id}/edit`} // Adjust route as needed
              >
                <DaButton size="sm">
                  <TbEdit size={18} className="mr-1" /> Edit
                </DaButton>
              </Link>
              {/* Add check here if only owner can delete */}
              <DaPopup
                state={[showDeleteConfirm, setShowDeleteConfirm]}
                trigger={
                  <DaButton
                    size="sm"
                    className="!text-da-destructive ml-2"
                    variant="destructive"
                  >
                    <TbTrash size={18} className="mr-1" /> Delete
                  </DaButton>
                }
              >
                <div className="w-[500px] flex flex-col gap-2 max-w-[90vw]">
                  <DaText variant="sub-title" className="text-da-primary-500">
                    Delete Schema
                  </DaText>

                  <DaText>
                    This action cannot be undone and will delete schema with all
                    associated data, including: instances, relations and
                    instance relations. Please proceed with caution.
                  </DaText>

                  <div className="mt-2 flex justify-end items-center gap-2">
                    <DaButton
                      onClick={() => setShowDeleteConfirm(false)}
                      size="sm"
                      variant="outline-nocolor"
                      disabled={loading}
                    >
                      Cancel
                    </DaButton>
                    <DaButton
                      disabled={loading}
                      onClick={handleDelete}
                      size="sm"
                    >
                      {loading && <TbLoader className="mr-1 animate-spin" />}
                      Delete
                    </DaButton>
                  </div>
                </div>
              </DaPopup>
            </div>
          )}
        </div>

        <div className="mt-6">
          <DaText variant="regular-bold">Schema Definition</DaText>
          <pre className="bg-gray-100 mt-1 p-4 rounded-md overflow-auto text-sm">
            <code>{JSON.stringify(schema.schema_definition, null, 2)}</code>
          </pre>
        </div>

        <div className="mt-6 border-t flex gap-1 flex-col pt-4 text-sm text-gray-500">
          <div className="flex gap-1 items-center">
            Created By:{' '}
            {schema.created_by ? (
              <DaUserProfile
                userName={schema.created_by.name}
                userAvatar={schema.created_by.image_file}
              />
            ) : (
              'N/A'
            )}
          </div>
          <DaText variant="small">
            Created At: {dayjs(schema.created_at).format('DD-MM-YYYY HH:mm:ss')}
          </DaText>
        </div>
      </div>
    </div>
  )
}

export default InventorySchemaDetail
