import React, { useState, useEffect, useRef, useImperativeHandle } from 'react'
import { TbX, TbColumnInsertLeft, TbRowInsertTop } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'

interface DaTableEditorProps {
  defaultValue?: string
  onChange: (data: string) => void
  isEditing: boolean
}

const DaTableEditor = React.forwardRef<{}, DaTableEditorProps>(
  ({ defaultValue, onChange, isEditing }, ref) => {
    const [tableData, setTableData] = useState<any[]>([])
    const [columnNames, setColumnNames] = useState<string[]>([])
    const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(
      null,
    )
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)
    const [editingColumnHeader, setEditingColumnHeader] = useState<
      number | null
    >(null)
    const [editingRowHeader, setEditingRowHeader] = useState<number | null>(
      null,
    )

    const [showAddRow, setShowAddRow] = useState(false)
    const [showAddColumn, setShowAddColumn] = useState(false)

    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const hideTimeout = useRef<number | undefined>(undefined)

    const isValidHeader = (header: string) => {
      const isWord = /\w+/.test(header)
      const startsWithNumeric = /^\d/.test(header)
      return isWord && !startsWithNumeric
    }

    const [isTableValid, setIsTableValid] = useState(false)

    useEffect(() => {
      if (!defaultValue || defaultValue.length < 10) {
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
        setTableData(parseTableData(defaultValue))
        setColumnNames(getTableColumns(defaultValue))
      }
    }, [defaultValue])

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
      onChange(tableString)
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
      const noDuplicateColumnNames =
        uniqueColumnNames.size === columnNames.length
      const rowNames = tableData.map((row) => row.rowName)
      const uniqueRowNames = new Set(rowNames)
      const noDuplicateRowNames = uniqueRowNames.size === rowNames.length
      const allValidHeaders =
        columnNames.every(isValidHeader) &&
        tableData.every((row) => isValidHeader(row.rowName)) &&
        noDuplicateColumnNames &&
        noDuplicateRowNames

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

      if (errors.length > 0) {
        setErrorMessage(errors.join(', '))
      } else {
        setErrorMessage(null)
      }

      setIsTableValid(allValidHeaders)
    }, [tableData, columnNames])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditing) return

      const divBounds = e.currentTarget.getBoundingClientRect()
      const divHeight = divBounds.height
      const divWidth = divBounds.width

      if (e.clientY > divBounds.top + 0.75 * divHeight) {
        setShowAddRow(true)
      } else {
        setShowAddRow(false)
      }

      if (e.clientX > divBounds.left + 0.75 * divWidth) {
        setShowAddColumn(true)
      } else {
        setShowAddColumn(false)
      }

      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current)
      }

      hideTimeout.current = window.setTimeout(() => {
        setShowAddRow(false)
        setShowAddColumn(false)
      }, 2000)
    }

    const handleMouseLeave = () => {
      if (!isEditing) return

      hideTimeout.current = window.setTimeout(() => {
        setShowAddRow(false)
        setShowAddColumn(false)
      }, 500)
    }

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
        <div className="w-fit">
          {!isTableValid && errorMessage !== null && (
            <div className="absolute flex top-[-2rem] items-center">
              <TbX className="w-5 h-5 text-red-500 mr-1" />
              <div className="text-gray-600">{errorMessage}</div>
            </div>
          )}
        </div>
        <div
          className="flex w-fit h-full relative "
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex-grow text-sm">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="border px-4 py-2"></th>
                  {columnNames.map((columnName, columnIndex) => (
                    <th
                      className="border w-[18rem] px-2 py-2 h-[4rem] text-white relative"
                      key={columnIndex}
                      style={{ backgroundColor: columnColors[columnIndex] }}
                      onMouseEnter={() => setHoveredColumnIndex(columnIndex)}
                      onMouseLeave={() => setHoveredColumnIndex(null)}
                      onClick={() =>
                        isEditing && setEditingColumnHeader(columnIndex)
                      }
                    >
                      {editingColumnHeader === columnIndex ? (
                        <input
                          type="textarea"
                          className="w-full bg-transparent outline-none"
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
                        />
                      ) : (
                        columnName
                      )}
                      {hoveredColumnIndex !== null &&
                        hoveredColumnIndex === columnIndex &&
                        isEditing && (
                          <DaButton
                            className="m-1 text-white text-xs rounded absolute top-0 right-0 bg-da-white hover:bg-da-white hover:text-red-500"
                            variant="outline"
                            onClick={() => deleteColumn(columnIndex)}
                            size="sm"
                          >
                            <TbX className="w-5 h-5" />
                          </DaButton>
                        )}
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
                            className="m-1 text-xs rounded absolute top-0 right-0 hover:text-red-500"
                            size="sm"
                            variant="outline-nocolor"
                            onClick={() => deleteRow(rowIndex)}
                          >
                            <TbX className="w-5 h-5" />
                          </DaButton>
                        )}
                    </td>
                    {columnNames.map((columnName, columnIndex) => (
                      <td className="border px-4 py-2" key={columnIndex}>
                        <textarea
                          value={row[columnName]}
                          onChange={(e) =>
                            isEditing &&
                            handleCellChange(
                              rowIndex,
                              columnName,
                              e.target.value,
                            )
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
            variant="outline-nocolor"
            className={`absolute bottom-[-2.1rem] left-0 w-full !h-7 py-0.5 z-10 ${
              //   showAddRow && isEditing ? 'block' : '!hidden'
              isEditing ? 'block' : '!hidden'
            }`}
            onClick={addRow}
          >
            <TbRowInsertTop />
          </DaButton>

          <DaButton
            variant="outline-nocolor"
            className={`absolute top-0 right-[-2rem] !h-full w-7 !px-0 z-10 ${
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
  },
)

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
