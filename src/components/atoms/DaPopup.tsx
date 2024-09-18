import React, { Fragment, forwardRef, useState } from 'react'
import Modal from '@mui/material/Modal'
import clsx from 'clsx'
import { TbX } from 'react-icons/tb'

interface PopupProps {
  trigger: React.ReactElement
  children: React.ReactNode
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  width?: string
  className?: string
  disableBackdropClick?: boolean
  onClose?: () => void
}

const DaPopup = forwardRef<HTMLDivElement, PopupProps>(
  (
    {
      trigger,
      children,
      state,
      width,
      className,
      disableBackdropClick,
      onClose,
    },
    ref,
  ) => {
    const selfManaged = useState(false)
    const [open, setOpen] = state ?? selfManaged

    return (
      <Fragment>
        <span className="da-popup-placeholder" onClick={() => setOpen(true)}>
          {trigger}
        </span>
        <Modal
          ref={ref}
          open={open}
          onClose={(_, reason) => {
            if (disableBackdropClick && reason === 'backdropClick') return
            setOpen(false)
          }}
          style={{ zIndex: 99 }}
        >
          <div
            className={clsx('da-popup-inner relative', className)}
            style={{ width: width ?? '400px !important', overflow: 'visible' }}
          >
            {onClose && (
              <TbX
                className="absolute size-5 top-5 right-5 hover:text-red-500 hover:cursor-pointer"
                onClick={onClose}
              />
            )}
            {children}
          </div>
        </Modal>
      </Fragment>
    )
  },
)

DaPopup.displayName = 'Popup'

export default DaPopup
