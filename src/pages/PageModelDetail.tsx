import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DaText } from '@/components/atoms/DaText'
import { DaCardIntro } from '@/components/molecules/DaCardIntro'
import DaImportFile from '@/components/atoms/DaImportFile'
import { DaButton } from '@/components/atoms/DaButton'
import { DaImage } from '@/components/atoms/DaImage'
import { DaInput } from '@/components/atoms/DaInput'
import DaLoading from '@/components/atoms/DaLoading'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import DaVehicleProperties from '@/components/molecules/DaVehicleProperties'
import DaContributorList from '@/components/molecules/DaContributorList'
import {
  deleteModelService,
  updateModelService,
} from '@/services/model.service'
import { uploadFileService } from '@/services/upload.service'
import { convertJSONToProperty } from '@/lib/vehiclePropertyUtils'
import {
  TbDownload,
  TbEdit,
  TbLoader,
  TbPhotoEdit,
  TbTrashX,
} from 'react-icons/tb'
import { downloadModelZip } from '@/lib/zipUtils'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { cn } from '@/lib/utils'

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
    <div className="flex justify-between items-center border px-4 py-2.5 mt-3 rounded-lg">
      <DaText variant="sub-title" className="text-da-gray-medium">
        Visibility:{' '}
        <DaText className="text-da-accent-500 capitalize ">{visibility}</DaText>
      </DaText>
      <DaButton
        onClick={toggleVisibility}
        variant="outline-nocolor"
        size="sm"
        className="text-da-primary-500"
      >
        Change to {visibility === 'public' ? 'private' : 'public'}
      </DaButton>
    </div>
  )
}

const cardIntro = [
  {
    title: 'Architecture',
    content: 'Provide the big picture of the vehicle model',
    path: 'architecture',
  },
  {
    title: 'Prototype Library',
    content:
      'Build up, evaluate and prioritize your portfolio of connected vehicle applications',
    path: 'library',
  },
  {
    title: 'Vehicle APIs',
    content:
      'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
    path: 'api',
  },
]

const PageModelDetail = () => {
  const [model] = useModelStore((state) => [state.model as Model])
  const [isExporting, setIsExporting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(model?.name ?? '')
  const { refetch } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])

  const handleAvatarChange = async (file: File) => {
    if (!model || !model.id) return
    if (file) {
      try {
        const { url } = await uploadFileService(file)
        await updateModelService(model.id, { model_home_image_file: url })
        await refetch()
      } catch (error) {
        console.error('Failed to update avatar:', error)
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
      await deleteModelService(model.id)
      await refetch()
      window.location.href = '/model'
    } catch (error) {
      console.error('Failed to delete model:', error)
    }
  }

  if (!model || !model.id) {
    return (
      <DaLoading
        text="Loading model..."
        timeout={10}
        timeoutText="Model not found"
      />
    )
  }

  return (
    <div className="flex flex-col w-full h-[90%] container pt-6">
      <div className="flex h-fit pb-3">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center">
            <div className="flex flex-col items-center space-y-2">
              {isEditingName ? (
                <div className="flex items-center h-[36px]">
                  <DaInput
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 min-w-[300px]"
                    inputClassName="h-6"
                  />
                  <div className="space-x-2">
                    <DaButton
                      variant="plain"
                      size="sm"
                      className="ml-4"
                      onClick={() => setIsEditingName(false)}
                    >
                      Cancel
                    </DaButton>
                    <DaButton
                      variant="solid"
                      size="sm"
                      className="ml-4"
                      onClick={handleNameSave}
                    >
                      Save
                    </DaButton>
                  </div>
                </div>
              ) : (
                <DaText
                  variant="huge-bold"
                  className="text-da-primary-500 w-full"
                >
                  {model.name}
                </DaText>
              )}
              {isAuthorized && (
                <div
                  className={cn(
                    'flex w-full space-x-3 pt-1',
                    isEditingName && 'pointer-events-none opacity-50',
                  )}
                >
                  <DaButton
                    variant="outline-nocolor"
                    size="sm"
                    className=""
                    onClick={() => {
                      setNewName(model.name)
                      setIsEditingName(true)
                    }}
                  >
                    <TbEdit className="w-4 h-4 mr-2" />
                    Edit Name
                  </DaButton>
                  <DaImportFile
                    onFileChange={handleAvatarChange}
                    accept=".png, .jpg, .jpeg"
                  >
                    <DaButton variant="outline-nocolor" className="" size="sm">
                      <TbPhotoEdit className="w-4 h-4 mr-2" />
                      Update Image
                    </DaButton>
                  </DaImportFile>
                  {!isExporting ? (
                    <DaButton
                      variant="outline-nocolor"
                      size="sm"
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
                      <TbDownload className="w-4 h-4 mr-2" />
                      Export Model
                    </DaButton>
                  ) : (
                    <DaText
                      variant="regular"
                      className="flex items-center text-da-gray-medium"
                    >
                      <TbLoader className="animate-spin text-lg mr-2" />
                      Exporting model...
                    </DaText>
                  )}
                </div>
              )}
            </div>
          </div>
          {isAuthorized && (
            <div className="flex h-full space-x-2">
              <DaConfirmPopup
                onConfirm={handleDeleteModel}
                label="This action cannot be undone and will delete all of your model and prototypes data. Please proceed with caution."
                confirmText={model.name}
              >
                <DaButton variant="destructive" size="sm" className="">
                  <TbTrashX className="w-4 h-4 mr-2" />
                  Delete Model
                </DaButton>
              </DaConfirmPopup>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 w-full h-full">
        <div className="col-span-6 overflow-y-auto pr-2">
          {cardIntro.map((card, index) => (
            <Link key={index} to={card.path}>
              <div className="space-y-3 da-clickable">
                <DaCardIntro
                  key={index}
                  title={card.title}
                  content={card.content}
                  maxWidth={'1000px'}
                  className="mb-3"
                />
              </div>
            </Link>
          ))}
          {isAuthorized && (
            <>
              <DaVehicleProperties
                key={model.id}
                category={model.vehicle_category ? model.vehicle_category : ''}
                properties={convertJSONToProperty(model.property) ?? []}
                className="mt-3"
              />

              <DaVisibilityControl
                initialVisibility={model.visibility}
                onVisibilityChange={(newVisibility) => {
                  updateModelService(model.id, {
                    visibility: newVisibility,
                  })
                }}
              />

              <DaContributorList
                className="mt-3"
                contributors={model.contributors ? model.contributors : []}
                members={model.members ? model.members : []}
              />
            </>
          )}
        </div>
        <div className="col-span-6 flex flex-col overflow-y-auto px-12">
          <DaImage src={model.model_home_image_file} alt={model.name} />
        </div>
      </div>
    </div>
  )
}

export default PageModelDetail
