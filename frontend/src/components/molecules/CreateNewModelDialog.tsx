// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode } from 'react'
import DaDialog from '@/components/molecules/DaDialog'
import { DialogTitle } from '@/components/atoms/dialog'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
import { cn } from '@/lib/utils'

export interface CreateNewModelDialogProps {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  className?: string
  hideHeaderDivider?: boolean
}

const CreateNewModelDialog = ({
  trigger,
  open,
  onOpenChange,
  onClose,
  className,
}: CreateNewModelDialogProps) => (
  <DaDialog
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
    trigger={trigger}
    closeIconClassName="w-4 h-4"
    contentContainerClassName="py-6"
    className={cn('w-128 max-w-[calc(100vw-40px)]', className)}
  >
    <DialogTitle className="mb-4 text-lg font-semibold text-primary">
      Create New Model
    </DialogTitle>
    <FormCreateModel />
  </DaDialog>
)

export default CreateNewModelDialog
