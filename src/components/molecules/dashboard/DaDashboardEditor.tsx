import { useState, useEffect } from 'react'
import { DaButton } from '../../atoms/DaButton'
import {
  TbEdit,
  TbTrash,
  TbX,
  TbExclamationMark,
  TbCategoryPlus,
  TbExternalLink,
  TbCategory,
} from 'react-icons/tb'
import BUILT_IN_WIDGETS from '@/data/builtinWidgets'
import DaTooltip from '../../atoms/DaTooltip'
import config from '@/configs/config'
import DaWidgetLibrary from '../widgets/DaWidgetLibrary'
import { isContinuousRectangle, doesOverlap, calculateSpans } from '@/lib/utils'
import { cn } from '@/lib/utils'
import DaDashboardWidgetEditor from './DaDashboardWidgetEditor'
import { DaText } from '@/components/atoms/DaText'

interface DaDashboardEditorProps {
  entireWidgetConfig?: string
  onDashboardConfigChanged: (config: any) => void
  editable?: boolean
}

export interface WidgetConfig {
  plugin: string
  widget: string
  url: string
  options: any
  boxes: number[]
}

const DaDashboardEditor = ({
  entireWidgetConfig,
  onDashboardConfigChanged,
  editable,
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

  const [isSelectedCellValid, setIsSelectedCellValid] = useState<boolean>(false)
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState<boolean>(false)
  const [targetSelectionCells, setTargetSelectionCells] = useState<number[]>([]) // New state to track selected cells

  const codeEditorPopup = useState<boolean>(false)
  const [buildinWidgets, setBuildinWidgets] = useState<any[]>(BUILT_IN_WIDGETS)

  // This useEffect used to load the existed widget configuration
  useEffect(() => {
    if (!entireWidgetConfig) return
    try {
      const config = JSON.parse(entireWidgetConfig)
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

  //Timeout for warning message
  useEffect(() => {
    ;(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setWarningMessage(null)
    })()
  }, [warningMessage])

  // Handle add widget to the dashboard from widget library
  const handleAddWidget = () => {
    setTargetSelectionCells(selectedCells)
    setIsWidgetLibraryOpen(true)
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
      const newUrl = `${config.studioUrl}/project/${projectId}?fileName=/${encodeURIComponent(
        fileName,
      )}`
      window.open(newUrl)
    }
  }

  const handleSelectCell = (cell: number) => {
    let updatedSelectedCells = selectedCells.includes(cell)
      ? selectedCells.filter((c) => c !== cell)
      : [...selectedCells, cell].sort((a, b) => a - b)

    const isValidSelection = isContinuousRectangle(updatedSelectedCells)

    setSelectedCells(updatedSelectedCells)
    setIsSelectedCellValid(isValidSelection)
    setSelectedWidgetIndex(null) // unselect placed widget
    if (!isValidSelection) {
    }
  }
  const handleWidgetClick = (index: number) => {
    setSelectedWidgetIndex(index)
    // Deselect any selected cells
    setSelectedCells([])
  }

  const handleUpdateWidget = () => {
    if (selectedWidgetIndex !== null) {
      try {
        const updatedWidgetConfig = JSON.parse(selectedWidget)
        if (
          isContinuousRectangle(updatedWidgetConfig.boxes) &&
          !doesOverlap(widgetConfigs, updatedWidgetConfig, selectedWidgetIndex)
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
          if (
            doesOverlap(widgetConfigs, updatedWidgetConfig, selectedWidgetIndex)
          ) {
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

  const widgetItem = (
    widgetConfig: WidgetConfig,
    index: number,
    cell: number,
  ) => {
    const { rowSpan, colSpan } = calculateSpans(widgetConfig.boxes)
    return (
      <div
        className={cn(
          'group flex relative border border-da-gray-medium select-none cursor-pointer text-da-gray-dark da-label-small',
          `col-span-${colSpan} row-span-${rowSpan}`,
          selectedWidgetIndex === index &&
            '!border-da-primary-500 !text-da-primary-500 !bg-da-gray-light',
          'bg-da-gray-light hover:bg-da-gray-light',
        )}
        key={`${index}-${cell}`}
        onClick={() => handleWidgetClick(index)}
      >
        <div className="hidden group-hover:block w-fit absolute right-1 top-1 bg-da-white rounded">
          <div className="flex items-center">
            <DaTooltip className="py-1" content="Delete widget">
              <DaButton
                variant="destructive"
                className="!px-0"
                onClick={() => handleDeleteWidget(index)}
              >
                <TbTrash className="mx-2 w-5 h-5"></TbTrash>
              </DaButton>
            </DaTooltip>
            {/* TODO: need to change bewebstudio to somethigng smarter*/}
            {widgetConfig.options?.url &&
              widgetConfig.options.url.includes('bewebstudio') && (
                <DaTooltip className="py-1" content="Open widget in Studio">
                  <DaButton
                    variant="plain"
                    className="!px-0 hover:text-da-primary-500"
                    onClick={() => handleOpenWidget(index)}
                  >
                    <TbExternalLink className="mx-2 w-5 h-5" />
                  </DaButton>
                </DaTooltip>
              )}

            <DaTooltip className="py-1" content="Edit widget">
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
      const widgetIndex = widgetConfigs.findIndex((w) =>
        w.boxes?.includes(cell),
      )
      const isCellSelected = selectedCells.includes(cell)

      if (isSelectedCellValid && isCellSelected) {
        const { rowSpan, colSpan } = calculateSpans(selectedCells)
        if (cell === Math.min(...selectedCells)) {
          return (
            <div
              key={`merged-${cell}`}
              className={cn(
                'flex relative cursor-pointer !bg-da-white border-2 border-da-gray-medium items-center justify-center text-da-gray-dark',
                `col-span-${colSpan} row-span-${rowSpan}`,
              )}
            >
              <DaTooltip content="Add widget from marketplace or built-in">
                <DaButton
                  size="sm"
                  variant="outline-nocolor"
                  onClick={() => handleAddWidget()}
                  className="hover:text-da-gray-dark"
                >
                  <TbCategoryPlus className="w-4 h-4 mr-1" />
                  Add widget
                </DaButton>
              </DaTooltip>

              <DaTooltip content="Cancel place widget">
                <DaButton
                  variant="destructive"
                  size="sm"
                  className="mr-0 absolute top-1 right-1"
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
            className={cn(
              'flex border border-da-gray-medium justify-center items-center select-none da-label-small text-da-gray-medium font-bold',
              selectedCells.includes(cell) &&
                'bg-da-gray-light text-da-gray-dark',
              !editable && 'pointer-events-none',
            )}
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
        <DaText variant="small" className="py-2">
          Click on empty cell to place new widget
        </DaText>
      )}
      {warningMessage && (
        <div className="flex w-fit mt-3 rounded py-1 px-2 justify-center items-center border border-da-gray-light shadow-sm select-none">
          <TbExclamationMark className="flex w-5 h-5 text-da-accent-500 mr-1" />
          <div className="flex text-da-gray-dark">{warningMessage}</div>
        </div>
      )}

      <DaDashboardWidgetEditor
        widgetEditorPopupState={codeEditorPopup}
        selectedWidget={selectedWidget}
        setSelectedWidget={setSelectedWidget}
        handleUpdateWidget={handleUpdateWidget}
      />

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
