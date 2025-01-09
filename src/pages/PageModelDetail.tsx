import { useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import DaImportFile from '@/components/atoms/DaImportFile'
import { DaButton } from '@/components/atoms/DaButton'
import { DaImage } from '@/components/atoms/DaImage'
import { DaInput } from '@/components/atoms/DaInput'
import DaLoading from '@/components/atoms/DaLoading'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import DaVehicleProperties from '@/components/molecules/vehicle_properties/DaVehicleProperties'
import DaContributorList from '@/components/molecules/DaContributorList'
import {
  deleteModelService,
  updateModelService,
} from '@/services/model.service'
import { uploadFileService } from '@/services/upload.service'
import { convertJSONToProperty } from '@/lib/vehiclePropertyUtils'
import {
  TbChevronDown,
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
import DaMenu from '@/components/atoms/DaMenu'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import clsx from 'clsx'

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
      <DaText variant="sub-title" className="text-da-gray-medium">
        Visibility:{' '}
        <DaText className="text-da-accent-500 capitalize !font-medium">
          {visibility}
        </DaText>
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

const DaStateControl: React.FC<{
  state: string
  onStateChange: (value: string) => void
}> = ({ state, onStateChange }) => {
  return (
    <div className="flex justify-between items-center border p-2 mt-3 rounded-lg">
      <DaText variant="sub-title" className="text-da-gray-medium">
        State:{' '}
        <DaText
          className={clsx(
            'capitalize !font-medium',
            state === 'blocked' ? 'text-da-destructive' : 'text-da-accent-500',
          )}
        >
          {state}
        </DaText>
      </DaText>
      <DaMenu
        trigger={
          <DaButton
            variant="outline-nocolor"
            size="sm"
            className="text-da-primary-500"
          >
            Change state
          </DaButton>
        }
      >
        <div className="flex flex-col px-1">
          <DaButton
            onClick={() => onStateChange('draft')}
            className="!justify-start"
            variant="plain"
            size="sm"
          >
            Draft
          </DaButton>
          <DaButton
            onClick={() => onStateChange('released')}
            className="!justify-start"
            variant="plain"
            size="sm"
          >
            Released
          </DaButton>
          <DaButton
            onClick={() => onStateChange('blocked')}
            className="!justify-start"
            variant="destructive"
            size="sm"
          >
            Blocked
          </DaButton>
        </div>
      </DaMenu>
    </div>
  )
}

const PageModelDetail = () => {
  const [model] = useModelStore((state) => [state.model as Model])
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
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
      await refetch()
      window.location.href = '/model'
    } catch (error) {
      console.error('Failed to delete model:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!model || !model.id) {
    return (
      <div className="h-full w-full p-4 bg-white rounded-lg">
        <DaLoading
          text="Loading model..."
          timeout={20}
          timeoutText="Model not found or access denied"
          className="h-[80%]"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white p-4 h-full rounded-md">
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
            </div>
          </div>
        </div>
        {isAuthorized && (
          <div className="flex gap-2">
            <DaMenu
              trigger={
                <DaButton
                  size="sm"
                  className={cn(
                    'flex w-full space-x-3 pt-1',
                    isEditingName && '!pointer-events-none opacity-50',
                  )}
                >
                  {!isDeleting && !isExporting && (
                    <>
                      Model Action
                      <TbChevronDown />
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
                </DaButton>
              }
            >
              <div className="flex flex-col px-1">
                <DaButton
                  variant="plain"
                  size="sm"
                  className="!justify-start"
                  onClick={() => {
                    setNewName(model.name)
                    setIsEditingName(true)
                  }}
                >
                  <TbEdit className="w-4 h-4 mr-2" />
                  Edit Name
                </DaButton>
                <DaButton
                  variant="plain"
                  size="sm"
                  className="!justify-start"
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
                <DaButton
                  variant="destructive"
                  size="sm"
                  className="!justify-start"
                  onClick={() => setConfirmPopupOpen(true)}
                >
                  <TbTrashX className="w-4 h-4 mr-2" />
                  Delete Model
                </DaButton>
              </div>
            </DaMenu>
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

      <div className="grid gap-4 grid-cols-12 w-full overflow-auto">
        <div className="col-span-6 flex flex-col overflow-y-auto">
          <div className="flex w-full relative overflow-hidden">
            <DaImage
              className="w-full object-cover max-h-[500px] aspect-video rounded-lg border"
              src={model.model_home_image_file}
              alt={model.name}
            />
            {isAuthorized && (
              <DaImportFile
                onFileChange={handleAvatarChange}
                accept=".png, .jpg, .jpeg"
              >
                <DaButton
                  variant="outline-nocolor"
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
                </DaButton>
              </DaImportFile>
            )}
          </div>
        </div>
        <div className="col-span-6">
          {isAuthorized && (
            <>
              <DaVehicleProperties
                key={model.id}
                category={model.vehicle_category ? model.vehicle_category : ''}
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
                state={model.state || ''}
                onStateChange={async (state) => {
                  await updateModelService(model.id, {
                    state: (state || 'draft') as Model['state'],
                  })
                  refetch()
                }}
              />

              <DaContributorList className="mt-3" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageModelDetail
