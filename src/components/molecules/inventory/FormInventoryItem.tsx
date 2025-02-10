import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import DaText from '@/components/atoms/DaText'
import Ajv, { JSONSchemaType } from 'ajv'
import { useEffect, useState } from 'react'
import SystemInterfaceFields from './SystemInterfaceFields'
import { DaButton } from '@/components/atoms/DaButton'

const ajv = new Ajv()

interface InterfaceDetail {
  name?: string
  description?: string
  type?: string
  datatype?: string
  asilLevel?: string
  allowed?: string[]
  unit?: string
  max?: number
  min?: number
  direction?: string
  component?: string
  owner?: string
  version?: string
  date?: string
  link?: string
  threshold?: number
}

const interfaceDetailSchema: JSONSchemaType<InterfaceDetail> = {
  type: 'object',
  properties: {
    name: { nullable: true, type: 'string' },
    description: { nullable: true, type: 'string' },
    type: { nullable: true, type: 'string' },
    datatype: { nullable: true, type: 'string' },
    allowed: {
      nullable: true,
      type: 'array',
      items: { type: 'string' },
    },
    unit: { nullable: true, type: 'string' },
    max: { nullable: true, type: 'number' },
    min: { nullable: true, type: 'number' },
    direction: { nullable: true, type: 'string' },
    asilLevel: { nullable: true, type: 'string' },
    component: { nullable: true, type: 'string' },
    owner: { nullable: true, type: 'string' },
    version: { nullable: true, type: 'string' },
    date: { nullable: true, type: 'string' },
    link: { nullable: true, type: 'string' },
    threshold: { nullable: true, type: 'number' },
  },
  additionalProperties: true,
}

interface SystemInterface {
  type: string
  details?:
    | {
        reference: {
          type: string
          model?: string
          apiName?: string
        }
      }
    | InterfaceDetail
}

const systemInterfaceSchema: JSONSchemaType<SystemInterface> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
    },
    details: {
      type: 'object',
      nullable: true,
      oneOf: [
        {
          type: 'object',
          properties: {
            reference: {
              type: 'string',
              model: { type: 'string', nullable: true },
              apiName: { type: 'string', nullable: true },
            },
          },
          required: ['reference'],
          additionalProperties: false,
        },
        {
          type: 'object',
          $ref: 'interface_detail',
        },
      ],
    },
  },
  required: ['type'],
}

interface SystemActivity {
  description: string
  asilRating?: string
  type?: string
  component?: string
  owner?: string
  version?: string
  date?: string
  link?: string
  threshold?: number
  direction?: string
}

const systemActivitySchema: JSONSchemaType<SystemActivity> = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    asilRating: { type: 'string', nullable: true },
    type: { type: 'string', nullable: true },
    component: { type: 'string', nullable: true },
    owner: { type: 'string', nullable: true },
    version: { type: 'string', nullable: true },
    date: { type: 'string', nullable: true },
    link: { type: 'string', nullable: true },
    threshold: { type: 'number', nullable: true },
    direction: { type: 'string', nullable: true },
  },
  required: ['description'],
  additionalProperties: true,
}

// Detach Column and Row for better readability
interface Column {
  span?: number
  content: string
  helperText?: string
  style?: any
}

interface Row extends Array<Column> {}

interface FlowHeaders {
  horizontalCellsCount: number
  rows: Row[]
}

const flowHeadersSchema = {
  type: 'object',
  definitions: {
    column: {
      type: 'object',
      required: ['content'],
      properties: {
        span: { type: 'number', nullable: true },
        content: { type: 'string' },
        helperText: { type: 'string', nullable: true },
        style: { type: 'object', nullable: true },
      },
      additionalProperties: true,
    },
    row: {
      type: 'array',
      items: {
        $ref: '#/definitions/column',
      },
    },
  },
  properties: {
    horizontalCellsCount: { type: 'number' },
    rows: {
      type: 'array',
      items: {
        $ref: '#/definitions/row',
      },
    },
  },
  required: ['horizontalCellsCount', 'rows'],
  additionalProperties: true,
}

type FormInventoryItemProps = {
  type: 'create' | 'update'
}

const FormInventoryItem = ({ type }: FormInventoryItemProps) => {
  const [data, setData] = useState({
    inventoryType: 'system_interface',
  })
  const [currentSchema, setCurrentSchema] = useState<
    JSONSchemaType<SystemInterface | SystemActivity | FlowHeaders>
  >(systemInterfaceSchema)

  useEffect(() => {
    try {
      ajv.addSchema(interfaceDetailSchema, 'interface_detail')
    } catch (error) {}
    try {
      ajv.addSchema(systemActivitySchema, 'system_activity')
    } catch (error) {}
    try {
      ajv.addSchema(flowHeadersSchema, 'flow_headers')
    } catch (error) {}
    try {
      ajv.addSchema(systemInterfaceSchema, 'system_interface')
    } catch (error) {}
  }, [])

  const handleInventoryTypeChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      inventoryType: value,
    }))
    switch (value) {
      case 'system_interface':
        setCurrentSchema(systemInterfaceSchema)
        break
      case 'system_activity':
        setCurrentSchema(systemActivitySchema)
        break
      case 'flow_headers':
        setCurrentSchema(
          flowHeadersSchema as unknown as JSONSchemaType<FlowHeaders>,
        )
        break
    }
  }

  const getUIFields = (
    schema: 'system_interface' | 'system_activity' | 'flow_headers',
  ) => {
    switch (schema) {
      case 'system_interface':
        return <SystemInterfaceFields />
      default:
        return null
    }
  }

  return (
    <form className="w-[600px]">
      <div>
        <DaText variant="huge-bold" className="text-da-primary-500">
          New Inventory Item
        </DaText>
      </div>

      <div className="mt-5">
        <DaText variant="small-bold" className="!text-da-gray-darkest">
          Name *
        </DaText>
        <DaInput
          className="mt-1"
          wrapperClassName="h-8 shadow"
          inputClassName="text-sm h-6 text-da-gray-darkest"
          placeholder="Inventory Item Name"
        />
      </div>

      <div className="mt-3">
        <DaText variant="small-bold" className="!text-da-gray-darkest">
          Type *
        </DaText>
        <DaSelect
          value={data.inventoryType}
          onValueChange={handleInventoryTypeChange}
          className="mt-1 h-8 text-sm !shadow text-da-gray-darkest"
        >
          <DaSelectItem className="text-sm" value="system_interface">
            System Interface
          </DaSelectItem>
          <DaSelectItem className="text-sm" value="system_activity">
            System Activity
          </DaSelectItem>
          <DaSelectItem className="text-sm" value="flow_headers">
            Flow Headers
          </DaSelectItem>
        </DaSelect>
      </div>

      <div className="border-t mt-6" />

      <div className="mt-6 border rounded-md px-5 py-6 text-sm gap-3 text-da-gray-darkest relative">
        <DaText
          variant="small-bold"
          className="absolute !text-da-gray-darkest left-4 bg-white px-1 -top-3"
        >
          Inventory Details
        </DaText>
        {getUIFields(data.inventoryType as any)}
      </div>

      <div>
        {currentSchema && (
          <>
            {Object.entries(currentSchema.properties).map(([key, value]) => {
              return null
            })}
          </>
        )}
      </div>

      <DaButton disabled size="sm" className="w-full mt-10">
        Create
      </DaButton>
    </form>
  )
}

export default FormInventoryItem
