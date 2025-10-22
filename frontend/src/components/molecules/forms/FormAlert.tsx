// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { TbLoader } from 'react-icons/tb'

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
    <form className="flex flex-col space-y-8 w-[500px] min-w-[400px] px-2 md:px-6 py-4 bg-white">
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
        <Button disabled={loading} onClick={onConfirm}>
          {loading && (
            <TbLoader className="animate-spin text-base mr-2" />
          )}
          Confirm
        </Button>
      </div>
    </form>
  )
}

export default FormAlert
