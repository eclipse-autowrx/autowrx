import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import DaText from '@/components/atoms/DaText'
import { VehicleApi } from '@/types/model.type'
import Ajv, { JSONSchemaType } from 'ajv'
import { useEffect, useState } from 'react'

const ajv = new Ajv()

interface InterfaceDetail {
  name?: string
  type?: string
  datatype?: string
  uuid?: string
  allowed?: string[]
  comment?: string
  unit?: string
  max?: number
  min?: number
  shortName?: string
  isWishlist?: boolean
  asilLevel?: string
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
    type: { nullable: true, type: 'string' },
    datatype: { nullable: true, type: 'string' },
    uuid: { nullable: true, type: 'string' },
    allowed: {
      nullable: true,
      type: 'array',
      items: { type: 'string' },
    },
    comment: { nullable: true, type: 'string' },
    unit: { nullable: true, type: 'string' },
    max: { nullable: true, type: 'number' },
    min: { nullable: true, type: 'number' },
    shortName: { nullable: true, type: 'string' },
    isWishlist: { nullable: true, type: 'boolean' },
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
  description?: string
  details?:
    | {
        reference: {
          type: string
          id: string
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
    description: {
      type: 'string',
      nullable: true,
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
  description?: string
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
    description: { type: 'string', nullable: true },
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
  const [inventoryType, setInventoryType] = useState<string>('system_interface')
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
    setInventoryType(value)
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

  return (
    <form>
      <div>
        <DaText variant="sub-title" className="text-da-primary-500">
          New Inventory Item
        </DaText>
      </div>
      <div className="mt-2">
        <DaText variant="small-bold" className="!text-gray-500">
          Type
        </DaText>
        <DaSelect
          value={inventoryType}
          onValueChange={handleInventoryTypeChange}
          className="mt-1 text-sm text-da-gray-dark"
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
      <div>
        {currentSchema && (
          <>
            {Object.entries(currentSchema.properties).map(([key, value]) => {
              return null
            })}
          </>
        )}
      </div>
    </form>
  )
}

export default FormInventoryItem
