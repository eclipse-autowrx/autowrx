import { useForm, SubmitHandler, FieldError } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type {
  InventorySchema,
  InventorySchemaFormData,
} from '@/types/inventory.type'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { DaButton } from '@/components/atoms/DaButton'
import { useEffect, useMemo } from 'react'
import Ajv from 'ajv'
import clsx from 'clsx'
import { TbLoader } from 'react-icons/tb'

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
    ajv.validateSchema(object)
    if (ajv.errors) {
      return ajv.errorsText()
    }
  } catch (error) {
    return 'Unexpected error occurred while validating schema.'
  }

  return true
}

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
    formState: { errors },
    reset,
  } = useForm<InventorySchemaFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      schema_definition: initialData?.schema_definition
        ? JSON.stringify(initialData.schema_definition, null, 2)
        : '',
    },
  })

  // Reset form if initialData changes (useful for update form)
  useEffect(() => {
    reset({
      name: initialData?.name || '',
      description: initialData?.description || '',
      schema_definition: initialData?.schema_definition
        ? JSON.stringify(initialData.schema_definition, null, 2)
        : '',
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block da-txt-small font-medium text-da-gray-medium mb-1"
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
          className="block da-txt-small font-medium text-da-gray-medium mb-1"
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

      {/* Schema Definition Field (Textarea) */}
      <div>
        <label
          htmlFor="schema_definition"
          className="block da-txt-small font-medium text-da-gray-medium mb-1"
        >
          Schema Definition (JSON){' '}
          {!isUpdating && <span className="text-red-500">*</span>}
        </label>
        <DaTextarea
          id="schema_definition"
          rows={10}
          {...register('schema_definition', {
            required: 'Schema definition is required.',
            validate: isValidJsonSchema, // Custom validation for JSON format
          })}
          placeholder='{&#10;  "type": "object",&#10;  "properties": {&#10;    "fieldName": { "type": "string" }&#10;  },&#10;  "required": ["fieldName"]&#10;}'
          disabled={loading}
          aria-invalid={errors.schema_definition ? 'true' : 'false'}
        />
        {errors.schema_definition && (
          <p className="mt-1 da-txt-small text-red-600" role="alert">
            {getErrorMessage(errors.schema_definition)}
          </p>
        )}
      </div>

      {/* Global Form Error */}
      {error && (
        <div className="mt-4 text-red-600 text-center" role="alert">
          Error: {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <Link to="/inventory/schemas">
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
    </form>
  )
}

export default InventorySchemaForm
