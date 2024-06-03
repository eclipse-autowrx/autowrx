// TODO: this file need to be refactored, maximum 250 lines

import { useState, useEffect, useRef } from 'react'
import { DaButton } from '../../atoms/DaButton'
import {
  TbEdit,
  TbTrash,
  TbX,
  TbCheck,
  TbExclamationMark,
  TbCategoryPlus,
  TbSelector,
  TbCopy,
  TbExternalLink,
  TbCategory,
} from 'react-icons/tb'
import CodeEditor from '../CodeEditor'
import { copyText } from '@/lib/utils'
import BUILT_IN_WIDGETS from '@/data/builtinWidgets'
import DaTooltip from '../../atoms/DaTooltip'
import config from '@/configs/config'
import DaPopup from '../../atoms/DaPopup'
import DaWidgetLibrary from '../widgets/DaWidgetLibrary'
import { isContinuousRectangle } from '@/lib/utils'

interface DaDashboardEditorProps {
  widgetConfigString?: string
  entireWidgetConfig?: string
  onDashboardConfigChanged: (config: any) => void
  editable?: boolean
  usedAPIs?: any[]
}

export interface WidgetConfig {
  plugin: string
  widget: string
  options: any
  boxes: number[]
}

const DaDashboardEditor = ({
  widgetConfigString,
  entireWidgetConfig,
  onDashboardConfigChanged,
  editable,
  usedAPIs,
}: DaDashboardEditorProps) => {
  const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([])
  const [selectedWidgetIndex, setSelectedWidgetIndex] = useState<number | null>(
    null,
  )
  const [selectedWidget, setSelectedWidget] = useState<any>(null) // Hold the widget config string
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [warningMessage2, setWarningMessage2] = useState<string | null>(null) // New warning message for widget library
  const [isConfigValid, setIsConfigValid] = useState(true) // Prevent crash during editting
  const [selectedCells, setSelectedCells] = useState<number[]>([]) // New state to track selected cells
  const [selectedCellValid, setSelectedCellValid] = useState<boolean>(false)
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState<boolean>(false)
  const [targetSelectionCells, setTargetSelectionCells] = useState<number[]>([]) // New state to track selected cells
  const [isExpanded, setIsExpanded] = useState<boolean>(false) // Expand used APIs dropdown list
  const dropdownRef = useRef<HTMLDivElement>(null)

  const codeEditorPopup = useState<boolean>(false)

  const [buildinWidgets, setBuildinWidgets] = useState<any[]>(BUILT_IN_WIDGETS)

  const doesOverlap = (
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

  useEffect(() => {
    console.log(`widgetConfigs`)
    console.log(widgetConfigs)
  }, [widgetConfigs])

  useEffect(() => {
    if (!entireWidgetConfig) return
    try {
      const config = JSON.parse(entireWidgetConfig)
      console.log(`config`)
      console.log(config)
      const widgetArray = config.widgets || config // Fallback to config if widgets key is absent
      if (Array.isArray(widgetArray)) {
        setWidgetConfigs(widgetArray)
      } else {
        setWidgetConfigs([])
      }

      let message = ''
      let isConfigValidLocal = true
      for (let i = 0; i < widgetArray.length; i++) {
        const widget = widgetArray[i]
        if (!isContinuousRectangle(widget.boxes)) {
          message =
            'One or more widgets have discrete cell placement. Please check the configuration.'
          isConfigValidLocal = false
          break
        }
        // Check for overlaps
        const otherWidgets = widgetArray.filter(
          (_: any, idx: number) => idx !== i,
        )
        const doesOverlapResult = otherWidgets.some((otherWidget: any) =>
          otherWidget.boxes.some((box: any) => widget.boxes.includes(box)),
        )
        if (doesOverlapResult) {
          message =
            'One or more widgets are overlapping. Please check the configuration.'
          isConfigValidLocal = false
          break
        }
      }
      setIsConfigValid(isConfigValidLocal)
      setWarningMessage2(message)
    } catch (e) {
      setWidgetConfigs([])
      setIsConfigValid(false)
      setWarningMessage2(
        'The raw configuration text is not valid. Please check the configuration.',
      )
    }
  }, [entireWidgetConfig])

  const handleDeleteWidget = (widgetIndex: number) => {
    let result = confirm('Are you sure you want to delete this widget?')
    if (result === true) {
      const updatedWidgets = widgetConfigs.filter(
        (_, index) => index !== widgetIndex,
      )
      const newConfigs = {
        ...JSON.parse(entireWidgetConfig || ''),
        widgets: updatedWidgets,
      }
      setWidgetConfigs(updatedWidgets)
      onDashboardConfigChanged(JSON.stringify(newConfigs, null, 2))
    }
  }

  const handleUpdateWidget = () => {
    if (selectedWidgetIndex !== null) {
      try {
        const updatedWidgetConfig = JSON.parse(selectedWidget)
        if (
          isContinuousRectangle(updatedWidgetConfig.boxes) &&
          !doesOverlap(updatedWidgetConfig, selectedWidgetIndex)
        ) {
          const updatedWidgets = [...widgetConfigs]
          updatedWidgets[selectedWidgetIndex] = updatedWidgetConfig
          const newConfigs = {
            ...JSON.parse(entireWidgetConfig || ''),
            widgets: updatedWidgets,
          }
          setWidgetConfigs(updatedWidgets)
          onDashboardConfigChanged(JSON.stringify(newConfigs, null, 2))
          setWarningMessage(null)
        } else {
          let message = ''
          if (!isContinuousRectangle(updatedWidgetConfig.boxes)) {
            message = 'The cells placement is discrete. Please try again.'
          }
          if (doesOverlap(updatedWidgetConfig, selectedWidgetIndex)) {
            message = 'The cells placement is overlapping. Please try again.'
          }
          setWarningMessage(message)
        }
      } catch (e) {
        console.error('Failed to parse the updated widget configuration', e)
      }
    } else {
      console.error('No widget is selected for updating')
    }
  }

  //Timeout for warning message
  useEffect(() => {
    ;(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setWarningMessage(null)
    })()
  }, [warningMessage])

  const handleAddWidget = () => {
    setTargetSelectionCells(selectedCells)
    setIsWidgetLibraryOpen(true)
  }

  const handleSelectCell = (cell: number) => {
    let updatedSelectedCells = selectedCells.includes(cell)
      ? selectedCells.filter((c) => c !== cell)
      : [...selectedCells, cell].sort((a, b) => a - b)

    const isValidSelection = isContinuousRectangle(updatedSelectedCells)
    setSelectedCells(updatedSelectedCells)
    setSelectedCellValid(isValidSelection)
    setSelectedWidgetIndex(null) // unselect placed widget
    if (!isValidSelection) {
      // Optional: Notify user of invalid selection
    }
  }
  const handleWidgetClick = (index: number) => {
    setSelectedWidgetIndex(index)
    // Deselect any selected cells
    setSelectedCells([])
  }

  // Handle open widget in Widget Studio
  const handleOpenWidget = (index: number) => {
    const widgetConfig = widgetConfigs[index]
    if (widgetConfig.options.url.includes('bewebstudio')) {
      // Extract the project ID and file name from the URL
      const urlParts = widgetConfig.options.url
        .split('/data/projects/')[1]
        .split('/')
      const projectId = urlParts[0]
      const fileName = urlParts.slice(1).join('/')
      // Construct the new URL
      const newUrl = `${config.studioUrl}/project/${projectId}?fileName=/${encodeURIComponent(
        fileName,
      )}`
      // Open the new URL
      window.open(newUrl)
    }
  }

  // Calculate the rowSpan and colSpan of widget box to merge the cells
  const calculateSpans = (boxes: any) => {
    let minCol = Math.min(...boxes.map((box: any) => ((box - 1) % 5) + 1))
    let maxCol = Math.max(...boxes.map((box: any) => ((box - 1) % 5) + 1))
    let minRow = Math.ceil(Math.min(...boxes) / 5)
    let maxRow = Math.ceil(Math.max(...boxes) / 5)

    let colSpan = maxCol - minCol + 1
    let rowSpan = maxRow - minRow + 1

    return { rowSpan, colSpan }
  }

  const widgetItem = (
    widgetConfig: WidgetConfig,
    index: number,
    cell: number,
  ) => {
    const { rowSpan, colSpan } = calculateSpans(widgetConfig.boxes)
    return (
      <div
        className={`group flex relative border border-da-gray-mediu select-none cursor-pointer col-span-${colSpan} row-span-${rowSpan} text-da-gray-dark da-label-small ${
          selectedWidgetIndex === index &&
          `!border-da-primary-500 border-2 !text-da-primary-500 !bg-da-gray-light `
        } bg-da-gray-light hover:bg-da-gray-light`}
        key={`${index}-${cell}`}
        onClick={() => handleWidgetClick(index)}
      >
        <div className="hidden group-hover:block w-fit absolute right-1 top-1 bg-da-white rounded">
          <div className="flex items-center">
            <DaTooltip
              className="py-1"
              content="Delete widget"
              space={20}
              delay={500}
            >
              <DaButton
                variant="plain"
                className="!px-0"
                onClick={() => handleDeleteWidget(index)}
              >
                <TbTrash className="mx-2 w-5 h-5"></TbTrash>
              </DaButton>
            </DaTooltip>
            {/* TODO: need to change bewebstudio to somethigng smarter*/}
            {widgetConfig.options?.url &&
              widgetConfig.options.url.includes('bewebstudio') && (
                <DaTooltip
                  className="py-1"
                  content="Open widget in Studio"
                  space={20}
                  delay={500}
                >
                  <DaButton
                    variant="plain"
                    className="!px-0 hover:text-da-primary-500"
                    onClick={() => handleOpenWidget(index)}
                  >
                    <TbExternalLink className="mx-2 w-5 h-5" />
                  </DaButton>
                </DaTooltip>
              )}

            <DaTooltip
              className="py-1"
              content="Edit widget"
              space={20}
              delay={500}
            >
              <DaButton
                variant="plain"
                className="!px-0 hover:text-da-primary-500"
                onClick={() => {
                  setSelectedWidget(JSON.stringify(widgetConfig, null, 2))
                  codeEditorPopup[1](true)
                }}
              >
                <TbEdit className="mx-2 w-5 h-5" />
              </DaButton>
            </DaTooltip>
          </div>
        </div>
        <div className="flex flex-col w-full p-3 justify-center items-center">
          <div className="flex flex-col justify-center items-center overflow-hidden">
            <div className="flex w-full min-w-[100px] max-w-[300px] h-3/4 max-h-[200px] justify-center">
              {(() => {
                const imageUrl =
                  widgetConfig.options && widgetConfig.options.iconURL
                    ? widgetConfig.options.iconURL
                    : buildinWidgets.find(
                        (widget) => widget.widget === widgetConfig?.widget,
                      )?.icon
                if (imageUrl) {
                  return (
                    <img
                      src={imageUrl}
                      alt="widget icon"
                      className="flex rounded-lg object-contain"
                    />
                  )
                } else {
                  return (
                    <TbCategory className="w-full text-aiot-blue h-full pb-2 stroke-[1.8]" />
                  )
                }
              })()}
            </div>
            <div className="w-full text-center !text-xs font-semibold pt-2">
              {/* TODO: need to change '/store-be/' to something smarter */}
              {widgetConfig.options?.url &&
              widgetConfig.options.url.includes('/store-be/')
                ? widgetConfig.options.url
                    .split('/store-be/')[1]
                    .split('/')[0]
                    .replace(/%20/g, ' ')
                : widgetConfig.widget}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const widgetGrid = () => {
    if (!isConfigValid) {
      return (
        <div className="flex col-span-5 row-span-2 justify-center items-center w-full h-full">
          <div className="flex items-center text-da-gray-medium">
            <TbExclamationMark className="w-5 h-5 mr-0.5 text-da-accent-500" />
            {warningMessage2
              ? warningMessage2
              : 'The configuration is not valid. Please check the configuration.'}
          </div>
        </div>
      )
    }

    const renderedWidgets = new Set()

    return CELLS.map((cell) => {
      // let widgetIndex = -1;
      // widgetConfigs.forEach((w, wIndex) => {
      //     if(w.boxes?.includes(cell)) {
      //         widgetIndex = wIndex
      //     }
      // })
      const widgetIndex = widgetConfigs.findIndex((w) =>
        w.boxes?.includes(cell),
      )
      const isCellSelected = selectedCells.includes(cell)

      if (selectedCellValid && isCellSelected) {
        const { rowSpan, colSpan } = calculateSpans(selectedCells)

        if (cell === Math.min(...selectedCells)) {
          return (
            <div
              key={`merged-${cell}`}
              className={`flex relative border border-da-gray-medium col-span-${colSpan} row-span-${rowSpan} cursor-pointer !bg-da-white border-2 border-da-gray-dark items-center justify-center text-da-gray-dark`}
            >
              <DaTooltip
                content="Add widget from marketplace or built-in library"
                className="!py-1"
                space={30}
                delay={500}
              >
                <DaButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddWidget()}
                  className="hover:text-da-gray-dark"
                >
                  <TbCategoryPlus className="w-4 h-4 mr-1" />
                  Add widget
                </DaButton>
              </DaTooltip>

              <DaTooltip
                content="Cancel place widget"
                className="!py-1"
                space={30}
                delay={500}
              >
                <DaButton
                  variant="plain"
                  className="mr-0 absolute top-2 right-0 hover:text-accent-500"
                  onClick={() => setSelectedCells([])}
                >
                  <TbX className="w-5 h-5" />
                </DaButton>
              </DaTooltip>
            </div>
          )
        }
        return null // Skip rendering for other cells in valid selection
      }

      if (widgetIndex !== -1 && !renderedWidgets.has(widgetIndex)) {
        renderedWidgets.add(widgetIndex)
        return widgetItem(widgetConfigs[widgetIndex], widgetIndex, cell)
      } else if (widgetIndex === -1) {
        return (
          <div
            key={`empty-${cell}`}
            className={`flex border border-da-gray-medium justify-center items-center select-none da-label-small text-da-gray-medium font-bold cursor-pointer ${
              selectedCells.includes(cell) &&
              'bg-da-gray-light text-da-gray-dark'
            }`}
            onClick={() => handleSelectCell(cell)}
          >
            {cell}
          </div>
        )
      }
    })
  }

  return (
    <div className="flex flex-col w-full p-1 items-center justify-center">
      <div
        className={`grid w-full grid-cols-5 grid-rows-2 border border-da-gray-medium ${
          editable ? 'cursor-pointer' : '!pointer-events-none'
        } `}
        style={{ gridTemplateRows: 'repeat(2, 120px)' }}
      >
        {widgetGrid()}
      </div>
      {editable && (
        <div className="italic py-0.5 text-da-gray-medium da-label-regular">
          Click on empty cell to place new widget
        </div>
      )}
      {warningMessage && (
        <div className="flex w-fit mt-3 rounded py-1 px-2 justify-center items-center border border-da-gray-light shadow-sm select-none">
          <TbExclamationMark className="flex w-5 h-5 text-da-accent-500 mr-1" />
          <div className="flex text-da-gray-dark">{warningMessage}</div>
        </div>
      )}
      <DaPopup
        state={codeEditorPopup}
        className="flex w-[90%] max-w-[880px] h-[500px] bg-white rounded"
        trigger={<span></span>}
      >
        <div className="flex flex-col w-full h-full">
          <div className="flex relative w-full justify-between items-center p-4">
            <div className="flex items-center text-aiot-blue">
              <TbEdit className="w-6 h-6 mr-1.5" />
              <div className="flex text-lg font-bold">Edit widget</div>
            </div>
            {usedAPIs && usedAPIs.length > 0 && (
              <div ref={dropdownRef} className="flex flex-col relative">
                <div className="flex w-full justify-end">
                  <DaButton
                    variant="outline"
                    onClick={() => {
                      setIsExpanded(!isExpanded)
                    }}
                  >
                    <TbSelector className="mr-2 flex bg-da-white justify-end hover:bg-gray-50 w-fit" />{' '}
                    Recently used APIs
                  </DaButton>
                </div>
                {isExpanded && (
                  <div className="absolute flex flex-col top-9 right-0 bg-da-white z-10 rounded border border-gray-200 shadow-sm cursor-pointer">
                    {usedAPIs.map((api) => (
                      <div
                        onClick={() =>
                          copyText(api.api, `Copied "${api.api}" to clipboard.`)
                        }
                        className="flex h-50% rounded hover:bg-da-gray-light items-center text-da-gray-dark group justify-between px-2 py-1 m-1"
                        key={api.name}
                      >
                        <div className="flex text-sm mr-2">{api.api}</div>
                        {
                          <TbCopy
                            className={`w-4 h-4 cursor-pointer invisible group-hover:visible`}
                          />
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <CodeEditor
            language="json"
            editable={true}
            code={selectedWidget}
            setCode={(e) => {
              setSelectedWidget(e)
            }}
            onBlur={() => {}}
          />
          <div className="flex w-full space-x-2 justify-end p-4">
            <DaButton
              variant="outline"
              className=""
              onClick={() => codeEditorPopup[1](false)}
            >
              <TbX className="mr-2" /> Close
            </DaButton>
            <DaButton
              variant="solid"
              onClick={() => {
                handleUpdateWidget()
                codeEditorPopup[1](false)
              }}
            >
              <TbCheck className="mr-2" /> Save
            </DaButton>
          </div>
        </div>
      </DaPopup>

      <DaWidgetLibrary
        targetSelectionCells={targetSelectionCells}
        entireWidgetConfig={entireWidgetConfig || ''}
        updateDashboardCfg={onDashboardConfigChanged}
        openPopup={isWidgetLibraryOpen}
        onClose={() => {
          setIsWidgetLibraryOpen(false)
          setSelectedCells([])
        }}
      />
    </div>
  )
}

export default DaDashboardEditor
