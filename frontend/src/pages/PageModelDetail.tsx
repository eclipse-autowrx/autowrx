// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
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
  TbDotsVertical,
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

interface VisibilityControlProps {
  initialVisibility: 'public' | 'private' | undefined
  onVisibilityChange: (newVisibility: 'public' | 'private') => void
}

const DaVisibilityControl: React.FC<VisibilityControlProps> = ({
  initialVisibility,
  onVisibilityChange,
}) => {
  const [visibility, setVisibility] = useState(initialVisibility)

  const toggleVisibility = () => {
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
      <Button
        onClick={toggleVisibility}
        variant="outline"
        size="sm"
        className="text-primary"
      >
        Change to {visibility === 'public' ? 'private' : 'public'}
      </Button>
    </div>
  )
}

const DaStateControl: React.FC<{
  initialState: string
  onStateChange: (value: string) => void
}> = ({ initialState, onStateChange }) => {
  const [state, setState] = useState(initialState)

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
  const { refetch } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)

  const { data: currentUser } = useSelfProfileQuery()

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
    if (!model || !model.id) return
    try {
      await updateModelService(model.id, { name: newName })
      await refetch()
      setIsEditingName(false)
    } catch (error) {
      console.error('Failed to update model name:', error)
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
                <div className="flex items-center h-[36px]">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 min-w-[300px]"
                  />
                </div>
              ) : (
                <h1 className="text-3xl font-semibold text-primary w-full">
                  {model.name}
                </h1>
              )}
            </div>
          </div>
        </div>
        {isAuthorized && (
          <div className="flex">
            {!isEditingName ? (
              <Button
                variant="ghost"
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
              <div className="flex items-center space-x-2 mr-2">
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
                >
                  Save
                </Button>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex w-full space-x-3 pt-1',
                    isEditingName && 'pointer-events-none opacity-50',
                  )}
                >
                  {!isDeleting && !isExporting && !isDownloading && (
                    <>
                      <TbDotsVertical className="size-4" />
                    </>
                  )}
                  {isDeleting && (
                    <div className="flex items-center">
                      <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                      Deleting Model...
                    </div>
                  )}
                  {isExporting && (
                    <div className="flex items-center">
                      <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                      Exporting Model...
                    </div>
                  )}
                  {isDownloading && (
                    <div className="flex items-center">
                      <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                      Downloading Signal Data...
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
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
                >
                  <TbFileExport className="w-4 h-4 mr-2" />
                  Export Model
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!model) return
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
                >
                  <TbDownload className="w-4 h-4 mr-2" />
                  Download Vehicle API JSON file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmPopupOpen(true)}>
                  <TbTrashX className="w-4 h-4 mr-2" />
                  Delete Model
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                        <TbLoader className="w-4 h-4 mr-2 animate-spin" />
                        Updating
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <TbPhotoEdit className="w-4 h-4 mr-2" />
                        Update Image
                      </div>
                    )}
                  </Button>
                </DaImportFile>
              )}
            </div>
          </div>
          <div className="col-span-6">
            {isAuthorized && (
              <>
                <DaVehicleProperties
                  key={model.id}
                  category={
                    model.vehicle_category ? model.vehicle_category : ''
                  }
                  properties={convertJSONToProperty(model.property) ?? []}
                />

                <DaVisibilityControl
                  initialVisibility={model.visibility}
                  onVisibilityChange={(newVisibility) => {
                    updateModelService(model.id, {
                      visibility: newVisibility,
                    })
                  }}
                />

                <DaStateControl
                  initialState={model.state || ''}
                  onStateChange={async (state) => {
                    await updateModelService(model.id, {
                      state: (state || 'draft') as Model['state'],
                    })
                    await refetch()
                  }}
                />

                <DaContributorList className="mt-3" />
              </>
            )}
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
