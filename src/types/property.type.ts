export type Property = {
  name: string
  type: 'string' | 'number' | 'boolean' | 'null'
  value: string
}

export type PropertyType = 'string' | 'number' | 'boolean' | 'null'

export interface CustomPropertyType {
  name: string
  type: PropertyType
  value: string | number | boolean | null
}
