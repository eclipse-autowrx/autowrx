// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaAvatar } from '@/components/atoms/DaAvatar'
import { DaButton } from '@/components/atoms/DaButton'
import DaText from '@/components/atoms/DaText'
import { InventoryInstanceDetail as InventoryInstanceDetailType } from '@/types/inventory.type'
import dayjs from 'dayjs'
import { useState } from 'react'
import { TbEdit, TbEye, TbEyeOff, TbLoader, TbTrash } from 'react-icons/tb'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useGetInventoryInstance from '@/hooks/useGetInventoryInstance'
import DaLoading from '@/components/atoms/DaLoading'
import DaPopup from '@/components/atoms/DaPopup'
import { toast } from 'react-toastify'
import useListInventoryInstances from '@/hooks/useListInventoryInstances'
import { deleteInventoryInstanceService } from '@/services/inventory.service'

const InventoryInstanceDetail = () => {
  const { instanceId } = useParams<{ instanceId: string }>()
  const {
    data: inventoryInstance,
    isLoading,
    error: fetchingInstanceError,
  } = useGetInventoryInstance(instanceId)
  const { refetch } = useListInventoryInstances({ enabled: false })
  const navigate = useNavigate()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] items-center justify-center p-4">
        <DaLoading />
      </div>
    )
  }

  // Prioritize showing error if loading failed
  if (fetchingInstanceError) {
    return (
      <div className="text-center p-4 text-red-600">
        Error: {fetchingInstanceError.message}
      </div>
    )
  }

  if (!inventoryInstance) {
    // This case might be covered by the error state if API returns 404 or schemaId was invalid
    return (
      <div className="text-center p-4">
        Instance not found or instance ID is invalid
      </div>
    )
  }

  const handleDelete = async () => {
    if (instanceId) {
      try {
        setLoading(true)
        await deleteInventoryInstanceService(instanceId)
        await refetch()
        toast.success('Deleted instance successfully!')
        navigate('/inventory/instance')
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to delete instance.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="container text-sm pb-10 text-da-gray-dark">
      {/* Header */}
      <div className="mt-5 flex md:flex-row flex-col gap-2 items-end py-3">
        <div className="flex flex-col gap-2 mr-10">
          <DaText variant="title" className="!block text-da-primary-500">
            {inventoryInstance.name || '-'}
          </DaText>
          <div className="rounded-full w-fit bg-da-gray-darkest text-white px-2 py-1">
            <span>{inventoryInstance.schema.name}</span>
          </div>
        </div>

        <div className="flex gap-2 items-end ml-auto">
          <Link to={`/inventory/instance/${instanceId}/edit`}>
            <DaButton size="sm" variant="plain" className="!text-da-gray-dark">
              <TbEdit className="w-4 h-4 mr-1" />
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
                Delete Instance
              </DaText>

              <DaText variant="small">
                This action cannot be undone and will delete instance with all
                associated data, including instance relations. Please proceed
                with caution.
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
                <DaButton disabled={loading} onClick={handleDelete} size="sm">
                  {loading && <TbLoader className="mr-1 animate-spin" />}
                  Delete
                </DaButton>
              </div>
            </div>
          </DaPopup>
        </div>
      </div>

      <div className="border-t border-t-da-gray-light/50 mb-6" />

      <Detail instanceData={inventoryInstance} />
    </div>
  )
}

const Detail = ({
  instanceData,
}: {
  instanceData: InventoryInstanceDetailType
}) => {
  const [showDetail, setShowDetail] = useState(false)

  const titleCase = (str: string) => {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const camelToTitleCase = (str: string) => {
    return titleCase(str.replace(/([A-Z])/g, ' $1').toLowerCase())
  }

  const snakeToTitleCase = (str: string) => {
    return titleCase(str.replace(/_/g, ' '))
  }

  const otherToTitleCase = (str: string) => {
    return snakeToTitleCase(camelToTitleCase(str))
  }

  return (
    <div className="flex gap-20 lg:flex-row flex-col">
      <div className="flex-1 min-w-0">
        <DaText variant="regular-bold" className="text-da-gray-darkest">
          Detail
        </DaText>

        <div className="flex md:flex-row flex-col gap-4 justify-between pt-5">
          {/* Render detail data */}
          <div className="flex flex-col gap-4 min-w-0 flex-1">
            {Object.entries(instanceData.data).map(([key, value]) => (
              <div key={key} className="flex">
                <DaText
                  variant="small"
                  className="inline-block text-da-gray-dark w-[240px]"
                >
                  {otherToTitleCase(key)}
                </DaText>
                {['string', 'number'].includes(typeof value) ? (
                  <DaText variant="small" className="text-da-gray-darkest ml-2">
                    {value}
                  </DaText>
                ) : (
                  <pre>{JSON.stringify(value, null, 4)}</pre>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-t-da-gray-light/50 my-6" />
        <DaText variant="regular-bold" className="text-da-gray-darkest">
          Metadata
        </DaText>

        <div className="flex md:flex-row flex-col gap-4 justify-between pt-5">
          <div className="flex flex-col gap-4 min-w-0 flex-1">
            <div>
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[240px]"
              >
                Created At
              </DaText>
              <DaText variant="small" className="text-da-gray-darkest ml-2">
                {dayjs(instanceData?.created_at).format(
                  'DD.MM.YYYY - HH:mm:ss',
                )}
              </DaText>
            </div>

            <div className="flex items-center -mt-0.5">
              <DaText
                variant="small"
                className="inline-block text-da-gray-dark w-[240px]"
              >
                Owner
              </DaText>
              <button className="flex cursor-pointer items-center hover:underline gap-2 ml-2">
                <DaAvatar
                  className="h-7 w-7"
                  src={instanceData.created_by?.image_file}
                />
                <p className="text-sm text-da-gray-darkest">
                  {instanceData.created_by?.name}
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-t-da-gray-light/50 my-6" />
        <DaText variant="regular-bold" className="text-da-gray-darkest">
          Inventory Schema
        </DaText>
        <div className="flex flex-col items-start pt-5 gap-4">
          <div className="flex items-center h-[20px]">
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[240px]"
            >
              Name
            </DaText>
            <DaText variant="small" className="text-da-gray-darkest ml-2">
              {instanceData.schema?.name || '-'}
            </DaText>
          </div>

          <div>
            <DaText
              variant="small"
              className="inline-block text-da-gray-dark w-[240px]"
            >
              Description
            </DaText>
            <DaText variant="small" className="text-da-gray-darkest ml-2">
              {instanceData.schema?.description || '-'}
            </DaText>
          </div>

          <div className="w-full">
            <DaButton
              onClick={() => setShowDetail((prev) => !prev)}
              size="sm"
              variant="text"
              className="!px-0 m-0"
            >
              {showDetail ? (
                <TbEyeOff className="h-4 w-4 mr-1" />
              ) : (
                <TbEye className="w-4 h-4 mr-1" />
              )}{' '}
              {showDetail ? 'Hide' : 'Show'} Detail Schema
            </DaButton>
            {showDetail && (
              <div className="border mt-1 rounded-md p-4 w-full">
                <pre>
                  {JSON.stringify(
                    instanceData.schema?.schema_definition || {},
                    null,
                    4,
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryInstanceDetail
