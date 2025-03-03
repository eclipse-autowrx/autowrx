import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/atoms/dialog'
import { cn } from '@/lib/utils'

interface CustomDialogProps {
  children: React.ReactNode
  dialogTitle?: React.ReactNode
  description?: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  childrenWrapperClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
  onClose?: () => void
}

const CustomDialog = ({
  children,
  dialogTitle,
  description,
  trigger,
  className,
  childrenWrapperClassName,
  open: controlledOpen,
  onOpenChange,
  showCloseButton = true,
  onClose,
}: CustomDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen ?? uncontrolledOpen
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen

  useEffect(() => {
    if (!isOpen && onClose) {
      onClose()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          'flex flex-col w-[90vw] xl:w-[60vw] h-[90vh] xl:h-[75vh] min-w-[700px] max-h-[700px] text-primary outline-none',
          className,
        )}
        // onOpenAutoFocus={(e) => e.preventDefault()}
        showCloseButton={showCloseButton}
      >
        {dialogTitle && (
          <DialogHeader className="text-da-primary-500 space-y-1">
            <DialogTitle>{dialogTitle}</DialogTitle>
            {description && (
              <div className="text-sm text-muted-foreground leading-loose">
                {description}
              </div>
            )}
          </DialogHeader>
        )}
        {/* <div className="border-b border-border"></div> */}
        <div
          className={cn(
            'flex flex-col w-full h-full overflow-y-auto scroll',
            childrenWrapperClassName,
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomDialog
