import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Cvi, VehicleApi } from '@/types/model.type'
import { WidgetConfig } from '@/types/widget.type'
import { useEffect } from 'react'
import { VehicleAPI } from '@/types/api.type'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const getApiTypeClasses = (type: string) => {
  switch (type) {
    case 'branch':
      return { bgClass: 'bg-purple-500', textClass: 'text-purple-500' }
    case 'actuator':
      return { bgClass: 'bg-yellow-500', textClass: 'text-yellow-500' }
    case 'sensor':
      return { bgClass: 'bg-emerald-500', textClass: 'text-emerald-500' }
    case 'attribute':
      return { bgClass: 'bg-sky-500', textClass: 'text-sky-500' }
    default:
      return { bgClass: 'bg-da-gray-medium', textClass: 'text-da-gray-medium' }
  }
}

export const parseCvi = (cvi: Cvi) => {
  const traverse = (
    node: VehicleApi,
    prefix: string = 'Vehicle',
  ): VehicleApi[] => {
    let result: VehicleApi[] = []

    result.push({ ...node, name: prefix })

    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        node.children[key].name = newPrefix
        result = result.concat(traverse(child, newPrefix))
      }
    }

    return result
  }

  const mainApi = Object.keys(cvi).at(0) || 'Vehicle'

  return traverse(cvi[mainApi], mainApi)
}

export const parseCvi_alt = (cvi: Cvi): VehicleAPI[] => {
  // console.log('Attemp to parse CVI')
  const traverse = (
    node: VehicleApi,
    prefix: string = 'Vehicle',
    parent: string | null = null, // Track the parent node
  ): VehicleAPI[] => {
    let result: VehicleAPI[] = []

    // Dynamically generate the shortName by removing "Vehicle" from the prefix
    const shortName = prefix.startsWith('Vehicle')
      ? prefix.slice('Vehicle'.length)
      : prefix

    // Construct the VehicleAPI object
    const vehicleAPI: VehicleAPI = {
      name: prefix, // Full name of the API (with prefix)
      type: node.type, // Copy type from VehicleApi
      uuid: node.uuid ?? '', // Ensure uuid is not empty
      description: node.description, // Copy description
      parent: parent, // Assign the parent node
      isWishlist: node.isWishlist ?? false, // Default isWishlist to false if undefined
      shortName: shortName || undefined, // Set the shortName if present, otherwise undefined
    }

    // Push the transformed VehicleAPI object into the result
    result.push(vehicleAPI)

    // Recursively traverse children, setting the current node's name as the new parent
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}` // Update the prefix for the child
        result = result.concat(traverse(child, newPrefix, vehicleAPI.name))
      }
    }
    return result
  }

  // Start the traversal from the root of the CVI tree (cvi.Vehicle)
  return traverse(cvi.Vehicle)
}

export const copyText = async (
  text: string,
  copiedText: string = 'Copied!',
) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {}
}

// Dashboard utils : Checking if the selected cells are continuous rectangle
export const isContinuousRectangle = (pickedCells: number[]): boolean => {
  //
  const numCols = 5
  if (pickedCells.length <= 1) return true // Single cell is always valid
  // Convert cell number to grid position
  const toGridPosition = (cell: number): [number, number] => {
    let row = Math.floor((cell - 1) / numCols)
    let col = (cell - 1) % numCols
    return [row, col]
  }
  // Create a matrix to represent the grid
  let grid = Array(2)
    .fill(null)
    .map(() => Array(5).fill(false))
  // Mark the selected cells in the grid
  pickedCells.forEach((cell) => {
    const [row, col] = toGridPosition(cell)
    grid[row][col] = true
  })
  // Find the bounding box of the selected cells
  let minRow = 2,
    maxRow = -1,
    minCol = 5,
    maxCol = -1
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        minRow = Math.min(minRow, rowIndex)
        maxRow = Math.max(maxRow, rowIndex)
        minCol = Math.min(minCol, colIndex)
        maxCol = Math.max(maxCol, colIndex)
      }
    })
  })
  // Check all cells within the bounding box are selected
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!grid[row][col]) {
        return false // Found a cell in the bounding box that is not selected
      }
    }
  }
  return true // All cells within the bounding box are selected
}

// Dashboard utils : Calculate the rowSpan and colSpan of widget box to merge the cells
export const calculateSpans = (boxes: any) => {
  let minCol = Math.min(...boxes.map((box: any) => ((box - 1) % 5) + 1))
  let maxCol = Math.max(...boxes.map((box: any) => ((box - 1) % 5) + 1))
  let minRow = Math.ceil(Math.min(...boxes) / 5)
  let maxRow = Math.ceil(Math.max(...boxes) / 5)

  let colSpan = maxCol - minCol + 1
  let rowSpan = maxRow - minRow + 1

  return { rowSpan, colSpan }
}

export const doesOverlap = (
  widgetConfigs: WidgetConfig[],
  updatedWidgetConfig: WidgetConfig,
  index: number,
): boolean => {
  const otherWidgets = widgetConfigs.filter((_, idx) => idx !== index)
  const updatedBoxes = new Set(updatedWidgetConfig.boxes)
  for (const widget of otherWidgets) {
    for (const box of widget.boxes) {
      if (updatedBoxes.has(box)) {
        return true
      }
    }
  }
  return false
}

// Handle case when prototype's widget config is an object instead of an array
export const parseWidgetConfig = (configStr: any) => {
  if (!configStr) return []

  try {
    const parsedConfig =
      typeof configStr === 'string' ? JSON.parse(configStr) : configStr
    return Array.isArray(parsedConfig)
      ? parsedConfig
      : parsedConfig.widgets || []
  } catch (e) {
    console.error('Error normalizing widget config:', e)
    return []
  }
}

export const getCSSVariable = (variable: string): string => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
  return value ? `hsl(${value})` : ''
}

export const maskEmail = (email: string) => {
  const [localPart, domainPart] = email.split('@')
  const maskedLocalPart =
    localPart.slice(0, 6).replace(/./g, 'x') + localPart.slice(6)
  return `${maskedLocalPart}@${domainPart}`
}

export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent) => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler])
}

export const filterAndCompareVehicleApis = (
  code: string,
  activeModelApis: any,
) => {
  if (!code) {
    console.log('No code found to analyze.')
    return { apisInCodeOnly: [], apisInModel: [], apisNotInModel: [] }
  }

  // Step 1: Replace all sequences of whitespace with a single space
  code = code.replace(/\s+/g, ' ').trim()

  // Step 2: Use the regex pattern to capture APIs, handling spaces and line breaks
  const vehicleApiPattern = /\bVehicle(?:\s*\.\s*[A-Za-z0-9_]+)+/g

  // Step 3: Capture all matches in the cleaned code
  const vehicleApisInCode = code.match(vehicleApiPattern) || []

  // List of method names and function calls to exclude
  const methodNames = ['get', 'set', 'subscribe', 'set_many', 'add', 'apply']

  // Step 4: Process each captured API
  const processedApis = vehicleApisInCode
    .map((api) => {
      // Remove any spaces within the API string
      let cleanApi = api.replace(/\s+/g, '')

      // Remove any function calls at the end, e.g., .get(), .set(0)
      cleanApi = cleanApi.replace(/\.\w+\([^)]*\)$/g, '')

      // Split the API into parts
      const parts = cleanApi.split('.')

      // Remove any parts that are method names or functions
      const filteredParts = parts.filter((part) => !methodNames.includes(part))

      // Exclude APIs where the second part is a method name (e.g., Vehicle.set_many)
      if (methodNames.includes(filteredParts[1])) {
        return null
      }

      // Reconstruct the API chain
      const reconstructedApi = filteredParts.join('.')

      return reconstructedApi
    })
    .filter((api) => api !== null) // Remove null values from the array

  // Step 5: Remove duplicates
  const normalizedApis = [...new Set(processedApis)]

  // Step 6: Filter out the base "Vehicle" API from the results
  const filteredApis = normalizedApis.filter((api) => api !== 'Vehicle')

  // Step 7: Compare `filteredApis` with `activeModelApis`
  let apisInModel: string[] = []
  let apisNotInModel: string[] = []
  let apisInCodeOnly: string[] = [...filteredApis] as string[]

  filteredApis.forEach((apiUsedInCode) => {
    if (!apiUsedInCode) return
    const foundInModel = activeModelApis.includes(apiUsedInCode)

    if (foundInModel) {
      apisInModel.push(apiUsedInCode)
    } else {
      apisNotInModel.push(apiUsedInCode)
    }
  })

  return {
    apisInCodeOnly: apisInCodeOnly || [], // Fallback to empty array if undefined
    apisInModel: apisInModel || [], // Fallback to empty array
    apisNotInModel: apisNotInModel || [], // Fallback to empty array
  }
}
