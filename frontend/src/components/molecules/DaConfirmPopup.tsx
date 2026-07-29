// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, ReactElement } from 'react'
import DaDialog from './DaDialog'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import { Spinner } from '../atoms/spinner'

interface DaConfirmPopupProps {
  onConfirm: () => void | Promise<void>
  label: string
  title?: string
  confirmText?: string
  confirmLabel?: string
  confirmingLabel?: string
  children: ReactElement
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const DaConfirmPopup = ({
  onConfirm,
  label,
  title,
  confirmText,
  confirmLabel = 'Confirm',
  confirmingLabel = 'Confirming...',
  children,
  state,
}: DaConfirmPopupProps) => {
  const selfManaged = useState(false)
  const [isOpen, setIsOpen] = state ?? selfManaged
  const [inputValue, setInputValue] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    if (isConfirming) return
    if (!confirmText || inputValue === confirmText) {
      setIsConfirming(true)
      try {
        await onConfirm()
        setIsOpen(false)
        setInputValue('')
      } catch {
        // Keep dialog open so the user can retry after a failed confirm action.
      } finally {
        setIsConfirming(false)
      }
    }
  }

  const handleClose = () => {
    if (isConfirming) return
    setIsOpen(false)
    setInputValue('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isConfirming && !nextOpen) return
    setIsOpen(nextOpen)
    if (!nextOpen) {
      setInputValue('')
    }
  }

  return (
    <DaDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      preventOutsideClose={isConfirming}
      trigger={React.cloneElement(children, { onClick: () => setIsOpen(true) })}
      dialogTitle={title}
      className="w-125 max-w-[calc(100vw-40px)]"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isConfirming || (confirmText ? inputValue !== confirmText : false)}
            onClick={handleConfirm}
          >
            {isConfirming ? (
              <>
                <Spinner className="mr-2" />
                {confirmingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-base">{label}</p>
        {confirmText && (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              You must type{' '}
              <strong className="font-semibold">{confirmText}</strong> to
              proceed.
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder={`Type "${confirmText}" to confirm`}
              disabled={isConfirming}
            />
          </div>
        )}
      </div>
    </DaDialog>
  )
}

export default DaConfirmPopup
