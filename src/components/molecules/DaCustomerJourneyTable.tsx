import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  TbX,
  TbColumnInsertLeft,
  TbRowInsertTop,
  TbChevronCompactRight,
} from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import { debounce } from 'lodash'

interface DaTableEditorProps {
  defaultValue?: string
  onChange: (data: string) => void
  isEditing: boolean
}

const DaTableEditor = ({
  defaultValue,
  onChange,
  isEditing,
}: DaTableEditorProps) => {
  const [tableData, setTableData] = useState<any[]>([])
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(
    null,
  )
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)
  const [editingColumnHeader, setEditingColumnHeader] = useState<number | null>(
    null,
  )
  const [editingRowHeader, setEditingRowHeader] = useState<number | null>(null)
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  const isValidHeader = (header: string) => {
    // Only check if it's not empty and doesn't start with a number
    const hasContent = header.trim().length > 0
    const startsWithNumeric = /^\d/.test(header)
    return hasContent && !startsWithNumeric
  }
  const [internalValue, setInternalValue] = useState(defaultValue)

  useEffect(() => {
    if (!internalValue || internalValue.length < 10) {
      setColumnNames(['Step 1', 'Step 2', 'Step 3'])
      setTableData([
        { rowName: 'Who', 'Step 1': '', 'Step 2': '', 'Step 3': '' },
        { rowName: 'What', 'Step 1': '', 'Step 2': '', 'Step 3': '' },
        {
          rowName: 'Customer TouchPoints',
          'Step 1': '',
          'Step 2': '',
          'Step 3': '',
        },
      ])
    } else {
      setTableData(parseTableData(internalValue))
      setColumnNames(getTableColumns(internalValue))
    }
  }, [])

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChange(value)
    }, 300),
    [onChange],
  )

  const updateParent = (newTableData: any[], newColumnNames: string[]) => {
    const formattedTable: string[] = []
    newColumnNames.forEach((columnName) => {
      formattedTable.push(`#${columnName}`)
      newTableData.forEach((row) => {
        const rowName = row.rowName
        const cellValue = row[columnName] !== undefined ? row[columnName] : ''
        formattedTable.push(`${rowName}: ${cellValue}`)
      })
    })
    const tableString = formattedTable.join('\n')
    setInternalValue(tableString) // Update internal state immediately
    debouncedOnChange(tableString) // Debounced update to parent
  }

  const addRow = () => {
    const newRow: { rowName: string; [key: string]: string } = { rowName: '' }
    columnNames.forEach((columnName) => {
      newRow[columnName] = ''
    })
    const newData = [...tableData, newRow]
    setTableData(newData)
    updateParent(newData, columnNames)
  }

  const addColumn = () => {
    const newColumnName = ''
    const newData = tableData.map((row) => {
      const newRow = { ...row }
      newRow[newColumnName] = ''
      return newRow
    })
    const newColumnNames = [...columnNames, newColumnName]
    setTableData(newData)
    setColumnNames(newColumnNames)
    updateParent(newData, newColumnNames)
  }

  const deleteRow = (rowIndex: number) => {
    const newData = [...tableData]
    newData.splice(rowIndex, 1)
    setTableData(newData)
    updateParent(newData, columnNames)
  }

  const deleteColumn = (columnIndex: number) => {
    const newData = tableData.map((row) => {
      const newRow = { ...row }
      delete newRow[columnNames[columnIndex]]
      return newRow
    })
    const newColumnNames = [...columnNames]
    newColumnNames.splice(columnIndex, 1)
    setTableData(newData)
    setColumnNames(newColumnNames)
    updateParent(newData, newColumnNames)
  }

  const handleCellChange = (
    rowIndex: number,
    columnName: string,
    value: string,
  ) => {
    const newData = [...tableData]
    newData[rowIndex][columnName] = value
    setTableData(newData)
    updateParent(newData, columnNames)
  }

  useEffect(() => {
    const errors: string[] = []
    const uniqueColumnNames = new Set(columnNames)
    const noDuplicateColumnNames = uniqueColumnNames.size === columnNames.length
    const rowNames = tableData.map((row) => row.rowName)
    const uniqueRowNames = new Set(rowNames)
    const noDuplicateRowNames = uniqueRowNames.size === rowNames.length

    if (
      columnNames.some((name) => name === '') ||
      tableData.some((row) => row.rowName === '')
    ) {
      errors.push("Headers shouldn't be blank")
    }
    if (!noDuplicateRowNames || !noDuplicateColumnNames) {
      errors.push('Headers must be unique')
    }
    if (
      columnNames.some((name) => /^\d/.test(name)) ||
      tableData.some((row) => /^\d/.test(row.rowName))
    ) {
      errors.push("Headers shouldn't start with numbers")
    }
  }, [tableData, columnNames])

  const columnColors = [
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
    'hsl(var(--da-primary-500))',
  ]

  useEffect(() => {
    const adjustTextareaHeights = () => {
      textareaRefs.current.forEach((textareaRef) => {
        if (textareaRef) {
          textareaRef.style.height = 'auto'
          textareaRef.style.height = `${textareaRef.scrollHeight}px`
        }
      })
    }

    adjustTextareaHeights()

    window.addEventListener('resize', adjustTextareaHeights)
    return () => {
      window.removeEventListener('resize', adjustTextareaHeights)
    }
  }, [tableData])

  return (
    <div className="flex w-full h-full justify-center items-center relative">
      <div className="flex w-fit h-full relative">
        <div className="flex-grow text-sm">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2"></th>
                {columnNames.map((columnName, columnIndex) => (
                  <th
                    key={columnIndex}
                    className="border w-[18rem] px-2 h-[4rem] text-white relative border-da-primary-500"
                    style={{ backgroundColor: columnColors[columnIndex] }}
                    onMouseEnter={() => setHoveredColumnIndex(columnIndex)}
                    onMouseLeave={() => setHoveredColumnIndex(null)}
                    onClick={() =>
                      isEditing && setEditingColumnHeader(columnIndex)
                    }
                  >
                    {/* Divider and Arrow */}
                    {columnIndex > 0 && (
                      <div className="absolute top-0 left-0 h-full aspect-square transform -translate-x-1/2">
                        <TbChevronCompactRight className="h-full w-full text-white bg-transparent stroke-[0.5] scale-150 ml-1" />
                      </div>
                    )}

                    {/* Column Content */}
                    <div className="relative mx-2 group h-full flex items-center justify-center z-10">
                      {editingColumnHeader === columnIndex ? (
                        <input
                          type="textarea"
                          className="w-full bg-transparent outline-none mx-4"
                          value={columnNames[columnIndex]}
                          onChange={(e) => {
                            const newColumnName = e.target.value
                            const oldColumnName = columnNames[columnIndex]

                            const updatedColumnNames = [...columnNames]
                            updatedColumnNames[columnIndex] = newColumnName
                            setColumnNames(updatedColumnNames)

                            const newData = tableData.map((row) => {
                              if (row.hasOwnProperty(oldColumnName)) {
                                row[newColumnName] = row[oldColumnName]
                                delete row[oldColumnName]
                              }
                              return row
                            })
                            setTableData(newData)
                            updateParent(newData, updatedColumnNames)
                          }}
                          onBlur={() => setEditingColumnHeader(null)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onMouseMove={(e) => e.stopPropagation()}
                        />
                      ) : (
                        columnName
                      )}
                      {hoveredColumnIndex !== null &&
                        hoveredColumnIndex === columnIndex &&
                        isEditing && (
                          <DaButton
                            className="m-1 !text-da-gray-dark !p-0 !w-6 !h-6 rounded absolute top-0 -right-4 bg-da-white hover:bg-da-white hover:!text-red-500 z-10 opacity-0 group-hover:opacity-100"
                            variant="outline"
                            onClick={() => deleteColumn(columnIndex)}
                            size="sm"
                          >
                            <TbX className="w-4 h-4" />
                          </DaButton>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td
                    className="border h-full w-36 px-2 py-2 relative font-bold text-gray-700"
                    onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                    onClick={() => isEditing && setEditingRowHeader(rowIndex)}
                  >
                    {editingRowHeader === rowIndex ? (
                      <input
                        className="w-full h-full outline-none"
                        value={row.rowName}
                        onChange={(e) => {
                          const updatedTableData = [...tableData]
                          updatedTableData[rowIndex].rowName = e.target.value
                          setTableData(updatedTableData)
                          updateParent(updatedTableData, columnNames)
                        }}
                        onBlur={() => setEditingRowHeader(null)}
                        autoFocus
                      />
                    ) : (
                      row.rowName || ''
                    )}
                    {hoveredRowIndex !== null &&
                      hoveredRowIndex === rowIndex &&
                      isEditing && (
                        <DaButton
                          className="m-1 !text-da-gray-dark !p-0 !w-6 !h-6 rounded absolute top-0 right-0 bg-da-white hover:bg-da-white hover:!text-red-500"
                          size="sm"
                          variant="outline-nocolor"
                          onClick={() => deleteRow(rowIndex)}
                        >
                          <TbX className="size-4" />
                        </DaButton>
                      )}
                  </td>
                  {columnNames.map((columnName, columnIndex) => (
                    <td className="border px-4 py-2" key={columnIndex}>
                      <textarea
                        value={row[columnName]}
                        onChange={(e) =>
                          isEditing &&
                          handleCellChange(rowIndex, columnName, e.target.value)
                        }
                        className="w-full bg-transparent outline-none resize-vertical text-gray-700"
                        ref={(textareaRef) => {
                          if (textareaRef) {
                            textareaRef.style.height = `${textareaRef.scrollHeight}px`
                            textareaRefs.current[
                              rowIndex * columnNames.length + columnIndex
                            ] = textareaRef
                          }
                        }}
                        disabled={!isEditing}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DaButton
          variant="dash"
          className={`absolute -bottom-10 left-0 w-full !h-8 py-0.5 z-10 ${
            //   showAddRow && isEditing ? 'block' : '!hidden'
            isEditing ? 'block' : '!hidden'
          }`}
          onClick={addRow}
        >
          <TbRowInsertTop className="size-4" />
        </DaButton>

        <DaButton
          variant="dash"
          className={`absolute top-0 -right-10 !h-full w-8 !px-0 z-10 ${
            //   showAddColumn && isEditing ? 'flex' : '!hidden'
            isEditing ? 'flex' : '!hidden'
          }`}
          onClick={addColumn}
        >
          <TbColumnInsertLeft />
        </DaButton>
      </div>
    </div>
  )
}

function parseTableData(tableString: string | undefined) {
  if (!tableString) return []

  const lines = tableString.split('\n')
  const tableData: any[] = []

  let currentColumnName: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('#')) {
      currentColumnName = line.substr(1).trim()
    } else if (line.includes(':')) {
      const [rawRowName, cellValue] = line.split(':').map((item) => item.trim())
      const rowName = rawRowName.trim()
      const rowIndex = tableData.findIndex((row) => row.rowName === rowName)

      if (rowIndex === -1) {
        const newRow: any = { rowName: rowName }
        if (currentColumnName) {
          newRow[currentColumnName] = cellValue
        }
        tableData.push(newRow)
      } else {
        if (currentColumnName) {
          tableData[rowIndex][currentColumnName] = cellValue
        }
      }
    }
  }
  return tableData
}

function getTableColumns(tableString: string | undefined) {
  if (!tableString) return []
  const lines = tableString.split('\n')
  const columnNames: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('#')) {
      const columnName = line.substr(1).trim()
      columnNames.push(columnName)
    }
  }
  return columnNames
}

export default DaTableEditor
