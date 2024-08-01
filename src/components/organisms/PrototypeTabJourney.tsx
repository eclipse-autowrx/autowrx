import React, { useState } from 'react'
import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { DaTag } from '../atoms/DaTag'
import { DaButton } from '../atoms/DaButton'
import { DaInput } from '../atoms/DaInput'
import { DaSelect, DaSelectItem } from '../atoms/DaSelect'
import { Prototype } from '@/types/model.type'
import { DaTableProperty } from '../molecules/DaTableProperty'
import {
  updatePrototypeService,
  deletePrototypeService,
} from '@/services/prototype.service'
import {
  TbDotsVertical,
  TbDownload,
  TbEdit,
  TbLoader,
  TbPhotoEdit,
  TbTrashX,
} from 'react-icons/tb'
import DaTableEditor from '../molecules/DaCustomerJourneyTable'
import DaImportFile from '../atoms/DaImportFile'
import DaConfirmPopup from '../molecules/DaConfirmPopup'
import { uploadFileService } from '@/services/upload.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { useNavigate } from 'react-router-dom'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaMenu from '../atoms/DaMenu'
import { cn } from '@/lib/utils'
import { DaTextarea } from '../atoms/DaTextarea'
import { downloadPrototypeZip } from '@/lib/zipUtils'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

interface PrototypeTabJourneyProps {
  prototype: Prototype
}

const complexityLevels = ['Lowest', 'Low', 'Medium', 'High', 'Highest']
const statusOptions = ['Developing', 'Released']

const PrototypeTabJourney: React.FC<PrototypeTabJourneyProps> = ({
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
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)

  const { data: currentUser } = useSelfProfileQuery()

  if (!prototype) {
    return <DaText>No prototype available</DaText>
  }

  const handleSave = async () => {
    if (!localPrototype) return

    const updateData = {
      name: localPrototype.name,
      description: {
        problem: localPrototype.description.problem,
        says_who: localPrototype.description.says_who,
        solution: localPrototype.description.solution,
      },
      complexity_level: localPrototype.complexity_level,
      tags: localPrototype.tags,
      customer_journey: localPrototype.customer_journey,
      image_file: localPrototype.image_file,
      state: localPrototype.state,
    }
    try {
      await updatePrototypeService(prototype.id, updateData)
      await refetchCurrentPrototype()
      await refetchModelPrototypes()
      addLog({
        name: `User ${currentUser?.email} updated prototype ${localPrototype.name}`,
        description: `User ${currentUser?.email} updated Prototype ${localPrototype.name} with id ${localPrototype?.id} of model ${localPrototype.model_id}`,
        type: 'update-prototype',
        create_by: currentUser?.id!,
        parent_id: localPrototype.model_id,
        ref_id: localPrototype.id,
        ref_type: 'prototype',
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating prototype:', error)
      setIsEditing(false)
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
      // console.log('Prototype image url: ', url)
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
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex">
        <div className="flex-1 h-fit relative">
          <DaImage
            src={
              localPrototype.image_file
                ? localPrototype.image_file
                : 'https://placehold.co/600x400'
            }
            className="w-full object-cover max-h-[400px]"
          />
          {isAuthorized && (
            <DaImportFile
              onFileChange={handlePrototypeImageChange}
              accept=".png, .jpg, .jpeg, .gif, .webp"
            >
              <DaButton
                variant="outline-nocolor"
                className="absolute bottom-2 right-2"
                size="sm"
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
              </DaButton>
            </DaImportFile>
          )}
        </div>
        <div className="flex-1 p-4 ml-4">
          <div className="flex mb-4 justify-between items-center">
            {isEditing ? (
              <>
                <DaText variant="title" className="text-da-primary-500">
                  Editing Prototype
                </DaText>
                <div className="flex space-x-2">
                  <DaButton
                    variant="outline-nocolor"
                    onClick={handleCancel}
                    className="text-da-white px-4 py-2 rounded"
                    size="sm"
                  >
                    Cancel
                  </DaButton>
                  <DaButton
                    onClick={handleSave}
                    className=" text-white px-4 py-2 rounded"
                    size="sm"
                  >
                    Save
                  </DaButton>
                </div>
              </>
            ) : (
              <>
                <DaText variant="title" className="text-da-primary-500">
                  {localPrototype.name}
                </DaText>
                {isAuthorized && (
                  <>
                    <DaMenu
                      trigger={
                        <DaButton
                          variant="solid"
                          size="sm"
                          className={cn(
                            'flex w-full',
                            isEditing && '!pointer-events-none opacity-50',
                          )}
                        >
                          {!isDeleting && !isEditing && (
                            <>
                              <TbDotsVertical className="w-4 h-4 mr-1" />{' '}
                              Prototype Action
                            </>
                          )}
                          {isDeleting && (
                            <div className="flex items-center">
                              <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                              Deleting Model...
                            </div>
                          )}
                        </DaButton>
                      }
                    >
                      <div className="flex flex-col px-1">
                        <DaButton
                          onClick={() => setIsEditing(true)}
                          className="!justify-start"
                          variant="plain"
                          size="sm"
                        >
                          <TbEdit className="w-4 h-4 mr-2" /> Edit Prototype
                        </DaButton>
                        <DaButton
                          variant="plain"
                          size="sm"
                          className="!justify-start"
                          onClick={() => downloadPrototypeZip(prototype)}
                        >
                          <TbDownload className="w-4 h-4 mr-2" />
                          Export Prototype{' '}
                        </DaButton>
                        <DaButton
                          variant="destructive"
                          size="sm"
                          className="!justify-start"
                          onClick={() => setConfirmPopupOpen(true)}
                        >
                          <TbTrashX className="w-4 h-4 mr-2" />
                          Delete Prototype
                        </DaButton>
                      </div>
                    </DaMenu>
                    <DaConfirmPopup
                      onConfirm={handleDeletePrototype}
                      label="This action cannot be undone and will delete all prototypes data. Please proceed with caution."
                      confirmText={prototype.name}
                      state={[confirmPopupOpen, setConfirmPopupOpen]}
                    >
                      <></>
                    </DaConfirmPopup>
                  </>
                )}
              </>
            )}
          </div>
          {isEditing ? (
            <div>
              <div className="flex items-center mb-4">
                <DaText className="w-1/4" variant="regular-bold">
                  Prototype Name
                </DaText>
                <DaInput
                  value={localPrototype.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-3/4"
                />
              </div>
              <div className="flex items-center mb-4">
                <DaText className="w-1/4" variant="regular-bold">
                  Problem
                </DaText>
                <DaInput
                  value={localPrototype.description.problem}
                  onChange={(e) =>
                    handleDescriptionChange('problem', e.target.value)
                  }
                  className="w-3/4"
                />
              </div>
              <div className="flex items-center mb-4">
                <DaText className="w-1/4 " variant="regular-bold">
                  Says who?
                </DaText>
                <DaInput
                  value={localPrototype.description.says_who}
                  onChange={(e) =>
                    handleDescriptionChange('says_who', e.target.value)
                  }
                  className="w-3/4"
                />
              </div>
              <div className="flex items-center mb-4">
                <DaText className="w-1/4 " variant="regular-bold">
                  Solution
                </DaText>
                <DaTextarea
                  value={localPrototype.description.solution}
                  onChange={(e) =>
                    handleDescriptionChange('solution', e.target.value)
                  }
                  className="w-3/4"
                />
              </div>
              <div className="flex items-center mb-4">
                <DaText className="w-1/4 " variant="regular-bold">
                  Complexity
                </DaText>
                <DaSelect
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
                  className="w-3/4"
                >
                  {complexityLevels.map((level, index) => (
                    <DaSelectItem key={index} value={level}>
                      {level}
                    </DaSelectItem>
                  ))}
                </DaSelect>
              </div>
              <div className="flex items-center mb-4">
                <DaText className="w-1/4 " variant="regular-bold">
                  Status
                </DaText>
                <DaSelect
                  value={
                    localPrototype.state === 'Released' ||
                    localPrototype.state === 'Developing'
                      ? localPrototype.state
                      : 'Developing'
                  }
                  onValueChange={(value) => {
                    console.log('value', value)
                    handleChange('state', value)
                  }}
                  className="w-3/4"
                >
                  {statusOptions.map((status, index) => (
                    <DaSelectItem key={index} value={status}>
                      {status}
                    </DaSelectItem>
                  ))}
                </DaSelect>
              </div>
            </div>
          ) : (
            <>
              <DaTableProperty
                properties={[
                  {
                    name: 'Problem',
                    value: prototype.description.problem,
                  },
                  {
                    name: 'Says who?',
                    value: prototype.description.says_who,
                  },
                  {
                    name: 'Solution',
                    value: prototype.description.solution,
                  },
                  {
                    name: 'Status',
                    value:
                      prototype.state === 'Released' ||
                      prototype.state === 'Developing'
                        ? prototype.state
                        : 'Developing',
                  },
                  {
                    name: 'Complexity',
                    value:
                      complexityLevels[
                        (Number(prototype.complexity_level) || 3) - 1
                      ],
                  },
                ]}
                maxWidth="1000px"
                className="mt-4"
              />
              <div className="flex items-center pt-2"></div>
              {localPrototype.tags && (
                <div className="flex flex-wrap mt-4">
                  {localPrototype.tags.map((tag) => (
                    <DaTag
                      key={tag.tag}
                      variant={'secondary'}
                      className="mr-2 mb-2"
                    >
                      {tag.tag}
                    </DaTag>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col w-full items-center justify-center py-8 space-y-8">
        <DaText variant="title" className="text-da-primary-500">
          Customer Journey
        </DaText>
        <DaTableEditor
          defaultValue={localPrototype.customer_journey}
          onChange={(value) => handleChange('customer_journey', value)}
          isEditing={isEditing}
        />
      </div>
    </div>
  )
}

export default PrototypeTabJourney
