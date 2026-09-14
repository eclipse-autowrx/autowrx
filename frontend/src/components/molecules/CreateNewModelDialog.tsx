// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode } from 'react'
import DaDialog from '@/components/molecules/DaDialog'
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
  hideHeaderDivider,
}: CreateNewModelDialogProps) => (
  <DaDialog
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
    trigger={trigger}
    dialogTitle="Create New Model"
    hideHeaderDivider={hideHeaderDivider}
    className={cn('w-115 max-w-[calc(100vw-40px)]', className)}
  >
    <FormCreateModel />
  </DaDialog>
)

export default CreateNewModelDialog
