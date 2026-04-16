// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Spinner } from '@/components/atoms/spinner'
import DaImportFile from '@/components/atoms/DaImportFile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import DaVehicleProperties from '@/components/molecules/vehicle_properties/DaVehicleProperties'
import DaContributorList from '@/components/molecules/DaContributorList'
import {
  deleteModelService,
  getComputedAPIs,
  updateModelService,
} from '@/services/model.service'
import { uploadFileService } from '@/services/upload.service'
import { convertJSONToProperty } from '@/lib/vehiclePropertyUtils'
import {
  TbDownload,
  TbEdit,
  TbFileExport,
  TbLoader,
  TbPhotoEdit,
  TbTrashX,
} from 'react-icons/tb'
import { downloadModelZip } from '@/lib/zipUtils'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { cn } from '@/lib/utils'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { listModelsLite } from '@/services/model.service'
import DaDuplicateNameHint from '@/components/atoms/DaDuplicateNameHint'
import useDuplicateNameCheck from '@/hooks/useDuplicateNameCheck'

const getCreatedById = (createdBy: any): string =>
  typeof createdBy === 'object' ? createdBy?.id ?? '' : createdBy ?? ''

interface VisibilityControlProps {
  initialVisibility: 'public' | 'private' | undefined
  onVisibilityChange: (newVisibility: 'public' | 'private') => void
  canEdit: boolean
}

const DaVisibilityControl: React.FC<VisibilityControlProps> = ({
  initialVisibility,
  onVisibilityChange,
  canEdit,
}) => {
  const [visibility, setVisibility] = useState(initialVisibility)

  useEffect(() => {
    setVisibility(initialVisibility)
  }, [initialVisibility])

  const toggleVisibility = () => {
    if (!canEdit) return
    const newVisibility = visibility === 'public' ? 'private' : 'public'
    setVisibility(newVisibility)
    onVisibilityChange(newVisibility)
  }

  return (
    <div className="flex justify-between items-center border p-2 mt-3 rounded-lg">
      <p className="text-base font-medium text-muted-foreground">
        Visibility:{' '}
        <span className="text-secondary capitalize font-medium">
          {visibility}
        </span>
      </p>
      {canEdit && (
        <Button
          onClick={toggleVisibility}
          variant="outline"
          size="sm"
          className="text-primary"
        >
          Change to {visibility === 'public' ? 'private' : 'public'}
        </Button>
      )}
    </div>
  )
}

const DaStateControl: React.FC<{
  initialState: string
  onStateChange: (value: string) => void
  canEdit: boolean
}> = ({ initialState, onStateChange, canEdit }) => {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    setState(initialState)
  }, [initialState])

  const handleUpdate = (newState: string) => async () => {
    setState(newState)
    onStateChange(newState)
  }

  return (
    <div className="flex justify-between items-center border p-2 mt-3 rounded-lg">
      <p className="text-base font-medium text-muted-foreground">
        State:{' '}
        <span
          className={cn(
            'capitalize font-medium',
            state === 'blocked' && 'text-destructive',
            state === 'released' && 'text-secondary',
          )}
        >
          {state}
        </span>
      </p>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-primary">
              Change state
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleUpdate('draft')}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUpdate('released')}>
              <span className="text-secondary">Released</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUpdate('blocked')}>
              <span className="text-destructive">Blocked</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

const PageModelDetail = () => {
  const [model] = useModelStore((state) => [state.model as Model])
  const [imageError, setImageError] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const [newName, setNewName] = useState(model?.name ?? '')
  const [nameError, setNameError] = useState('')
  const { refetch } = useCurrentModel()
  const queryClient = useQueryClient()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)

  const { data: currentUser } = useSelfProfileQuery()

  // Fetch the model list lazily — only when the user opens the rename input
  const { data: modelList } = useQuery({
    queryKey: ['listModelLite', currentUser?.id],
    queryFn: () => listModelsLite({ created_by: currentUser!.id }),
    enabled: isEditingName && !!currentUser?.id,
  })

  const ownedModelNames = useMemo(
    () =>
      modelList?.results
        ?.filter((m) => getCreatedById(m.created_by) === currentUser?.id)
        .map((m) => m.name) ?? [],
    [modelList, currentUser],
  )

  const { isDuplicate: isDuplicateName, suggestedName } = useDuplicateNameCheck(
    newName,
    ownedModelNames,
    model?.name,
  )

  const handleAvatarChange = async (file: File) => {
    if (!model || !model.id) return
    if (file) {
      try {
        setIsUploading(true)
        const { url } = await uploadFileService(file)
        await updateModelService(model.id, { model_home_image_file: url })
        await refetch()
      } catch (error) {
        console.error('Failed to update avatar:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleNameSave = async () => {
    if (!model || !model.id || !newName.trim()) return
    setNameError('')
    try {
      await updateModelService(model.id, { name: newName.trim() })
      await refetch()
      setIsEditingName(false)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setNameError(error.response.data?.message || 'A model with this name already exists')
      } else {
        console.error('Failed to update model name:', error)
      }
    }
  }

  const handleDeleteModel = async () => {
    try {
      setIsDeleting(true)
      await deleteModelService(model.id)
      addLog({
        name: `User ${currentUser?.email} deleted model '${model.name}'`,
        description: `User ${currentUser?.email} deleted model '${model.name}' with id ${model.id}`,
        type: 'delete-model',
        create_by: currentUser?.id!,
        ref_id: model.id,
        ref_type: 'model',
      })
      window.location.href = '/model'
    } catch (error) {
      console.error('Failed to delete model:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!model || !model.id) {
    return (
      <div className="h-full w-full p-4 bg-background rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={32} />
          <p className="text-base text-muted-foreground">Loading model...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background p-4 h-full rounded-md overflow-auto">
      <div className="flex h-fit pb-3">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center">
            <div className="flex flex-col items-center space-y-2">
              {isEditingName ? (
                <div className="flex flex-col gap-1">
                  <Input
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setNameError('') }}
                    className="h-8 min-w-[300px]"
                  />
                  {isDuplicateName && (
                    <DaDuplicateNameHint
                      message="A model with this name already exists"
                      suggestedName={suggestedName}
                      onApplySuggestion={(name) => { setNewName(name); setNameError('') }}
                      className="text-sm text-secondary mt-2"
                    />
                  )}
                  {nameError && !isDuplicateName && (
                    <p className="text-sm text-secondary mt-2">{nameError}</p>
                  )}
                </div>
              ) : (
                <h1 className="text2xl font-semibold text-primary w-full">
                  {model.name}
                </h1>
              )}
            </div>
          </div>
        </div>
        {isAuthorized && (
          <div className="flex gap-2">
            {!isEditingName ? (
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setNewName(model.name)
                  setIsEditingName(true)
                }}
              >
                <TbEdit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center space-x-2 mr-1 h-fit">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-16"
                  onClick={() => setIsEditingName(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="w-16"
                  onClick={handleNameSave}
                  disabled={!newName.trim() || isDuplicateName}
                >
                  Save
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex w-fit space-x-3',
                isEditingName && 'pointer-events-none opacity-50',
              )}
              onClick={async () => {
                if (!model) return
                setIsExporting(true)
                try {
                  await downloadModelZip(model)
                } catch (e) {
                  console.error(e)
                }
                setIsExporting(false)
              }}
              disabled={isDeleting || isExporting || isDownloading || isEditingName}
            >
              {isExporting ? (
                <div className="flex items-center">
                  <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                  Exporting Model...
                </div>
              ) : (
                <>
                  <TbFileExport className="w-4 h-4 mr-1" />
                  Export
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex w-fit space-x-3',
                isEditingName && 'pointer-events-none opacity-50',
              )}
              onClick={async () => {
                if (!model) return
                setIsDownloading(true)
                try {
                  const data = await getComputedAPIs(model.id)
                  const link = document.createElement('a')
                  link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 4))}`
                  link.download = `${model.name}_vss.json`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                } catch (e) {
                  console.error(e)
                } finally {
                  setIsDownloading(false)
                }
              }}
              disabled={isDeleting || isExporting || isDownloading || isEditingName}
            >
              {isDownloading ? (
                <div className="flex items-center">
                  <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                  Downloading Signal Data...
                </div>
              ) : (
                <>
                  <TbDownload className="w-4 h-4 mr-1" />
                  Download
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className={cn(
                'flex w-fit space-x-3',
                isEditingName && 'pointer-events-none opacity-50',
              )}
              onClick={() => setConfirmPopupOpen(true)}
              disabled={isDeleting || isExporting || isDownloading || isEditingName}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                  Deleting Model...
                </div>
              ) : (
                <>
                  <TbTrashX className="w-4 h-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
            <DaConfirmPopup
              onConfirm={handleDeleteModel}
              title="Delete Model"
              label="This action cannot be undone and will delete all of your model and prototypes data. Please proceed with caution."
              confirmText={model.name}
              state={[confirmPopupOpen, setConfirmPopupOpen]}
            >
              <></>
            </DaConfirmPopup>
          </div>
        )}
      </div>

      <div className="flex">
        <div className="grid gap-4 grid-cols-12 w-full overflow-auto">
          <div className="col-span-6 flex flex-col overflow-y-auto">
            <div className="flex w-full relative overflow-hidden">
              <img
                className="w-full object-cover max-h-[500px] aspect-video rounded-lg border"
                src={model.model_home_image_file}
                alt={model.name}
              />
              {isAuthorized && (
                <DaImportFile
                  onFileChange={handleAvatarChange}
                  accept=".png, .jpg, .jpeg"
                >
                  <Button
                    variant="outline"
                    className="absolute bottom-2 right-2"
                    size="sm"
                  >
                    {isUploading ? (
                      <div className="flex items-center">
                        <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                        Updating
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <TbPhotoEdit className="w-4 h-4 mr-1" />
                        Update Image
                      </div>
                    )}
                  </Button>
                </DaImportFile>
              )}
            </div>
          </div>
          <div className="col-span-6">
            <>
              <DaVehicleProperties
                key={model.id}
                category={model.vehicle_category ? model.vehicle_category : ''}
                properties={convertJSONToProperty(model.property) ?? []}
                canEdit={isAuthorized}
              />

              <DaVisibilityControl
                initialVisibility={model.visibility}
                onVisibilityChange={async (newVisibility) => {
                  await updateModelService(model.id, {
                    visibility: newVisibility,
                  })
                  await refetch()
                  await queryClient.invalidateQueries({ queryKey: ['modelsList'], refetchType: 'all' })
                }}
                canEdit={isAuthorized}
              />

              <DaStateControl
                initialState={model.state || ''}
                onStateChange={async (state) => {
                  await updateModelService(model.id, {
                    state: (state || 'draft') as Model['state'],
                  })
                  await refetch()
                  await queryClient.invalidateQueries({ queryKey: ['modelsList'], refetchType: 'all' })
                }}
                canEdit={isAuthorized}
              />

              {isAuthorized && <DaContributorList className="mt-3" canEdit={true} />}
            </>
          </div>
        </div>
      </div>

      {model && model.detail_image_file && !imageError && (
        <div className="flex justify-center items-center mt-6 pt-6 border-t">
          <img
            src={model.detail_image_file}
            className="flex h-full w-[70%]"
            onError={() => setImageError(true)}
            alt="Detail"
          />
        </div>
      )}
    </div>
  )
}

export default PageModelDetail
