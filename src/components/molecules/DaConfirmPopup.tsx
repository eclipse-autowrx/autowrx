import React, { useState } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaButton } from '../atoms/DaButton'
import { DaText } from '../atoms/DaText'

interface DaConfirmPopupProps {
  onConfirm: () => void
  label: string
  children: React.ReactElement
}

const DaConfirmPopup = ({
  onConfirm,
  label,
  children,
}: DaConfirmPopupProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setIsOpen(false)
  }

  return (
    <DaPopup
      state={[isOpen, setIsOpen]}
      trigger={React.cloneElement(children, { onClick: () => setIsOpen(true) })}
    >
      <div className="flex flex-col max-w-[500px]">
        <DaText className="mb-4">{label}</DaText>
        <div className="flex justify-end w-full space-x-2">
          <DaButton
            variant="outline-nocolor"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </DaButton>
          <DaButton variant="solid" size="sm" onClick={handleConfirm}>
            Confirm
          </DaButton>
        </div>
      </div>
    </DaPopup>
  )
}

export default DaConfirmPopup
