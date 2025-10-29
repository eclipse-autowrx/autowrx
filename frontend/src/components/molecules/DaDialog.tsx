// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * DaDialog - A customizable dialog/modal component wrapper
 *
 * @example
 * // Uncontrolled usage with trigger
 * <DaDialog
 *   trigger={<Button>Open Dialog</Button>}
 *   dialogTitle="My Dialog"
 *   description="This is a description"
 * >
 *   <p>Dialog content here</p>
 * </DaDialog>
 *
 * @example
 * // Controlled usage
 * const [open, setOpen] = useState(false)
 * <DaDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   dialogTitle="Controlled Dialog"
 *   preventOutsideClose={true}
 * >
 *   <p>Content that prevents closing by clicking outside</p>
 * </DaDialog>
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog'
import { cn } from '@/lib/utils'

interface DaDialogProps {
  children: React.ReactNode
  dialogTitle?: React.ReactNode
  description?: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  contentContainerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
  onClose?: () => void
  // Prevent clicking outside to close
  preventOutsideClose?: boolean
  // Disable the dialog
  disabled?: boolean
}

const DaDialog = ({
  children,
  dialogTitle,
  description,
  trigger,
  className,
  contentContainerClassName,
  open: controlledOpen,
  onOpenChange,
  showCloseButton = true,
  onClose,
  preventOutsideClose = false,
  disabled = false,
}: DaDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen ?? uncontrolledOpen

  // Handle open change with prevention for outside clicks
  const handleOpenChange = (newOpenState: boolean) => {
    // If disabled, prevent opening
    if (disabled && newOpenState) {
      return
    }

    // If trying to close and preventOutsideClose is true, don't allow closing
    if (isOpen && !newOpenState && preventOutsideClose) {
      return
    }

    // Otherwise use the provided handler or internal state setter
    if (onOpenChange) {
      onOpenChange(newOpenState)
    } else {
      setUncontrolledOpen(newOpenState)
    }
  }

  useEffect(() => {
    if (!isOpen && onClose) {
      onClose()
    }
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild disabled={disabled}>
          <div
            className={cn(
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            )}
          >
            {trigger}
          </div>
        </DialogTrigger>
      )}
      <DialogContent
        className={className}
        onOpenAutoFocus={(e) => e.preventDefault()}
        showCloseButton={!preventOutsideClose && showCloseButton}
        onPointerDownOutside={(e) => {
          if (preventOutsideClose) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (preventOutsideClose) {
            e.preventDefault()
          }
        }}
      >
        {dialogTitle && (
          <DialogHeader className="text-primary space-y-1">
            <DialogTitle>{dialogTitle}</DialogTitle>
            {description && (
              <div className="text-sm text-muted-foreground leading-loose">
                {description}
              </div>
            )}
          </DialogHeader>
        )}
        <div className={cn('flex flex-col w-full', contentContainerClassName)}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DaDialog
