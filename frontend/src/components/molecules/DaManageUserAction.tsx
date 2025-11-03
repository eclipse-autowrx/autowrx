// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { User } from '@/types/user.type'
import DaDialog from '@/components/molecules/DaDialog'
import { useState } from 'react'
import FormCreateUser from './forms/FormCreateUser'
import { Button } from '@/components/atoms/button'
import { TbPencil, TbTrash } from 'react-icons/tb'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { deleteUserService } from '@/services/user.service'
import { isAxiosError } from 'axios'
import { useToast } from './toaster/use-toast'

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
  const { toast } = useToast()

  const deleteUser = async () => {
    try {
      await deleteUserService(user.id)
      onUpdateList && (await onUpdateList())
      setOpenDelete(false)
      toast({
        title: 'Success',
        description: `User ${user.name} has been deleted.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: isAxiosError(error)
          ? error.response?.data?.message ?? 'Something went wrong'
          : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="ml-auto items-center flex gap-2">
      <div className="flex gap-2">
        <DaDialog
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button onClick={() => setOpen(true)} variant="ghost" size="sm">
              <TbPencil className="w-5 h-5" />
            </Button>
          }
        >
          <FormCreateUser updateData={user} onClose={() => setOpen(false)} />
        </DaDialog>

        <DaConfirmPopup
          title="Delete User"
          label={`Are you sure you want to delete user '${user.name}'?`}
          confirmText="DELETE"
          onConfirm={deleteUser}
          state={[openDelete, setOpenDelete]}
        >
          <Button
            onClick={() => setOpenDelete(true)}
            variant="destructive"
            size="sm"
          >
            <TbTrash className="w-5 h-5" />
          </Button>
        </DaConfirmPopup>
      </div>
    </div>
  )
}

export default DaManageUserAction

