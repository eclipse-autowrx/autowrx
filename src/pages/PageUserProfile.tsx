import React, { useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { DaAvatar } from '@/components/atoms/DaAvatar'
import DaImportFile from '@/components/atoms/DaImportFile'
import { TbPhotoEdit } from 'react-icons/tb'
import { uploadFileService } from '@/services/upload.service'
import { partialUpdateUserService } from '@/services/user.service'

const PageUserProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const { data: user } = useSelfProfileQuery()

  if (!user) return null

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  const handleSave = () => {
    setIsEditing(false)
  }

  const handleAvatarChange = async (file: File) => {
    if (file) {
      try {
        const { url } = await uploadFileService(file)
        await partialUpdateUserService({ image_file: url })
      } catch (error) {
        console.error('Failed to update avatar:', error)
      }
    }
  }

  return (
    <div className="flex flex-col items-center p-12 container w-full">
      <div className="flex w-full items-center justify-center">
        <div className="flex relative">
          <DaAvatar
            className="w-36 h-36 border"
            src={user?.image_file ? user.image_file : 'imgs/profile.png'}
          />
          <DaImportFile
            onFileChange={handleAvatarChange}
            accept=".png, .jpg, .jpeg"
          >
            <button className="absolute p-1 top-1 right-1 bg-white border rounded-full">
              <TbPhotoEdit className="w-5 h-5" />
            </button>
          </DaImportFile>
        </div>
        <div className="ml-6 flex-1 max-w-[600px] space-y-3">
          <div className="mb-2">
            <DaText variant="regular-bold" className="mr-2">
              Email:
            </DaText>
            <DaText variant="regular">{user?.email}</DaText>
          </div>

          <div className="flex pb-4 w-full items-center">
            <div className="flex mr-6 items-center">
              <DaText variant="regular-bold" className="mr-2">
                Name:{' '}
              </DaText>
              {isEditing ? (
                <DaInput
                  value={user?.name}
                  onChange={handleNameChange}
                  className="h-8"
                  inputClassName="h-6"
                />
              ) : (
                <DaText variant="regular">{user?.name}</DaText>
              )}
            </div>
            {isEditing ? (
              <div>
                <DaButton
                  variant="destructive"
                  size="sm"
                  className="mr-2"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </DaButton>
                <DaButton size="sm" onClick={handleSave}>
                  Save
                </DaButton>
              </div>
            ) : (
              <DaButton size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </DaButton>
            )}
          </div>

          <div className="flex justify-between items-center w-full pt-2 border-t">
            <DaText variant="regular">Do you want to change password?</DaText>
            <DaButton size="sm">Change password</DaButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageUserProfile
