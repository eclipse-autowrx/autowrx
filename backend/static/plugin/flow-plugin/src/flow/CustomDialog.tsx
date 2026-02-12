// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { cn } from '../lib/utils'

interface CustomDialogProps {
  children: React.ReactNode | ((ctx: { onClose: () => void }) => React.ReactNode)
  dialogTitle?: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
}

export default function CustomDialog({
  children,
  dialogTitle,
  trigger,
  className,
  open: controlledOpen,
  onOpenChange,
  showCloseButton = true,
}: CustomDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = controlledOpen ?? uncontrolledOpen
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen

  return (
    <>
      {trigger && (
        <div onClick={() => handleOpenChange(true)} style={{ cursor: 'pointer' }}>
          {trigger}
        </div>
      )}
      {isOpen && (
        <div
          className="flow-plugin-root flow-dialog-overlay flex items-center justify-center"
          onClick={() => handleOpenChange(false)}
        >
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
          />
          <div
            className={cn(
              'relative z-10 flex flex-col bg-white rounded-lg shadow-lg max-h-[90vh] min-w-[700px]',
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {dialogTitle && (
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-da-primary-500">
                  {dialogTitle}
                </h2>
              </div>
            )}
            <div className="flex-1 overflow-auto p-6 min-w-0">
              {typeof children === 'function'
                ? children({ onClose: () => handleOpenChange(false) })
                : children}
            </div>
            {showCloseButton && (
              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => handleOpenChange(false)}
                  className="btn-outline"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
