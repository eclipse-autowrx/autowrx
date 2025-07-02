// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import {
  useForm,
  SubmitHandler,
  FieldError,
  useController,
} from 'react-hook-form'
import { Link } from 'react-router-dom'
import type {
  InventorySchema,
  InventorySchemaFormData,
} from '@/types/inventory.type'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { DaButton } from '@/components/atoms/DaButton'
import { useEffect, useMemo, useState } from 'react'
import Ajv from 'ajv'
import clsx from 'clsx'
import { TbLoader } from 'react-icons/tb'
import CodeEditor from '../../CodeEditor'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'

const ajv = new Ajv()

// Helper function to validate JSON
const isValidJsonSchema = async (value: string): Promise<boolean | string> => {
  value = value.trim()
  if (!value && value !== '') return 'Schema definition cannot be empty.'
  let object = null
  try {
    object = JSON.parse(value)
  } catch (e) {
    return 'Invalid JSON format.' // Return error message
  }

  try {
    const validate = ajv.compile(object)
    validate(object)
  } catch (error) {
    return `Schema validation error: ${(error as Error).message}`
  }

  return true
}

const defaultJsonSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#"
}`

interface SchemaFormProps {
  initialData?: InventorySchema // Use the actual Schema type for initial data structure
  onSubmit: SubmitHandler<InventorySchemaFormData> // Use SubmitHandler for type safety
  isUpdating?: boolean
  loading?: boolean
  error?: string | null // Error message for display
}

const InventorySchemaForm: React.FC<SchemaFormProps> = ({
  initialData,
  onSubmit,
  isUpdating = false,
  loading = false,
  error = null,
}) => {
  // Use the SchemaFormData type with useForm
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InventorySchemaFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      schema_definition: initialData?.schema_definition
        ? JSON.stringify(initialData.schema_definition, null, 2)
        : defaultJsonSchema,
    },
  })
  const {
    field: {
      onChange: onSchemaDefinitionChange,
      value: schemaDefinitionValue,
      onBlur: onSchemaDefinitionBlur,
    },
  } = useController({
    name: 'schema_definition',
    control,
    rules: {
      required: 'Schema definition is required.',
      validate: isValidJsonSchema,
    },
  })
  const [fontSize, setFontSize] = useState<string>('14')

  // Reset form if initialData changes (useful for update form)
  useEffect(() => {
    reset({
      name: initialData?.name || '',
      description: initialData?.description || '',
      schema_definition: initialData?.schema_definition
        ? JSON.stringify(initialData.schema_definition, null, 2)
        : defaultJsonSchema,
    })
  }, [initialData, reset])

  // handleSubmit already ensures data matches SchemaFormData type
  const handleFormSubmit: SubmitHandler<InventorySchemaFormData> = (data) => {
    onSubmit(data)
  }

  // Helper to get error message string
  const getErrorMessage = (
    error: FieldError | undefined,
  ): string | undefined => {
    return error?.message
  }

  return (
    // Pass the typed handler to onSubmit
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col xl:flex-row gap-8"
    >
      <div className="space-y-6 xl:w-[360px]">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block da-txt-small font-medium text-da-gray-medium mb-[10px]"
          >
            Schema Name <span className="text-red-500">*</span>
          </label>
          <DaInput
            type="text"
            id="name"
            inputClassName="!px-3"
            {...register('name', {
              required: 'Schema name is required.',
            })}
            disabled={loading}
            aria-invalid={errors.name ? 'true' : 'false'}
          />
          {errors.name && (
            <p className="mt-1 da-txt-small text-red-600" role="alert">
              {getErrorMessage(errors.name)}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="description"
            className="block da-txt-small font-medium text-da-gray-medium mb-[10px]"
          >
            Description
          </label>
          <DaTextarea
            id="description"
            rows={3}
            {...register('description')} // Optional field
            disabled={loading}
          />
        </div>

        <ControlButtons
          className="w-0 h-0 hidden pointer-events-none xl:block xl:w-auto xl:h-auto xl:pointer-events-auto"
          error={error}
          loading={loading}
          isUpdating={isUpdating}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Schema Definition Field (Textarea) */}

        <div className="flex justify-between items-center">
          <label
            htmlFor="schema_definition"
            className="block da-txt-small font-medium text-da-gray-medium mb-1"
          >
            Schema Definition (JSON){' '}
            {!isUpdating && <span className="text-red-500">*</span>}
          </label>
          <DaSelect
            className="h-7 text-xs"
            value={fontSize}
            onValueChange={setFontSize}
          >
            <DaSelectItem className="text-sm" value="10">
              Font size: 10
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="11">
              Font size: 11
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="12">
              Font size: 12
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="13">
              Font size: 13
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="14">
              Font size: 14
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="16">
              Font size: 16
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="18">
              Font size: 18
            </DaSelectItem>
          </DaSelect>
        </div>
        <div className="h-[calc(100vh-320px)] border rounded-md mt-1 p-1">
          <CodeEditor
            language="json"
            fontSize={Number(fontSize)}
            code={schemaDefinitionValue}
            onBlur={onSchemaDefinitionBlur}
            setCode={onSchemaDefinitionChange}
            editable={!loading}
          />
        </div>

        {errors.schema_definition && (
          <p className="mt-1 da-txt-small text-red-600" role="alert">
            {getErrorMessage(errors.schema_definition)}
          </p>
        )}
      </div>

      <ControlButtons
        className="xl:hidden xl:w-0 -mt-4 xl:h-0 xl:pointer-events-none"
        error={error}
        loading={loading}
        isUpdating={isUpdating}
      />
    </form>
  )
}

interface ControlButtonProps {
  error: string | null
  loading?: boolean
  isUpdating?: boolean
  className?: string
}

const ControlButtons = ({
  error,
  loading,
  isUpdating,
  className,
}: ControlButtonProps) => {
  return (
    <div className={className}>
      {/* Global Form Error */}
      {error && (
        <div className="mt-4 text-red-600 text-center" role="alert">
          Error: {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <Link to="/inventory/schema">
          <DaButton variant="outline-nocolor">Cancel</DaButton>
        </Link>
        <DaButton
          type="submit"
          disabled={loading}
          className={clsx(
            'bg-da-primary-500 text-white font-bold py-2 px-4 rounded transition duration-300',
            loading && 'opacity-50 !cursor-not-allowed',
          )}
        >
          {loading ? (
            <span className="flex items-center">
              <TbLoader size={18} className="mr-2 animate-spin" /> Saving...
            </span>
          ) : isUpdating ? (
            'Update Schema'
          ) : (
            'Create Schema'
          )}
        </DaButton>
      </div>
    </div>
  )
}

export default InventorySchemaForm
