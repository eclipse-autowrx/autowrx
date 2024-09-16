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
import { WidgetConfig } from '@/types/widget.type'

interface DaDashboardEditorProps {
  entireWidgetConfig?: string
  onDashboardConfigChanged: (dashboardConfig: string) => void
  onConfigValidChanged?: (isValid: boolean) => void
  editable?: boolean
  hideWidget?: boolean
  isWizard?: boolean
}

const DaDashboardEditor = ({
  entireWidgetConfig,
  onDashboardConfigChanged,
  onConfigValidChanged,
  editable,
  hideWidget,
  isWizard = false,
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
    // console.log('entireWidgetConfig', entireWidgetConfig)
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
      onConfigValidChanged?.(isConfigValidLocal)
      setWarningMessage2(message)
    } catch (e) {
      setWidgetConfigs([])
      setIsConfigValid(false)
      onConfigValidChanged?.(false)
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
    setSelectedCells([]) // unselect any selected cells
  }

  const handleUpdateWidget = () => {
    if (selectedWidgetIndex !== null) {
      try {
        const updatedWidgetConfig = JSON.parse(selectedWidget)
        console.log('updatedWidgetConfig', updatedWidgetConfig)
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

  const handleOnDashboardConfigChanged = (newConfigString: string) => {
    try {
      onDashboardConfigChanged(newConfigString)
      setSelectedCells([]) // unselect any selected cells
    } catch (e) {
      console.error('Failed to parse new dashboard config:', e)
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
          'da-label-small group relative flex cursor-pointer select-none border border-da-gray-medium text-da-gray-dark',
          `col-span-${colSpan} row-span-${rowSpan}`,
          selectedWidgetIndex === index &&
            '!border-da-primary-500 !bg-da-gray-light !text-da-primary-500',
          'bg-da-gray-light hover:bg-da-gray-light',
        )}
        key={`${index}-${cell}`}
        onClick={() => handleWidgetClick(index)}
      >
        <div className="absolute right-1 top-1 hidden w-fit rounded bg-da-white group-hover:block">
          <div className="flex items-center">
            <DaTooltip className="py-1" content="Delete widget">
              <DaButton
                variant="destructive"
                className="!px-0"
                onClick={() => handleDeleteWidget(index)}
              >
                <TbTrash className="mx-2 h-5 w-5"></TbTrash>
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
                    <TbExternalLink className="mx-2 h-5 w-5" />
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
                <TbEdit className="mx-2 h-5 w-5" />
              </DaButton>
            </DaTooltip>
          </div>
        </div>
        <div className="flex w-full flex-col items-center justify-center p-3">
          <div className="flex flex-col items-center justify-center overflow-hidden">
            <div className="flex h-3/4 max-h-[200px] w-full min-w-[100px] max-w-[300px] justify-center">
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
                    <TbCategory className="text-aiot-blue h-full w-full stroke-[1.8] pb-2" />
                  )
                }
              })()}
            </div>
            <div className="w-full pt-2 text-center !text-xs font-semibold">
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
        <div className="col-span-5 row-span-2 flex h-full w-full items-center justify-center">
          <div className="flex h-full items-center text-da-gray-medium">
            <TbExclamationMark className="mr-0.5 h-5 w-5 text-red-500" />
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
                'relative flex cursor-pointer items-center justify-center border-2 border-da-primary-500 !bg-da-white text-da-gray-dark',
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
                  <TbCategoryPlus className="mr-1 h-4 w-4" />
                  Add widget
                </DaButton>
              </DaTooltip>

              <DaTooltip content="Cancel place widget">
                <DaButton
                  variant="destructive"
                  size="sm"
                  className="absolute right-1 top-1 mr-0"
                  onClick={() => setSelectedCells([])}
                >
                  <TbX className="h-5 w-5" />
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
              'da-label-small da-label-sub-title flex select-none items-center justify-center border border-da-gray-medium text-da-gray-medium',
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
    <div className="flex w-full flex-col h-full items-center justify-start p-0">
      <div
        className={`grid w-full grid-cols-5 grow grid-rows-2 border border-da-gray-medium ${
          editable ? 'cursor-pointer' : '!pointer-events-none'
        } `}
        style={{ gridTemplateRows: 'repeat(2)' }}
      >
        {widgetGrid()}
      </div>
      {editable && (
        <DaText variant="small-bold" className="py-2 text-orange-700">
          Click on empty cell to place new widget
        </DaText>
      )}
      {warningMessage && (
        <div className="mt-3 flex w-fit select-none items-center justify-center rounded border border-da-gray-light px-2 py-1 shadow-sm">
          <TbExclamationMark className="mr-1 flex h-5 w-5 text-da-accent-500" />
          <div className="flex text-da-gray-dark">{warningMessage}</div>
        </div>
      )}

      {!hideWidget && (
        <>
          <DaDashboardWidgetEditor
            widgetEditorPopupState={codeEditorPopup}
            selectedWidget={selectedWidget}
            setSelectedWidget={setSelectedWidget}
            handleUpdateWidget={handleUpdateWidget}
            isWizard={isWizard}
          />

          <DaWidgetLibrary
            targetSelectionCells={targetSelectionCells}
            entireWidgetConfig={entireWidgetConfig || ''}
            updateDashboardCfg={handleOnDashboardConfigChanged}
            popupState={[isWidgetLibraryOpen, setIsWidgetLibraryOpen]}
          />
        </>
      )}
    </div>
  )
}

export default DaDashboardEditor
