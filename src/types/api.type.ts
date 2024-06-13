export type VehicleAPI = {
  name: string
  type: string
  uuid: string
  description: string
  parent: string | null
  isWishlist: boolean
  shortName?: string
}

export type CVI = {
  model_id: string
  cvi: string
  id: string
  created_at: string
}

export type LeafTypes = 'actuator' | 'sensor' | 'attribute' | 'branch'

export type DataTypeNum =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float'
  | 'double'
export type DataTypeString = 'string'
export type DataTypeOther = 'boolean' | 'string[]' | 'uint8[]'
export type DataType = DataTypeNum | DataTypeString | DataTypeOther

interface LeafNode<Type extends LeafTypes> {
  type: Type
  datatype: DataType
  description: string
  uuid: string
  comment?: string
}

interface LeafNodeNum<Type extends LeafTypes> extends LeafNode<Type> {
  datatype: DataTypeNum
  min?: number
  max?: number
  unit?: string
}

interface LeafNodeString<Type extends LeafTypes> extends LeafNode<Type> {
  datatype: DataTypeString
  allowed?: string[]
}

interface LeafNodeOther<Type extends LeafTypes> extends LeafNode<Type> {
  datatype: DataTypeOther
  allowed?: string[]
}

type AnyLeafNode<Type extends LeafTypes> =
  | LeafNodeNum<Type>
  | LeafNodeString<Type>
  | LeafNodeOther<Type>

type Actuator = AnyLeafNode<'actuator'>
type Sensor = AnyLeafNode<'sensor'>
type Attribute = AnyLeafNode<'attribute'> & {
  default?: number | number[] | string | string[]
}

export type LeafNodes = Actuator | Sensor | Attribute
export type AnyNode = Branch | LeafNodes

export interface Branch {
  type: 'branch'
  uuid: string
  description: string
  comment?: string
  children: {
    [key: string]: AnyNode
  }
}
