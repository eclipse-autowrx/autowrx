import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'

interface DeletePluginDialogProps {
  open: boolean
  pluginName: string
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const DeletePluginDialog: React.FC<DeletePluginDialogProps> = ({
  open,
  pluginName,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isLoading && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete plugin</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{pluginName}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeletePluginDialog

