// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Link } from 'react-router-dom'
import useListInventorySchemas from '@/hooks/useListInventorySchemas'
import { DaButton } from '@/components/atoms/DaButton'
import { TbCirclePlus, TbEdit, TbEye, TbLoader, TbTrash } from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useState } from 'react'
import { deleteSchemaService } from '@/services/inventory.service'
import { toast } from 'react-toastify'
import DaPopup from '@/components/atoms/DaPopup'
import DaText from '@/components/atoms/DaText'
import DaLoading from '@/components/atoms/DaLoading'
import { InventorySchema } from '@/types/inventory.type'

function InventorySchemaList() {
  const { data: self } = useSelfProfileQuery()
  const { data, isLoading, error, refetch } = useListInventorySchemas()
  const schemas = data?.results || []

  const [loading, setLoading] = useState(false)

  const handleDelete = async (schemaId: string) => {
    try {
      setLoading(true)
      await deleteSchemaService(schemaId)
      await refetch()
      toast.success('Deleted schema successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete schema.')
    } finally {
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

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        Error: {error.message || 'Failed to fetch inventory schema list'}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold da-txt-medium text-da-gray-dark">Schemas</h1>
        <Link to="/inventory/schema/new">
          <DaButton size="sm">
            <TbCirclePlus className="mr-1" /> Create New Schema
          </DaButton>
        </Link>
      </div>

      {schemas.length === 0 ? (
        <p>No schemas found.</p>
      ) : (
        <div className="overflow-x-auto shadow-small rounded-lg">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 border-b-2 da-txt-small text-da-gray-dark text-left border-da-gray-light tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 da-txt-small text-da-gray-dark text-left border-da-gray-light tracking-wider">
                  Description
                </th>
                <th className="w-[200px] pl-7 pr-5 py-3 border-b-2 da-txt-small text-da-gray-dark text-left border-da-gray-light tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {schemas.map((schema) => (
                <SchemaItem
                  currentUserId={self?.id}
                  schema={schema}
                  key={schema.id}
                  onDelete={handleDelete}
                  loading={loading}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type SchemaItemProps = {
  schema: InventorySchema
  currentUserId?: string
  onDelete: (schemaId: string) => void
  loading: boolean
}

function SchemaItem({
  schema,
  currentUserId,
  onDelete,
  loading,
}: SchemaItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <tr key={schema.id} className="hover:bg-da-gray-light">
      <td className="px-5 py-2 border-b border-da-gray-light bg-white text-sm">
        <Link
          to={`/inventory/schema/${schema.id}`}
          className="text-da-primary-500 hover:underline"
        >
          {schema.name}
        </Link>
      </td>
      <td className="px-5 py-2 border-b border-da-gray-light bg-white text-sm">
        {schema.description || '-'}
      </td>
      <td className="px-5 py-2 border-b border-da-gray-light bg-white text-sm whitespace-nowrap">
        <Link
          to={`/inventory/schema/${schema.id}`}
          className="text-gray-600 hover:text-gray-900"
          title="View Details"
        >
          <DaButton size="sm" variant="plain">
            <TbEye className="mr-1" size={16} />
            View
          </DaButton>
        </Link>

        {currentUserId === schema.created_by?.id && (
          <>
            <Link
              to={`/inventory/schema/${schema.id}/edit`}
              className="text-indigo-600 hover:text-indigo-900"
              title="Edit Schema"
            >
              <DaButton size="sm" variant="plain">
                <TbEdit className="mr-1" size={16} />
                Edit
              </DaButton>
            </Link>

            <DaPopup
              state={[showDeleteConfirm, setShowDeleteConfirm]}
              trigger={
                <DaButton
                  size="sm"
                  className="!text-da-destructive"
                  variant="destructive"
                >
                  <TbTrash size={18} className="mr-1" /> Delete
                </DaButton>
              }
            >
              <div className="w-[500px] flex flex-col gap-2 max-w-[90vw]">
                <DaText variant="sub-title" className="text-da-primary-500">
                  Delete Schema "{schema.name}"
                </DaText>

                <DaText variant="small">
                  This action cannot be undone and will delete schema "
                  {schema.name}" with all associated data, including: instances,
                  relations and instance relations. Please proceed with caution.
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
                    onClick={() => onDelete(schema.id)}
                    size="sm"
                  >
                    {loading && <TbLoader className="mr-1 animate-spin" />}
                    Delete
                  </DaButton>
                </div>
              </div>
            </DaPopup>
          </>
        )}
      </td>
    </tr>
  )
}

export default InventorySchemaList
