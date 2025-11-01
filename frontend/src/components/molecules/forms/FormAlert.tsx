// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'

interface FormAlertProps {
  onCancel: () => void
  loading?: boolean
  onConfirm: () => void
  children?: React.ReactNode
}

const FormAlert = ({
  onCancel,
  onConfirm,
  loading,
  children,
}: FormAlertProps) => {
  return (
    <form className="flex flex-col space-y-8 bg-background">
      {children}
      <div className="ml-auto space-x-2">
        <Button
          disabled={loading}
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button disabled={loading} onClick={onConfirm} variant="default">
          {loading && <Spinner className="mr-2" size={16} />}
          Confirm
        </Button>
      </div>
    </form>
  )
}

export default FormAlert
