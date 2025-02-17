import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import DaText from '@/components/atoms/DaText'
import DaTooltip from '@/components/atoms/DaTooltip'
import clsx from 'clsx'
import { useState } from 'react'
import {
  TbCheck,
  TbChevronDown,
  TbCircle,
  TbCircleDotFilled,
  TbLoader,
  TbX,
} from 'react-icons/tb'
import { DaTableProperty } from '../DaTableProperty'
import { getApiDetailService } from '@/services/model.service'
import { isAxiosError } from 'axios'
import { InterfaceDetail } from './schema'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'

const keyNames: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  type: 'Interface Type',
  datatype: 'Data Type',
  asilLevel: 'ASIL Level',
  allowed: 'Allowed',
  unit: 'Unit',
  max: 'Max',
  min: 'Min',
  threshold: 'Threshold',
  direction: 'Direction',
  component: 'Component',
  owner: 'Owner',
  version: 'Version',
  date: 'Date',
  link: 'Link',
}

type SystemInterfaceFieldsProps = {
  onChange?: (data: any) => void
  onSummaryChange?: (callback: (prev: any) => any) => void
}

const SystemInterfaceFields = ({ onChange }: SystemInterfaceFieldsProps) => {
  const [type, setType] = useState<'reference' | 'manual'>('reference')

  return (
    <div>
      <DaText variant="small-bold" className="!text-da-gray-darkest">
        Choose how to add interface data
      </DaText>
      <div className="flex gap-3 mt-1">
        <button
          onClick={() => setType('reference')}
          type="button"
          className={clsx(
            'py-[10px] px-3 flex items-center shadow-sm border rounded-md gap-2 flex-1',
            type === 'reference' &&
              'border-da-primary-500 text-da-gray-darkest',
          )}
        >
          {type === 'reference' ? (
            <TbCircleDotFilled className="w-5 h-5 text-da-primary-500" />
          ) : (
            <TbCircle className="w-5 h-5 text-da-primary-500" />
          )}
          Reference from Vehicle Signal
        </button>
        <button
          onClick={() => setType('manual')}
          type="button"
          className={clsx(
            'py-[10px] px-3 flex items-center shadow-sm border rounded-md gap-2 flex-1',
            type === 'manual' && 'border-da-primary-500 text-da-gray-darkest',
          )}
        >
          {type === 'manual' ? (
            <TbCircleDotFilled className="w-5 h-5 text-da-primary-500" />
          ) : (
            <TbCircle className="w-5 h-5 text-da-primary-500" />
          )}
          Enter interface data manually
        </button>
      </div>

      {/* Type Reference */}
      {type === 'reference' && <ReferenceFields onChange={onChange} />}

      {/* Type Manual */}
      {type === 'manual' && <ManualFields onChange={onChange} />}
    </div>
  )
}

type ReferenceFieldsProps = {
  onChange?: (data: any) => void
}

const ReferenceFields = ({ onChange }: ReferenceFieldsProps) => {
  const [link, setLink] = useState('')
  const [referenceData, setReferenceData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [warning, setWarning] = useState<string>('')

  const checkReference = async (link: string) => {
    try {
      // Reset states
      setLoading(true)
      setError('')
      setWarning('')
      setReferenceData(null)
      onChange?.(null)

      // Extract modelId and apiName from reference link
      const regex = /\/model\/([a-zA-Z0-9]+)\/api\/(.+)/
      const [, modelId, apiName] = link.match(regex) || []
      const response = await getApiDetailService(modelId, apiName)
      setReferenceData(response)
      onChange?.(response)

      // Check unknown keys and set warning
      const unknownKeys = Object.keys(response).filter(
        (key) => !(key in keyNames),
      )
      if (unknownKeys.length > 0) {
        setWarning(
          `Unknown keys: ${unknownKeys.join(', ')}. Please check the reference data or update JSON Schema to remove this warning.`,
        )
      }
    } catch (error) {
      console.error(error)
      if (isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            error.message ||
            'Failed to fetch reference data. Please check your link.',
        )
      } else {
        setError(
          (error as any)?.message ||
            'Failed to fetch reference data. Please check your link.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <DaText variant="small-bold" className="!text-da-gray-darkest">
        Link to Vehicle Signal
      </DaText>
      <div className="flex gap-3 mt-1">
        <DaInput
          className="flex-1"
          placeholder={`${location.origin}/model/<model_id>/api/<api>`}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          inputClassName="text-sm   flex-1 text-da-gray-darkest"
        />
        <DaTooltip content="Check reference">
          <DaButton
            onClick={() => checkReference(link)}
            type="button"
            variant="outline-nocolor"
            disabled={loading}
            className="h-10 !px-3 !text-sm !shadow-sm !text-da-gray-darkest"
          >
            {loading ? (
              <TbLoader className="animate-spin w-4 h-4 mr-1" />
            ) : (
              <TbCheck className="w-4 h-4 mr-1" />
            )}{' '}
            Check
          </DaButton>
        </DaTooltip>
      </div>

      <DaText className="block !text-xs mt-1 !text-da-gray-dark">
        The Vehicle Signal link must be valid and accessible to you.
      </DaText>

      {referenceData && (
        <div className="border overflow-hidden rounded-md mt-3">
          <div className="w-full h-10 bg-da-primary-100 flex items-center pl-3">
            <div className="flex-1 truncate">
              <DaTooltip content="Vehicle.ADAS.CruiseControl.IsEnabled">
                <DaText variant="small-bold" className="text-da-primary-500">
                  Vehicle.ADAS.CruiseControl.IsEnabled
                </DaText>
              </DaTooltip>
            </div>
            <DaButton
              type="button"
              onClick={() => setReferenceData(null)}
              variant="plain"
              className="!p-3"
            >
              <TbX className="w-5 h-5" />
            </DaButton>
          </div>

          <div className="px-3 pb-3 pt-4">
            <DaText variant="small-bold" className="text-da-secondary-500">
              VSS Specification
            </DaText>

            <DaTableProperty
              properties={Object.entries(referenceData).reduce(
                (acc, cur) => {
                  const [key, value] = cur
                  if (key in keyNames) {
                    acc.push({
                      name: keyNames[key],
                      value: value as string,
                    })
                  }
                  return acc
                },
                [] as { name: string; value: string }[],
              )}
            />
          </div>
        </div>
      )}

      {error && <DaText className="!text-xs text-red-500">{error}</DaText>}

      {warning && (
        <DaText className="!text-xs text-da-secondary-500">{warning}</DaText>
      )}
    </div>
  )
}

type ManualFieldsProps = {
  onChange?: (data: any) => void
}

const defaultManualData = {
  name: '',
  description: '',
}

const ManualFields = ({ onChange }: ManualFieldsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [innerData, setInnerData] = useState<InterfaceDetail>(defaultManualData)

  const handleChange = (key: keyof InterfaceDetail, value: any) => {
    setInnerData((prev) => ({
      ...prev,
      [key]: value,
    }))
    onChange?.({
      ...innerData,
      [key]: value,
    })
  }

  const handleInputChange =
    (key: keyof InterfaceDetail) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(key, e.target.value)
    }

  const handleAllowedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value?.split(',').map((v) => v.trim()) || []
    handleChange('allowed', values)
  }

  return (
    <div className="h-fit">
      <div className="mt-3">
        <DaText variant="small-bold" className="!text-da-gray-darkest">
          Interface Name *
        </DaText>
        <DaInput
          value={innerData.name}
          onChange={handleInputChange('name')}
          className="mt-1"
          inputClassName="text-sm text-da-gray-darkest"
          placeholder="Interface Name"
        />
      </div>
      <div className="mt-3">
        <DaText variant="small-bold" className="!text-da-gray-darkest">
          Interface Description
        </DaText>
        <DaInput
          value={innerData.description}
          onChange={handleInputChange('description')}
          className="mt-1"
          inputClassName="text-sm text-da-gray-darkest"
          placeholder="Interface Description"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="mt-3 text-da-primary-500 w-full flex items-center gap-1"
      >
        <DaText variant="small-bold">
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </DaText>
        <TbChevronDown
          className={clsx('w-4 h-4 transition', showAdvanced && 'rotate-180')}
        />
        <span className="border-t border-t-da-gray-light flex-1" />
      </button>

      {showAdvanced && (
        <>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Interface Type
            </DaText>
            <DaSelect
              value={innerData.type || ''}
              onValueChange={(value) =>
                handleChange('type', value === 'none' ? undefined : value)
              }
            >
              <DaSelectItem className="text-sm" value="none">
                None
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="branch">
                Branch
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="sensor">
                Sensor
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="actuator">
                Actuator
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="attribute">
                Attribute
              </DaSelectItem>
            </DaSelect>
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Data Type
            </DaText>
            <DaInput
              value={innerData.datatype}
              onChange={handleInputChange('datatype')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="eg. string"
            />
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              ASIL Level
            </DaText>
            <DaSelect
              value={innerData.asilLevel || ''}
              onValueChange={(value) =>
                handleChange('asilLevel', value === 'none' ? undefined : value)
              }
            >
              <DaSelectItem className="text-sm" value="none">
                None
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="a">
                A
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="b">
                B
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="c">
                C
              </DaSelectItem>
              <DaSelectItem className="text-sm" value="d">
                D
              </DaSelectItem>
            </DaSelect>
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Allowed
            </DaText>
            <DaInput
              value={innerData.allowed?.join(',')}
              onChange={handleAllowedChange}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="eg. ACTIVE, INACTIVE"
            />
            <DaText className="block !text-xs mt-1 !text-da-gray-dark">
              Allowed values for the data type. Separate multiple values with
              comma.
            </DaText>
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            <div className="mt-3">
              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Unit
              </DaText>
              <DaInput
                value={innerData.unit}
                onChange={handleInputChange('unit')}
                className="mt-1"
                inputClassName="text-sm text-da-gray-darkest"
                placeholder="eg. km/h, m/s"
              />
            </div>
            <div className="mt-3">
              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Threshold
              </DaText>
              <DaInput
                value={innerData.threshold}
                onChange={handleInputChange('threshold')}
                className="mt-1"
                inputClassName="text-sm text-da-gray-darkest"
                placeholder="Threshold value"
              />
            </div>
            <div className="mt-3">
              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Max
              </DaText>
              <DaInput
                value={innerData.max}
                onChange={handleInputChange('max')}
                className="mt-1"
                inputClassName="text-sm text-da-gray-darkest"
                placeholder="Max value"
              />
            </div>
            <div className="mt-3">
              <DaText variant="small-bold" className="!text-da-gray-darkest">
                Min
              </DaText>
              <DaInput
                value={innerData.min}
                onChange={handleInputChange('min')}
                className="mt-1"
                inputClassName="text-sm text-da-gray-darkest"
                placeholder="Min value"
              />
            </div>
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Direction
            </DaText>
            <DaInput
              value={innerData.direction}
              onChange={handleInputChange('direction')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="eg. Right"
            />
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Component
            </DaText>
            <DaInput
              value={innerData.component}
              onChange={handleInputChange('component')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="Component"
            />
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Owner
            </DaText>
            <DaInput
              value={innerData.owner}
              onChange={handleInputChange('owner')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="Owner"
            />
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Version
            </DaText>
            <DaInput
              value={innerData.version}
              onChange={handleInputChange('version')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="Version"
            />
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Date
            </DaText>
            <DaInput
              value={innerData.date}
              onChange={handleInputChange('date')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div className="mt-3">
            <DaText variant="small-bold" className="!text-da-gray-darkest">
              Link
            </DaText>
            <DaInput
              value={innerData.link}
              onChange={handleInputChange('link')}
              className="mt-1"
              inputClassName="text-sm text-da-gray-darkest"
              placeholder="Link"
            />
          </div>
        </>
      )}
    </div>
  )
}

export default SystemInterfaceFields
