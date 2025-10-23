// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms/avatar'
import DaImportFile from '@/components/atoms/DaImportFile'
import { TbCircleFilled, TbPhotoEdit } from 'react-icons/tb'
import { uploadFileService } from '@/services/upload.service.ts'
import { partialUpdateUserService } from '@/services/user.service'
import DaDialog from '@/components/molecules/DaDialog'

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
              <h1 className="text-2xl font-semibold text-foreground">
                Profile
              </h1>
              <p className="text-sm mt-1">
                You can edit your profile information and manage kits here.
              </p>
            </div>
            <div className="flex flex-col w-full mt-8">
              <div className="flex items-center">
                <div className="flex relative">
                  <Avatar className="w-24 h-24 border">
                    <AvatarImage
                      src={user?.image_file ? user.image_file : 'imgs/profile.png'}
                      alt={user?.name || 'Profile'}
                    />
                    <AvatarFallback>
                      <img src="/imgs/profile.png" alt="profile" className="h-full w-full rounded-full object-cover" />
                    </AvatarFallback>
                  </Avatar>
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
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-6 w-full max-w-[350px]"
                      />
                    ) : (
                      <div className="truncate max-w-[350px]">
                        <h2 className="text-xl font-semibold text-foreground truncate">
                          {user?.name}
                        </h2>
                      </div>
                    )}
                    {isEditing ? (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateUser}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        Change name
                      </Button>
                    )}
                  </div>

                  <p className="text-base mx-1 mt-1">
                    {user?.email}
                  </p>
                </div>
              </div>
              {/* <div className="flex flex-col mt-8">
                <div className="text-base font-semibold text-foreground">
                  UID
                </div>
                <div className="text-sm text-muted-foreground">
                  {user?.id}
                </div>
              </div> */}
              <div className="flex flex-col w-full mt-6">
                <div className="text-base font-semibold text-foreground">
                  Password
                </div>
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
                    <DaDialog
                      open={isOpenPopup}
                      onOpenChange={setIsOpenPopup}
                      trigger={
                        <Button size="sm" variant="outline">
                          Change password
                        </Button>
                      }
                    >
                      <div className="p-4">
                        <p className="text-base">
                          Password change functionality is not available.
                        </p>
                      </div>
                    </DaDialog>
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
