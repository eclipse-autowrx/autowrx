// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Prototype } from '../../types/model.type'
import { DaImage } from '../atoms/DaImage'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import { Textarea } from '../atoms/textarea'
import { Label } from '../atoms/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../atoms/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../atoms/dropdown-menu'
import { DaTableProperty } from '../molecules/DaTableProperty'
import DaImportFile from '../atoms/DaImportFile'
import DaConfirmPopup from '../molecules/DaConfirmPopup'
import {
  TbDotsVertical,
  TbDownload,
  TbEdit,
  TbLoader,
  TbPhotoEdit,
  TbStar,
  TbStarFilled,
  TbTrashX,
} from 'react-icons/tb'
import { updatePrototypeService, deletePrototypeService } from '@/services/prototype.service'
import { uploadFileService } from '@/services/upload.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { useNavigate } from 'react-router-dom'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { cn } from '@/lib/utils'
import { downloadPrototypeZip } from '@/lib/zipUtils'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { toast } from 'react-toastify'
import { isAxiosError } from 'axios'

interface PrototypeTabInfoProps {
  prototype: Prototype
}

const complexityLevels = ['Lowest', 'Low', 'Medium', 'High', 'Highest']
const statusOptions = ['development', 'Released']

const PrototypeTabInfo: React.FC<PrototypeTabInfoProps> = ({
  prototype,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [localPrototype, setLocalPrototype] = useState(prototype)
  const { data: model } = useCurrentModel()
  const { refetch: refetchModelPrototypes } = useListModelPrototypes(
    model?.id || '',
  )
  const { refetch: refetchCurrentPrototype } = useCurrentPrototype()
  const navigate = useNavigate()
  const [isAuthorized, isAdmin] = usePermissionHook(
    [PERMISSIONS.READ_MODEL, model?.id],
    [PERMISSIONS.MANAGE_USERS],
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)
  const { data: currentUser } = useSelfProfileQuery()

  useEffect(() => {
    setLocalPrototype(prototype)
  }, [prototype])

  if (!prototype) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No prototype available</p>
      </div>
    )
  }

  const handleSave = async () => {
    if (!localPrototype) return
    setIsEditing(false)
    setIsSaving(true)
    const updateData = {
      name: localPrototype.name,
      description: {
        problem: localPrototype.description?.problem || '',
        says_who: localPrototype.description?.says_who || '',
        solution: localPrototype.description?.solution || '',
      },
      complexity_level: localPrototype.complexity_level,
      tags: localPrototype.tags,
      customer_journey: localPrototype.customer_journey,
      image_file: localPrototype.image_file,
      state: localPrototype.state,
    }
    try {
      await updatePrototypeService(prototype.id, updateData)
      await refetchModelPrototypes()
      if (currentUser) {
        await addLog({
          name: `User ${currentUser.email} updated prototype ${localPrototype.name}`,
          description: `User ${currentUser.email} updated Prototype ${localPrototype.name} with id ${localPrototype?.id} of model ${localPrototype.model_id}`,
          type: 'update-prototype',
          create_by: currentUser.id,
          parent_id: localPrototype.model_id,
          ref_id: localPrototype.id,
          ref_type: 'prototype',
        })
      }
      await refetchCurrentPrototype()
    } catch (error) {
      console.error('Error updating prototype:', error)
      toast.error('Failed to update prototype')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalPrototype(prototype)
    setIsEditing(false)
  }

  const handleChange = (field: keyof Prototype, value: any) => {
    setLocalPrototype((prevPrototype) => {
      if (!prevPrototype) return prevPrototype
      return {
        ...prevPrototype,
        [field]: value,
      }
    })
  }

  const handleDescriptionChange = (
    field: keyof Prototype['description'],
    value: any,
  ) => {
    setLocalPrototype((prevPrototype) => {
      if (!prevPrototype) return prevPrototype
      return {
        ...prevPrototype,
        description: {
          ...prevPrototype.description,
          [field]: value,
        },
      }
    })
  }

  const handlePrototypeImageChange = async (file: File) => {
    try {
      setIsUploading(true)
      const { url } = await uploadFileService(file)
      setLocalPrototype((prevPrototype) => {
        if (!prevPrototype) return prevPrototype
        return {
          ...prevPrototype,
          image_file: url,
        }
      })
      await updatePrototypeService(prototype.id, { image_file: url })
    } catch (error) {
      console.error('Failed to update prototype image:', error)
      toast.error('Failed to update prototype image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePrototype = async () => {
    try {
      setIsDeleting(true)
      await deletePrototypeService(prototype.id)
      await refetchModelPrototypes()
      navigate(`/model/${model?.id}/library`)
    } catch (error) {
      console.error('Failed to delete prototype:', error)
      toast.error('Failed to delete prototype')
    } finally {
      setIsDeleting(false)
    }
  }

  const updateEditorChoice = async () => {
    try {
      await updatePrototypeService(prototype.id, {
        editors_choice: !prototype?.editors_choice,
      })
      refetchCurrentPrototype()
    } catch (error) {
      console.log(error)
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data.message || 'Failed to update editor choice',
        )
        return
      }
      toast.error('Failed to update editor choice')
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col h-full w-full bg-background rounded-lg overflow-y-auto">
        <div className="flex flex-col h-full w-full pt-6 bg-background px-2">
          <div className="flex mr-4 mb-3 justify-between items-center">
            {isEditing ? (
              <>
                <h2 className="text-lg font-semibold text-primary">
                  Editing Prototype
                </h2>
                <div className="flex space-x-2 mr-2">
                  <Button variant="outline" onClick={handleCancel} size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center w-full">
                <h2 className="text-lg font-semibold text-primary">
                  {localPrototype.name}
                </h2>
                <div className="grow" />
                {isAuthorized && (
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        onClick={updateEditorChoice}
                        variant="ghost"
                        size="sm"
                        title={`${prototype?.editors_choice ? 'Unmark' : 'Mark'} as Editor Choice`}
                      >
                        {prototype?.editors_choice ? (
                          <TbStarFilled className="w-4 h-4" />
                        ) : (
                          <TbStar className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      size="sm"
                    >
                      <TbEdit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            isEditing && 'pointer-events-none opacity-50',
                          )}
                        >
                          {!isDeleting && !isEditing && !isSaving && (
                            <TbDotsVertical className="size-4" />
                          )}
                          {isSaving && (
                            <div className="flex items-center">
                              <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                              Saving...
                            </div>
                          )}
                          {isDeleting && (
                            <div className="flex items-center">
                              <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                              Deleting...
                            </div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => downloadPrototypeZip(prototype)}
                        >
                          <TbDownload className="w-4 h-4 mr-2" />
                          Export Prototype
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setConfirmPopupOpen(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <TbTrashX className="w-4 h-4 mr-2" />
                          Delete Prototype
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DaConfirmPopup
                      onConfirm={handleDeletePrototype}
                      title="Delete Prototype"
                      label="This action cannot be undone and will delete all prototypes data. Please proceed with caution."
                      confirmText={prototype.name}
                      state={[confirmPopupOpen, setConfirmPopupOpen]}
                    >
                      <></>
                    </DaConfirmPopup>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex w-full">
            <div className="flex-1 h-fit relative">
              <DaImage
                src={
                  localPrototype.image_file
                    ? localPrototype.image_file
                    : '/imgs/default_prototype_cover.jpg'
                }
                className="w-full object-cover max-h-[400px] aspect-video rounded-xl border shadow"
                alt={localPrototype.name}
              />
              {isAuthorized && (
                <DaImportFile
                  onFileChange={handlePrototypeImageChange}
                  accept=".png, .jpg, .jpeg, .gif, .webp"
                >
                  <Button
                    variant="outline"
                    className="absolute bottom-2 right-2"
                    size="sm"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center">
                        <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                        Uploading Image...
                      </div>
                    ) : (
                      <>
                        <TbPhotoEdit className="w-4 h-4 mr-1" /> Update Image
                      </>
                    )}
                  </Button>
                </DaImportFile>
              )}
            </div>
            <div className="flex flex-1 h-full px-4 ml-4">
              {isEditing ? (
                <div className="flex flex-col w-full gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="prototype-name">Prototype Name</Label>
                    <Input
                      id="prototype-name"
                      value={localPrototype.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="problem">Problem</Label>
                    <Input
                      id="problem"
                      value={localPrototype.description?.problem || ''}
                      onChange={(e) =>
                        handleDescriptionChange('problem', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="says-who">Says who?</Label>
                    <Input
                      id="says-who"
                      value={localPrototype.description?.says_who || ''}
                      onChange={(e) =>
                        handleDescriptionChange('says_who', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="solution">Solution</Label>
                    <Textarea
                      id="solution"
                      value={localPrototype.description?.solution || ''}
                      onChange={(e) =>
                        handleDescriptionChange('solution', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-[150px]">Complexity</Label>
                    <Select
                      value={
                        complexityLevels[
                          (Number(localPrototype.complexity_level) || 3) - 1
                        ]
                      }
                      onValueChange={(value) =>
                        handleChange(
                          'complexity_level',
                          complexityLevels.indexOf(value) + 1,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {complexityLevels.map((level, index) => (
                          <SelectItem key={index} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="w-[150px]">Status</Label>
                    <Select
                      value={localPrototype.state || 'development'}
                      onValueChange={(value) => handleChange('state', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Developing</SelectItem>
                        <SelectItem value="Released">Released</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <DaTableProperty
                  properties={[
                    {
                      name: 'Problem',
                      value: prototype.description?.problem || '',
                    },
                    {
                      name: 'Says who?',
                      value: prototype.description?.says_who || '',
                    },
                    {
                      name: 'Solution',
                      value: prototype.description?.solution || '',
                    },
                    {
                      name: 'Complexity',
                      value:
                        complexityLevels[
                          (Number(prototype.complexity_level) || 3) - 1
                        ],
                    },
                    {
                      name: 'Status',
                      value:
                        prototype.state === 'Released'
                          ? 'Released'
                          : 'Developing',
                    },
                  ]}
                  className=""
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabInfo
