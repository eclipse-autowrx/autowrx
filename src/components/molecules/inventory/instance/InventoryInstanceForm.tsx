// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import Form from '@rjsf/fluent-ui'
import validator from '@rjsf/validator-ajv8' // Use the AJV8 validator
import { RJSFSchema } from '@rjsf/utils'
import { DaButton } from '@/components/atoms/DaButton'
import { TbLoader } from 'react-icons/tb'
import { DaInput } from '@/components/atoms/DaInput'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IChangeEvent } from '@rjsf/core'
import { InventoryInstanceFormData } from '@/types/inventory.type'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import DaLoading from '@/components/atoms/DaLoading'
import useListInventorySchemas from '@/hooks/useListInventorySchemas'
import DaTooltip from '@/components/atoms/DaTooltip'
import clsx from 'clsx'
import CodeEditor from '../../CodeEditor'

type InventoryInstanceFormProps = {
  initialSchemaId?: string | null
  initialData?: InventoryInstanceFormData
  onSubmit: (schemaId: string, data: InventoryInstanceFormData) => void
  loading?: boolean
  error?: string | null
  onCancel?: () => void
  isUpdating?: boolean
}

const InventoryInstanceForm = ({
  initialSchemaId,
  initialData,
  onSubmit,
  loading,
  error,
  onCancel,
  isUpdating,
}: InventoryInstanceFormProps) => {
  const [formData, setFormData] = useState({})

  const [instanceName, setInstanceName] = useState('')
  const [instanceNameError, setInstanceNameError] = useState('')
  const [schemaError, setSchemaError] = useState('')
  const [triedSubmitting, setTriedSubmitting] = useState(false)

  const [schemaId, setSchemaId] = useState(initialSchemaId || '')
  const { data: schemaList, isLoading } = useListInventorySchemas()
  const schema = schemaList?.results.find((s) => s.id === schemaId)

  const formRef = useRef<any>(null)

  const [dataFillingMode, setDataFillingMode] = useState<'form' | 'code'>(
    'form',
  )
  const [fontSize, setFontSize] = useState<string>('14')
  const [code, setCode] = useState<string>(`{
}`)
  const [codeDataError, setCodeDataError] = useState<string>('')

  useEffect(() => {
    if (initialSchemaId) setSchemaId(initialSchemaId)
  }, [initialSchemaId])

  // Update state with initial data if provided
  useEffect(() => {
    if (initialData) {
      setInstanceName(initialData.name)
      setFormData(initialData.data)
      setCode(JSON.stringify(initialData.data, null, 2))
    }
  }, [initialData])

  const handleSubmitBtnClick = () => {
    setTriedSubmitting(true)
    if (!instanceName) {
      setInstanceNameError('Instance name is required.')
    }
    if (!schema) setSchemaError('Schema is required.')
    else if (dataFillingMode === 'form') {
      formRef.current?.submit()
    } else {
      handleSubmitDataFillingCodeMode()
    }
  }

  const handleSubmitDataFillingFormMode:
    | ((
        data: IChangeEvent<any, RJSFSchema, any>,
        event: React.FormEvent<any>,
      ) => void)
    | undefined = ({ formData }, e) => {
    e.preventDefault()
    if (!schemaId || instanceNameError || schemaError) {
      return
    }

    onSubmit(schemaId, {
      data: formData,
      name: instanceName,
    })
  }

  const handleSubmitDataFillingCodeMode = () => {
    try {
      const parsedJSON = JSON.parse(code)
      onSubmit(schemaId, {
        data: parsedJSON,
        name: instanceName,
      })
    } catch (error) {
      setCodeDataError('Invalid JSON string. Please check your data again.')
    }
  }

  useEffect(() => {
    if (triedSubmitting) {
      setSchemaError(!!schema ? '' : 'Schema is required.')
      setInstanceNameError(instanceName ? '' : 'Instance name is required.')
    }
  }, [triedSubmitting, schema, instanceName])

  const OptionalTooltipWrapper = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (isUpdating) {
        return (
          <DaTooltip content="Updating schema is not allowed.">
            {children}
          </DaTooltip>
        )
      }
      return <>{children}</>
    },
    [isUpdating],
  )

  if (isLoading) {
    return <DaLoading className="h-[calc(100vh-320px)]" />
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      <div className="min-w-[360px]">
        <label
          htmlFor="instance-name"
          className="block da-txt-small font-medium text-da-gray-medium mb-[10px]"
        >
          Instance Name <span className="text-red-500">*</span>
        </label>
        <DaInput
          value={instanceName}
          onChange={(e) => {
            setInstanceName(e.target.value)
          }}
          disabled={loading}
          type="text"
          id="instance-name"
        />

        {instanceNameError && (
          <div className="text-red-600 da-txt-small mt-2">
            {instanceNameError}
          </div>
        )}

        <label
          htmlFor="schema-id"
          className="block da-txt-small font-medium
        text-da-gray-medium mb-[10px] mt-4"
        >
          Schema <span className="text-red-500">*</span>
        </label>
        <OptionalTooltipWrapper>
          <DaSelect
            disabled={isUpdating}
            value={schemaId}
            onValueChange={(value) => setSchemaId(value)}
          >
            {schemaList?.results.map((schema) => (
              <DaSelectItem key={schema.id} value={schema.id}>
                {schema.name}
              </DaSelectItem>
            ))}
          </DaSelect>
        </OptionalTooltipWrapper>

        {schemaError && (
          <div className="text-red-600 da-txt-small mt-2">{schemaError}</div>
        )}
        <div className="border-t mt-4 mb-2" />

        <ControlButtons
          className="w-0 h-0 hidden pointer-events-none xl:block xl:w-auto xl:h-auto xl:pointer-events-auto"
          error={error}
          onCancel={onCancel}
          onSubmit={handleSubmitBtnClick}
          isUpdating={isUpdating}
          loading={loading}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-center mb-1">
          <label
            htmlFor="schema_definition"
            className="block da-txt-small font-medium text-da-gray-medium"
          >
            Data <span className="text-red-500">*</span>
          </label>
          <div className="grow" />
          {dataFillingMode === 'code' && (
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
          )}

          <div className="border flex overflow-hidden rounded-md items-center">
            <button
              onClick={() => setDataFillingMode('form')}
              className={clsx(
                'text-xs px-3 text-da-gray-dark py-[5px]',
                dataFillingMode === 'form'
                  ? 'bg-da-gray-darkest text-white'
                  : '',
              )}
            >
              Form
            </button>
            <button
              onClick={() => setDataFillingMode('code')}
              className={clsx(
                'text-xs px-3 text-da-gray-dark py-[5px]',
                dataFillingMode === 'code'
                  ? 'bg-da-gray-darkest text-white'
                  : '',
              )}
            >
              Code
            </button>
          </div>
        </div>
        <div
          className={clsx(
            'border rounded-md',
            dataFillingMode === 'form'
              ? 'min-h-[calc(100vh-320px)] px-8 pt-4 pb-8'
              : 'h-[calc(100vh-320px)] p-1',
          )}
        >
          {dataFillingMode === 'form' &&
            (schema ? (
              <Form
                ref={formRef}
                autoComplete="off"
                formData={formData}
                schema={schema.schema_definition} // Pass the schema definition
                validator={validator} // Pass the validator instance
                onSubmit={handleSubmitDataFillingFormMode} // Handle form submission
                onChange={({ formData }) => {
                  setFormData(formData)
                }}
                children={true}
                disabled={loading} // Disable form while submitting
              />
            ) : (
              <p>Please choose a schema first.</p>
            ))}
          {dataFillingMode === 'code' && (
            <>
              <CodeEditor
                code={code}
                language="json"
                onBlur={() => {}}
                setCode={setCode}
                editable={!loading}
                fontSize={Number(fontSize)}
              />
            </>
          )}
        </div>
        {dataFillingMode === 'code' && codeDataError && (
          <div className="text-red-600 da-txt-small mt-2">{codeDataError}</div>
        )}
      </div>

      <ControlButtons
        className="xl:hidden xl:w-0 xl:h-0 xl:pointer-events-none"
        error={error}
        onCancel={onCancel}
        onSubmit={handleSubmitBtnClick}
        isUpdating={isUpdating}
        loading={loading}
      />
    </div>
  )
}

interface ControlButtonsProps {
  error?: string | null
  onCancel?: () => void
  onSubmit: () => void
  loading?: boolean
  isUpdating?: boolean
  className?: string
}

const ControlButtons = ({
  error,
  onCancel,
  onSubmit,
  loading,
  isUpdating,
  className,
}: ControlButtonsProps) => {
  return (
    <div className={clsx('mt-16 xl:mt-0', className)}>
      {/* Global Form Error */}
      {error && (
        <div
          className="text-red-600 da-txt-regular mt-2 text-center"
          role="alert"
        >
          Error: {error}
        </div>
      )}
      {/* Custom Submit Button */}
      <div className="mt-6 flex justify-end gap-3">
        <DaButton variant="outline-nocolor" onClick={onCancel}>
          Cancel
        </DaButton>
        <DaButton onClick={onSubmit} disabled={loading}>
          {loading ? (
            <>
              <TbLoader className="mr-1 animate-spin" /> Submitting...
            </>
          ) : isUpdating ? (
            'Update Instance'
          ) : (
            'Create Instance'
          )}
        </DaButton>
      </div>
    </div>
  )
}

export default InventoryInstanceForm
