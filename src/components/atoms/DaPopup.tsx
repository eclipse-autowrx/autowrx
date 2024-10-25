import React, { Fragment, forwardRef, useState } from 'react'
import Modal from '@mui/material/Modal'
import clsx from 'clsx'
import { TbX } from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface PopupProps {
  trigger: React.ReactElement
  children: React.ReactNode
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  width?: string
  className?: string
  disableBackdropClick?: boolean
  onClose?: () => void
  closeBtnClassName?: string
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
      closeBtnClassName,
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
                className={cn(
                  'absolute size-5 top-5 right-5 hover:text-red-500 hover:cursor-pointer',
                  closeBtnClassName,
                )}
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
