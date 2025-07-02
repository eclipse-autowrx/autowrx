// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// flowCells.ts
export interface FlowCell {
  key: string
  title: string
  tooltip?: string
  isSignalFlow?: boolean
  /** The path in the flow data where this cell’s value is stored */
  path: string[]
}

/** Shared flow cell configuration */
export const FLOW_CELLS: FlowCell[] = [
  {
    key: 'smartPhone',
    title: 'Smart Phone',
    path: ['offBoard', 'smartPhone'],
  },
  {
    key: 'p2c',
    title: 'p2c',
    tooltip: 'Phone to Cloud',
    isSignalFlow: true,
    path: ['offBoard', 'p2c'],
  },
  {
    key: 'cloud',
    title: 'Cloud',
    path: ['offBoard', 'cloud'],
  },
  {
    key: 'v2c',
    title: 'v2c',
    tooltip: 'Vehicle to Cloud',
    isSignalFlow: true,
    path: ['v2c'],
  },
  {
    key: 'sdvRuntime',
    title: 'SDV Runtime',
    path: ['onBoard', 'sdvRuntime'],
  },
  {
    key: 's2s',
    title: 's2s',
    tooltip: 'System to System',
    isSignalFlow: true,
    path: ['onBoard', 's2s'],
  },
  {
    key: 'embedded',
    title: 'Embedded',
    path: ['onBoard', 'embedded'],
  },
  {
    key: 's2e',
    title: 's2e',
    tooltip: 'System to ECU',
    isSignalFlow: true,
    path: ['onBoard', 's2e'],
  },
  {
    key: 'sensors',
    title: 'Sensors/Actuators',
    path: ['onBoard', 'sensors'],
  },
]

export const headerGroups = [
  {
    board: 'offBoard',
    label: 'Off-board',
    cells: FLOW_CELLS.filter((cell) => cell.path[0] === 'offBoard'),
  },
  {
    board: 'v2c',
    label: '', // v2c will be rendered in the second header row
    cells: FLOW_CELLS.filter((cell) => cell.path[0] === 'v2c'),
  },
  {
    board: 'onBoard',
    label: 'On-board',
    cells: FLOW_CELLS.filter((cell) => cell.path[0] === 'onBoard'),
  },
]

/** Helper to get a nested value from an object using the given path */
export const getNestedValue = (obj: any, path: string[]) =>
  path.reduce((acc, key) => acc?.[key], obj)

/** Helper to set a nested value in an object using the given path.
 * Returns a new updated object.
 */
export const setNestedValue = (obj: any, path: string[], value: any) => {
  const newObj = { ...obj }
  let current = newObj
  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] = { ...current[path[i]] }
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
  return newObj
}

export const createEmptyFlow = () => ({
  offBoard: {
    smartPhone: '',
    p2c: null,
    cloud: '',
  },
  v2c: null,
  onBoard: {
    sdvRuntime: '',
    s2s: null,
    embedded: '',
    s2e: null,
    sensors: '',
  },
})
