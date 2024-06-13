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
import { TbEdit, TbPhotoEdit, TbTrashX } from 'react-icons/tb'
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
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating prototype:', error)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    // Handle the cancel action here
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
      const { url } = await uploadFileService(file)
      // console.log('Prototype image url: ', url)
      setLocalPrototype((prevPrototype) => {
        if (!prevPrototype) return prevPrototype
        return {
          ...prevPrototype,
          image_file: url,
        }
      })
    } catch (error) {
      console.error('Failed to update prototype image:', error)
    }
  }

  const handleDeletePrototype = async () => {
    try {
      await deletePrototypeService(prototype.id)
      await refetchModelPrototypes()
      navigate(`/model/${model?.id}/library`)
    } catch (error) {
      console.error('Failed to delete prototype:', error)
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex">
        <div className="flex-1 relative">
          <DaImage
            src={
              localPrototype.image_file
                ? localPrototype.image_file
                : 'https://placehold.co/600x400'
            }
            className="w-full object-cover max-h-[400px]"
          />
          {isEditing && (
            <DaImportFile
              onFileChange={handlePrototypeImageChange}
              accept=".png, .jpg, .jpeg, .gif, .webp"
            >
              <DaButton
                variant="solid"
                size="sm"
                className="absolute right-2 top-2"
              >
                <TbPhotoEdit className="w-4 h-4 mr-1" /> Change Image
              </DaButton>
            </DaImportFile>
          )}
        </div>
        <div className="flex-1 p-2 ml-6">
          <div className="flex justify-between items-center mb-4">
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
                <DaText variant="title" className="text-da-primary-500 mt-2">
                  {localPrototype.name}
                </DaText>
                {isAuthorized && (
                  <div className="flex space-x-2">
                    <DaConfirmPopup
                      onConfirm={handleDeletePrototype}
                      label="This action cannot be undone and will delete all of your prototype data. Please proceed with caution."
                      confirmText={prototype.name}
                    >
                      <DaButton variant="destructive" size="sm" className="">
                        <TbTrashX className="w-4 h-4 mr-2" />
                        Delete Prototype
                      </DaButton>
                    </DaConfirmPopup>
                    <DaButton
                      onClick={() => setIsEditing(true)}
                      className=" text-white px-4 py-2 rounded"
                      size="sm"
                    >
                      <TbEdit className="w-4 h-4 mr-1" /> Edit Prototype
                    </DaButton>
                  </div>
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
                <DaInput
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
                maxWidth="500px"
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
