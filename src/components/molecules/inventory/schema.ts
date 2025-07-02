// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { JSONSchemaType } from 'ajv'

export interface InterfaceDetail {
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

export const interfaceDetailSchema: JSONSchemaType<InterfaceDetail> = {
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

export interface SystemInterface {
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

export const systemInterfaceSchema: JSONSchemaType<SystemInterface> = {
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

export interface SystemActivity {
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

export const systemActivitySchema: JSONSchemaType<SystemActivity> = {
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

export interface FlowHeaders {
  horizontalCellsCount: number
  rows: Row[]
}

export const flowHeadersSchema = {
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
