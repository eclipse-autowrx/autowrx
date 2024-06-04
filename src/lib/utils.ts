import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Cvi, VehicleApi } from '@/types/model.type'

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
  ): { api: string; type: string; details: VehicleApi }[] => {
    let result: { api: string; type: string; details: VehicleApi }[] = []
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        node.children[key].api = newPrefix
        result.push({ api: newPrefix, type: child.type, details: child })
        result = result.concat(traverse(child, newPrefix))
      }
    }
    return result
  }
  return traverse(cvi.Vehicle)
}

export const copyText = async (text: string, copiedText: string = "Copied!") => {
  try {
      await navigator.clipboard.writeText(text);
      console.log(copiedText);
  } catch (error) {
    console.log(`Error occured while copying to clipboard. ${error}`);
  }
};

export const isContinuousRectangle = (pickedCells: number[]): boolean => {
  // console.log("pickedCells", pickedCells);
  const numCols = 5;
  if (pickedCells.length <= 1) return true; // Single cell is always valid
  // Convert cell number to grid position
  const toGridPosition = (cell: number): [number, number] => {
      let row = Math.floor((cell - 1) / numCols);
      let col = (cell - 1) % numCols;
      return [row, col];
  };
  // Create a matrix to represent the grid
  let grid = Array(2)
      .fill(null)
      .map(() => Array(5).fill(false));
  // Mark the selected cells in the grid
  pickedCells.forEach((cell) => {
      const [row, col] = toGridPosition(cell);
      grid[row][col] = true;
  });
  // Find the bounding box of the selected cells
  let minRow = 2,
      maxRow = -1,
      minCol = 5,
      maxCol = -1;
  grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
          if (cell) {
              minRow = Math.min(minRow, rowIndex);
              maxRow = Math.max(maxRow, rowIndex);
              minCol = Math.min(minCol, colIndex);
              maxCol = Math.max(maxCol, colIndex);
          }
      });
  });
  // Check all cells within the bounding box are selected
  for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
          if (!grid[row][col]) {
              return false; // Found a cell in the bounding box that is not selected
          }
      }
  }
  return true; // All cells within the bounding box are selected
};

