import React, { useState } from 'react'
import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { DaButton } from '../atoms/DaButton'
import { DaSelect, DaSelectItem } from '../atoms/DaSelect'
import { Prototype } from '@/types/model.type'
import { DaTableProperty } from '../molecules/DaTableProperty'
import {
  updatePrototypeService,
  deletePrototypeService,
} from '@/services/prototype.service'
import {
  TbChevronDown,
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
import { downloadPrototypeZip } from '@/lib/zipUtils'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaInputWithLabel from '../atoms/DaInputWithLabel'
import { CustomRequirement } from '@/types/model.type'
import DaCustomRequirements from '../molecules/prototype_requirements/DaCustomRequirements'

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
  const [isSaving, setIsSaving] = useState(false)
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)
  const [customRequirements, setCustomRequirements] = useState<
    CustomRequirement[]
  >(JSON.parse(prototype.requirements ?? '[]'))

  const { data: currentUser } = useSelfProfileQuery()

  if (!prototype) {
    return <DaText>No prototype available</DaText>
  }

  const handleSave = async () => {
    if (!localPrototype) return
    setIsEditing(false)
    setIsSaving(true)
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
      requirements: JSON.stringify(customRequirements),
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
    } catch (error) {
      console.error('Error updating prototype:', error)
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
      //
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
    <div className="flex flex-col h-full w-full p-2 bg-slate-200">
      <div className="flex flex-col h-full w-full bg-white rounded-lg overflow-y-auto">
        <div className="flex flex-col h-full w-full pt-6 container bg-white">
          <div className="flex mr-4 mb-3 justify-between items-center">
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
                <DaText variant="huge-bold" className="text-da-primary-500">
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
                          {!isDeleting && !isEditing && !isSaving && (
                            <>
                              Prototype Action
                              <TbChevronDown className="w-4 h-4 ml-1" />
                            </>
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
          <div className="flex w-full">
            <div className="flex-1 h-fit relative">
              <DaImage
                src={
                  localPrototype.image_file
                    ? localPrototype.image_file
                    : '/imgs/default_prototype_cover.jpg'
                }
                className="w-full object-cover max-h-[400px] rounded-lg"
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
            <div className="flex flex-1 h-full px-4 ml-4">
              {isEditing ? (
                <div className="flex flex-col w-full">
                  <DaInputWithLabel
                    label="Prototype Name"
                    value={localPrototype.name}
                    onChange={(value) => handleChange('name', value)}
                  />
                  <DaInputWithLabel
                    label="Problem"
                    value={localPrototype.description.problem}
                    onChange={(value) =>
                      handleDescriptionChange('problem', value)
                    }
                  />
                  <DaInputWithLabel
                    label="Says who?"
                    value={localPrototype.description.says_who}
                    onChange={(value) =>
                      handleDescriptionChange('says_who', value)
                    }
                  />
                  <DaInputWithLabel
                    label="Solution"
                    value={localPrototype.description.solution}
                    onChange={(value) =>
                      handleDescriptionChange('solution', value)
                    }
                    isTextarea
                  />
                  <div className="flex items-center mb-4">
                    <DaText className="w-[150px]" variant="small-bold">
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
                      className="w-full"
                    >
                      {complexityLevels.map((level, index) => (
                        <DaSelectItem key={index} value={level}>
                          {level}
                        </DaSelectItem>
                      ))}
                    </DaSelect>
                  </div>

                  <div className="flex items-center mb-4">
                    <DaText className="w-[150px]" variant="small-bold">
                      Status
                    </DaText>
                    <DaSelect
                      value={localPrototype.state || 'development'}
                      onValueChange={(value) => handleChange('state', value)}
                      className="w-full"
                    >
                      <DaSelectItem value="development">
                        Developing
                      </DaSelectItem>
                      <DaSelectItem value="Released">Released</DaSelectItem>
                    </DaSelect>
                  </div>
                </div>
              ) : (
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
          <div className="flex flex-col w-full items-center justify-center py-8 space-y-8">
            <DaText variant="title" className="text-da-primary-500">
              Requirements
            </DaText>
            <DaCustomRequirements
              customRequirements={customRequirements}
              setCustomRequirements={setCustomRequirements}
              onSaveRequirements={() => handleSave()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabJourney
