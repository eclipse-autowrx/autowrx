// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import dayjs from 'dayjs'
import DaText from '../atoms/DaText'
import { User } from '@/types/user.type'
import DaPopup from '../atoms/DaPopup'
import { useState } from 'react'
import FormCreateUser from './forms/FormCreateUser'
import { DaButton } from '../atoms/DaButton'
import { TbPencil, TbTrash } from 'react-icons/tb'
import FormAlert from './forms/FormAlert'
import { deleteUserService } from '@/services/user.service'
import { isAxiosError } from 'axios'

interface DaManageUserActionProps {
  user: User
  onUpdateList?: (args?: any) => Promise<any>
}

const DaManageUserAction = ({
  user,
  onUpdateList,
}: DaManageUserActionProps) => {
  const [open, setOpen] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  const deleteUser = async () => {
    try {
      setLoading(true)
      await deleteUserService(user.id)
      onUpdateList && (await onUpdateList())
      setOpenDelete(false)
    } catch (error) {
      console.log(
        isAxiosError(error)
          ? error.response?.data?.message
          : 'Something went wrong',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ml-auto items-center flex gap-2">
      <div>
        <DaPopup state={[open, setOpen]} trigger={<span></span>}>
          <FormCreateUser updateData={user} onClose={() => setOpen(false)} />
        </DaPopup>
        <DaButton onClick={() => setOpen(true)} variant="plain" size="sm">
          <TbPencil className="w-5 h-5" />
        </DaButton>

        <DaPopup state={[openDelete, setOpenDelete]} trigger={<span></span>}>
          <FormAlert
            loading={loading}
            onConfirm={deleteUser}
            onCancel={() => setOpenDelete(false)}
          >
            <DaText>Are you sure you want to delete user '{user.name}'</DaText>
          </FormAlert>
        </DaPopup>
        <DaButton
          onClick={() => setOpenDelete(true)}
          variant="destructive"
          size="sm"
        >
          <TbTrash className="w-5 h-5" />
        </DaButton>
      </div>
    </div>
  )
}

export default DaManageUserAction
