import React, { useEffect, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { DaAvatar } from '@/components/atoms/DaAvatar'
import DaImportFile from '@/components/atoms/DaImportFile'
import { TbCircleFilled, TbPhotoEdit } from 'react-icons/tb'
import { uploadFileService } from '@/services/upload.service'
import { partialUpdateUserService } from '@/services/user.service'
import FormUpdatePassword from '@/components/molecules/forms/FormUpdatePassword'
import DaPopup from '@/components/atoms/DaPopup'

const PageUserProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const { data: user, refetch } = useSelfProfileQuery()
  const [isOpenPopup, setIsOpenPopup] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
    }
  }, [user])

  if (!user) return null

  const handleAvatarChange = async (file: File) => {
    if (file) {
      try {
        const { url } = await uploadFileService(file)
        await partialUpdateUserService({ image_file: url })
        await refetch()
      } catch (error) {
        console.error('Failed to update avatar:', error)
      }
    }
  }

  const handleUpdateUser = async () => {
    try {
      await partialUpdateUserService({ name })
      await refetch()
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  return (
    <div className="flex w-full h-full bg-slate-200 p-2">
      <div className="flex w-full h-full justify-center bg-white rounded-xl ">
        <div className="flex flex-col w-full max-w-[70vw] xl:max-w-[50vw] 2xl:max-w-[40vw]">
          <div className="flex flex-col items-center container mt-6 w-full">
            <div className="flex flex-col w-full">
              <DaText
                variant="huge-bold"
                className="text-da-gray-dark font-semibold"
              >
                Profile
              </DaText>
              <DaText variant="small" className="mt-1">
                You can edit your profile information and manage kits here.
              </DaText>
            </div>
            <div className="flex flex-col w-full mt-8">
              <div className="flex items-center">
                <div className="flex relative">
                  <DaAvatar
                    className="w-24 h-24 border"
                    src={
                      user?.image_file ? user.image_file : 'imgs/profile.png'
                    }
                  />
                  <DaImportFile
                    onFileChange={handleAvatarChange}
                    accept=".png, .jpg, .jpeg"
                  >
                    <button className="absolute p-1 top-0 right-0 bg-white border rounded-full">
                      <TbPhotoEdit className="w-5 h-5" />
                    </button>
                  </DaImportFile>
                </div>
                <div className="flex flex-col w-full ml-6 xl:ml-12">
                  <div className="flex w-full items-center justify-between">
                    {isEditing ? (
                      <DaInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-8 w-full max-w-[350px]"
                        inputClassName="h-6"
                      />
                    ) : (
                      <div className="truncate max-w-[350px]">
                        <DaText
                          variant="title"
                          className="text-da-gray-dark truncate "
                        >
                          {user?.name}
                        </DaText>
                      </div>
                    )}
                    {isEditing ? (
                      <div>
                        <DaButton
                          variant="outline-nocolor"
                          size="sm"
                          className="mr-2"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </DaButton>
                        <DaButton size="sm" onClick={handleUpdateUser}>
                          Save
                        </DaButton>
                      </div>
                    ) : (
                      <DaButton
                        size="sm"
                        variant="outline-nocolor"
                        onClick={() => setIsEditing(true)}
                      >
                        Change name
                      </DaButton>
                    )}
                  </div>

                  <DaText variant="regular" className="mx-1 mt-1">
                    {user?.email}
                  </DaText>
                </div>
              </div>
              {/* <div className="flex flex-col mt-8">
                <DaText variant="regular-bold" className="text-da-gray-dark">
                  UID
                </DaText>
                <DaText variant="small" className="text-da-gray-medium">
                  {user?.id}
                </DaText>
              </div> */}
              <div className="flex flex-col w-full mt-6">
                <DaText variant="regular-bold" className="text-da-gray-dark">
                  Password
                </DaText>
                <div className="flex w-full items-start justify-between">
                  <div className="flex space-x-1 mt-2">
                    {[...Array(8)].map((_, index) => (
                      <TbCircleFilled
                        className="size-3 text-gray-300"
                        key={index}
                      />
                    ))}
                  </div>
                  <div className="">
                    <DaPopup
                      state={[isOpenPopup, setIsOpenPopup]}
                      trigger={
                        <DaButton
                          size="sm"
                          variant="outline-nocolor"
                          className=""
                        >
                          Change password
                        </DaButton>
                      }
                    >
                      <FormUpdatePassword />
                    </DaPopup>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageUserProfile
