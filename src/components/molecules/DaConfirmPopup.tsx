import React, { useState, ReactElement } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaButton } from '../atoms/DaButton'
import { DaText } from '../atoms/DaText'
import { DaInput } from '../atoms/DaInput'

interface DaConfirmPopupProps {
  onConfirm: () => void
  label: string
  title?: string
  confirmText?: string
  children: ReactElement
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const DaConfirmPopup = ({
  onConfirm,
  label,
  title,
  confirmText,
  children,
  state,
}: DaConfirmPopupProps) => {
  const selfManaged = useState(false)
  const [isOpen, setIsOpen] = state ?? selfManaged
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    if (!confirmText || inputValue === confirmText) {
      onConfirm()
      setIsOpen(false)
    }
  }

  return (
    <DaPopup
      state={[isOpen, setIsOpen]}
      trigger={React.cloneElement(children, { onClick: () => setIsOpen(true) })}
    >
      <div className="flex flex-col max-w-[500px]">
        {title && (
          <DaText variant="sub-title" className="text-da-primary-500 mb-4">
            {title}
          </DaText>
        )}
        <DaText className="mb-4">{label}</DaText>
        {confirmText && (
          <div className="mb-4">
            <DaText variant="small">
              You must type <strong className="font-bold">{confirmText}</strong>{' '}
              to proceed.
            </DaText>
            <DaInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-8 flex mt-2"
              inputClassName="h-6"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        )}
        <div className="flex justify-end w-full space-x-2">
          <DaButton
            variant="outline-nocolor"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </DaButton>
          <DaButton
            variant="solid"
            size="sm"
            onClick={handleConfirm}
            disabled={Boolean(confirmText && inputValue !== confirmText)}
          >
            Confirm
          </DaButton>
        </div>
      </div>
    </DaPopup>
  )
}

export default DaConfirmPopup
