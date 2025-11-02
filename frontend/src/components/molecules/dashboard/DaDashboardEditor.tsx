// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useRef, FC } from 'react'
import { Button } from '@/components/atoms/button'
import {
  TbEdit,
  TbTrash,
  TbX,
  TbExclamationMark,
  TbCategoryPlus,
  TbExternalLink,
  TbCategory,
  TbLinkPlus,
  TbCheck,
  TbSelector,
  TbCopy,
  TbCopyPlus,
} from 'react-icons/tb'
import { TbShoppingCart, TbLayoutGrid } from 'react-icons/tb'
import { BsStars } from 'react-icons/bs'
import BUILT_IN_WIDGETS, {
  BUILT_IN_EMBEDDED_WIDGETS,
} from '@/data/builtinWidgets'
import DaTooltip from '@/components/molecules/DaTooltip'
import config from '@/configs/config'
import { isContinuousRectangle, doesOverlap, calculateSpans, parseWidgetConfig } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { WidgetConfig } from '@/types/widget.type'
import DaDialog from '@/components/molecules/DaDialog'
import CodeEditor from '@/components/molecules/CodeEditor'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { createNewWidgetByWebStudio } from '@/services/webStudio.service'
import { toast } from 'react-toastify'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaWidgetSetup from '@/components/molecules/widgets/DaWidgetSetup'
import DaWidgetList from '@/components/molecules/widgets/DaWidgetList'
import useListMarketplaceWidgets from '@/hooks/useListMarketplaceWidgets'
import { Input } from '@/components/atoms/input'
import ModelApiList from '@/components/organisms/ModelApiList'

interface DaDashboardWidgetEditorProps {
  widgetEditorPopupState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
  ]
  selectedWidget: any
  handleUpdateWidget: (widgetConfig: string) => void
  isWizard?: boolean
}

// Component for individual signal copy items
const SignalCopyItem = ({ api }: { api: { name: string } }) => {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${api.name}"`)
    setIsCopied(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 2000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="flex rounded items-center text-muted-foreground group px-2 py-1 m-1 hover:bg-muted w-full cursor-pointer"
      onClick={handleCopy}
    >
      {isCopied ? (
        <TbCheck className="size-4 mr-2 text-green-500" />
      ) : (
        <TbCopy className="size-4 mr-2" />
      )}
      <span className="text-sm cursor-pointer">{api.name}</span>
    </div>
  )
}

const DaDashboardWidgetEditor = ({
  widgetEditorPopupState: codeEditorPopup,
  selectedWidget,
  handleUpdateWidget,
  isWizard = false,
}: DaDashboardWidgetEditorProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [usedAPIs, setUsedAPIs] = useState<any[]>([])
  const [localPrototype, setLocalPrototype] = useState<Partial<Prototype>>({
    code: '',
  })

  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )

  // Handle wizard prototype if available, otherwise use regular prototype
  // Note: useWizardGenAIStore doesn't exist in current codebase, so we'll use prototype from modelStore
  const prototypeData = prototype

  const [optionStr, setOptionStr] = useState('')
  const [widgetUrl, setWidgetUrl] = useState('')
  const [widgetIcon, setWidgetIcon] = useState('')
  const [boxes, setBoxes] = useState('')

  // State and ref for "Copy all signals"
  const [isAllCopied, setIsAllCopied] = useState(false)
  const allCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (codeEditorPopup[0]) {
      setIsExpanded(false)
    }
  }, [codeEditorPopup[0]])

  useEffect(() => {
    if (selectedWidget) {
      let options = {} as any
      try {
        let widget = JSON.parse(selectedWidget)
        setBoxes(JSON.stringify(widget.boxes, null, 4))
        options = widget.options
        setWidgetIcon(options.iconURL)
        // For built-in widgets, show the path as URL, for embedded widgets show the actual URL
        setWidgetUrl(
          widget.path && widget.path.trim() !== ''
            ? widget.path
            : options.url || '',
        )
        delete options.iconURL
        delete options.url
      } catch (e) {}
      setOptionStr(JSON.stringify(options, null, 4))
    }
  }, [selectedWidget])

  useEffect(() => {
    if (isWizard) {
      setLocalPrototype(prototypeData)
    } else {
      setLocalPrototype(prototype)
    }
  }, [prototype, prototypeData, isWizard])

  useEffect(() => {
    if (
      !localPrototype.code ||
      !activeModelApis ||
      activeModelApis.length === 0
    ) {
      return
    }
    let newUsedAPIsList = [] as string[]
    activeModelApis.forEach((item) => {
      if (localPrototype.code && localPrototype.code.includes(item.shortName)) {
        newUsedAPIsList.push(item)
      }
    })
    setUsedAPIs(newUsedAPIsList)
  }, [localPrototype.code, activeModelApis])

  const copyAllSignals = () => {
    if (!usedAPIs || usedAPIs.length === 0) return
    const allSignalsText = usedAPIs.map((api) => `"${api.name}"`).join(',')
    navigator.clipboard.writeText(allSignalsText)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (allCopyTimeoutRef.current) {
        clearTimeout(allCopyTimeoutRef.current)
      }
    }
  }, [])

  return (
    <DaDialog
      open={codeEditorPopup[0]}
      onOpenChange={codeEditorPopup[1]}
      trigger={<span></span>}
      dialogTitle={
        <div className="flex items-center">
          <TbEdit className="w-5 h-5 mr-2" />
          Edit widget
        </div>
      }
      className="block w-[90%] max-w-[1400px] h-fit overflow-auto bg-background rounded"
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex relative w-full justify-between items-center mb-2">
          <div className="flex-1"></div>
          {usedAPIs && usedAPIs.length > 0 && (
            <div ref={dropdownRef} className="flex flex-col relative">
              <div className="flex w-full justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsExpanded(!isExpanded)
                  }}
                >
                  <TbSelector className="mr-2 flex justify-end w-fit" /> Used
                  signals
                </Button>
              </div>
              {isExpanded && (
                <div className="absolute flex flex-col top-9 right-0 bg-background z-10 rounded border border-border shadow-sm cursor-pointer">
                  {/* "Copy all signals" option */}
                  <div
                    className="flex rounded items-center text-muted-foreground group px-2 py-1 m-1 hover:bg-muted w-full border-gray-100"
                    onClick={() => {
                      copyAllSignals()
                      setIsAllCopied(true)
                      if (allCopyTimeoutRef.current) {
                        clearTimeout(allCopyTimeoutRef.current)
                      }
                      allCopyTimeoutRef.current = setTimeout(() => {
                        setIsAllCopied(false)
                        allCopyTimeoutRef.current = null
                      }, 2000)
                    }}
                  >
                    {isAllCopied ? (
                      <TbCheck className="size-4 mr-2 text-green-500" />
                    ) : (
                      <TbCopyPlus className="size-4 mr-2 text-primary" />
                    )}
                    <span className="text-sm cursor-pointer font-medium">
                      Copy all signals
                    </span>
                  </div>

                  {/* Individual signal items */}
                  {usedAPIs.map((api) => (
                    <SignalCopyItem key={api.name} api={api} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex grow overflow-auto">
          <div className="grow">
            <div className="overflow-auto h-[220px] max-h-[262px]">
              <div className="font-semibold text-slate-800">Options</div>
              <CodeEditor
                language="json"
                editable={true}
                code={optionStr}
                setCode={(e) => {
                  setOptionStr(e)
                }}
                onBlur={() => {}}
              />
            </div>

            <div className="py-2 flex items-center">
              <div className="font-semibold text-slate-800">Boxes:</div>
              <div className="w-full pl-2">
                <Input
                  value={boxes}
                  onChange={(e) => setBoxes(e.target.value)}
                  placeholder="Boxes"
                  className="w-full bg-background text-sm"
                />
              </div>
            </div>
            <div className="py-2 flex items-center">
              <div className="font-semibold text-slate-800">URL/Path:</div>
              <div className="w-full pl-2">
                <Input
                  value={widgetUrl}
                  onChange={(e) => setWidgetUrl(e.target.value)}
                  placeholder="Widget URL or path"
                  className="w-full bg-background text-sm"
                />
              </div>
            </div>
          </div>
          <div className="min-w-[500px] max-h-[400px] overflow-auto">
            <ModelApiList />
          </div>
        </div>

        <div className="flex w-full space-x-2 justify-end pt-4">
          <Button
            size="sm"
            variant="outline"
            className="!min-w-16"
            onClick={() => codeEditorPopup[1](false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="default"
            className="!min-w-16"
            onClick={() => {
              let newOption = {} as any
              try {
                newOption = JSON.parse(optionStr)
              } catch (err) {}

              let widget = {} as any
              try {
                widget = JSON.parse(selectedWidget)
              } catch (err) {}

              // Check if this is a built-in widget (has a non-empty path)
              const isBuiltInWidget = widget.path && widget.path.trim() !== ''

              if (isBuiltInWidget) {
                // For built-in widgets, update the path property and don't set url in options
                widget.path = widgetUrl
              } else {
                // For embedded/marketplace widgets, set url in options
                newOption.url = `${widgetUrl}`
              }

              newOption.iconURL = `${widgetIcon}`
              widget.options = newOption
              try {
                widget.boxes = JSON.parse(boxes)
              } catch (err) {}
              handleUpdateWidget(JSON.stringify(widget, null, 4))
              codeEditorPopup[1](false)
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </DaDialog>
  )
}

interface DaWidgetLibraryProp {
  entireWidgetConfig: string
  updateDashboardCfg: (dashboardConfig: string) => void
  popupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  targetSelectionCells?: any
}

const DaWidgetLibrary: FC<DaWidgetLibraryProp> = ({
  entireWidgetConfig,
  updateDashboardCfg,
  popupState,
  targetSelectionCells,
}) => {
  const [prototype] = useModelStore(
    (state: any) => [state.prototype as Prototype],
    shallow,
  )
  const { data: user } = useSelfProfileQuery()
  const { data: marketWidgets } = useListMarketplaceWidgets()
  const modalRef = useRef<HTMLDivElement>(null)
  const buildinWidgets = BUILT_IN_WIDGETS
  let [renderWidgets, setRenderWidgets] = useState<any[]>([])
  let [activeTab, setActiveTab] = useState<'builtin' | 'market' | 'genAI'>(
    'builtin',
  )

  let [activeWidget, setActiveWidget] = useState<any>(null)
  let [pickedCells, setPickedCells] = useState<any[]>([])
  const [optionsStr, setOptionStr] = useState<string>('')
  const [projectCreating, setProjectCreating] = useState<boolean>(false)

  // Related to Widget Gen AI
  const [isWidgetGenAI, setIsWidgetGenAI] = useState<boolean>(true)
  const [widgetUrl, setWidgetUrl] = useState<string>('')
  const [isWidgetDiscrete, setIsWidgetDiscrete] = useState<boolean>(false)
  const [open, setOpen] = popupState

  const PIN_WIDGETS = [
    { name: 'Single Signal Widget', weight: 0 },
    { name: 'Signal List Settable', weight: 2 },
    { name: 'Terminal', weight: 3 },
    { name: 'Image by Signal value', weight: 4 },
    { name: 'Map', weight: 5 },
    { name: 'General 3D Car Model', weight: 6 },
    { name: 'Simple Fan Widget', weight: 7 },
    { name: 'Simple Wiper Widget', weight: 8 },
    { name: 'Chart Multiple Signals', weight: 1 },
  ]

  const handleAddWidgetClick = async () => {
    if (!updateDashboardCfg) return

    let newWidgetConfig = {}

    if (activeWidget) {
      let options: any = {}
      try {
        // Parse optionsStr if it's not empty, otherwise use activeWidget.options
        if (optionsStr && optionsStr.trim() !== '') {
          options = JSON.parse(optionsStr)
        } else if (activeWidget.options) {
          options = JSON.parse(JSON.stringify(activeWidget.options))
        }
      } catch (e) {
        console.error('Error parsing options:', e)
        // Fallback to activeWidget.options or empty object
        options = activeWidget.options ? JSON.parse(JSON.stringify(activeWidget.options)) : {}
      }
      
      if (activeTab === 'market') {
        options['iconURL'] = activeWidget.icon
      }
      newWidgetConfig = {
        plugin: activeWidget.plugin,
        widget: activeWidget.widget,
        options: options,
        boxes: pickedCells,
        path: activeWidget.path ? activeWidget.path : '', // For built-in widget
      }
    } else {
      console.error('Active widget is null')
      return
    }

    let currentWidgetConfig = parseWidgetConfig(entireWidgetConfig)
    if (!Array.isArray(currentWidgetConfig)) {
      currentWidgetConfig = []
    }
    currentWidgetConfig.push(newWidgetConfig)
    await updateDashboardCfg(JSON.stringify(currentWidgetConfig, null, 4))
    setOpen(false)
  }

  const handleCreateFromScratch = async () => {
    let newWidgetConfig = {}
    //
    try {
      if (!user || !prototype) return
      if (projectCreating) return

      if (isWidgetGenAI) {
        if (!widgetUrl) return
        newWidgetConfig = {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            url: widgetUrl,
          },
          boxes: pickedCells,
        }
      } else {
        setProjectCreating(true)
        let reqWidgetURL = await createNewWidgetByWebStudio(
          `Widget-${prototype.name}-${new Date().getTime()}`,
          user?.id,
        )
        setProjectCreating(false)
        if (!reqWidgetURL) return
        newWidgetConfig = {
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          options: {
            url: reqWidgetURL,
          },
          boxes: pickedCells,
        }
        toast.success('New widget created and opened on new tab!', {
          position: 'top-right',
          autoClose: 3000,
        })
      }
      setActiveWidget(null)
    } catch (err) {
      setProjectCreating(false)
      return
    }

    let curWidgetConfigs = parseWidgetConfig(entireWidgetConfig)
    curWidgetConfigs.push(newWidgetConfig)
    await updateDashboardCfg(JSON.stringify(curWidgetConfigs, null, 4))
    setOpen(false)
  }

  // Init picked cells passed from DashboardEditor
  useEffect(() => {
    if (targetSelectionCells) {
      setPickedCells(targetSelectionCells)
    }
  }, [targetSelectionCells])

  useEffect(() => {
    setActiveWidget(activeTab === 'genAI' ? {} : null)
    setIsWidgetGenAI(activeTab === 'genAI')
    let widgets = []

    if (activeTab === 'builtin') {
      // For built-in widgets, use the buildinWidgets data
      widgets = JSON.parse(JSON.stringify(buildinWidgets))
      widgets.forEach((w: any) => {
        let match = PIN_WIDGETS.find((p) => p.name == w.label)
        if (match) {
          w.weight = match.weight
        } else {
          w.weight = 999
        }
      })
      widgets.sort((a: any, b: any) => {
        if (a.weight < b.weight) return -1
        if (a.weight > b.weight) return 1
        return 0
      })
    } else if (activeTab === 'market') {
      // For marketplace widgets
      try {
        widgets = JSON.parse(JSON.stringify(marketWidgets || []))
        widgets.forEach((w: any) => {
          let match = PIN_WIDGETS.find((p) => p.name == w.label)
          if (match) {
            w.weight = match.weight
          } else {
            w.weight = 999
          }
        })
        widgets.sort((a: any, b: any) => {
          if (a.weight < b.weight) return -1
          if (a.weight > b.weight) return 1
          return 0
        })
      } catch (e) {}
    }

    setRenderWidgets(widgets)
  }, [activeTab, marketWidgets, buildinWidgets])

  useEffect(() => {
    setIsWidgetDiscrete(!isContinuousRectangle(pickedCells))
  }, [pickedCells])

  return (
    <DaDialog
      open={open}
      onOpenChange={setOpen}
      trigger={<span></span>}
      dialogTitle="Place new widget to dashboard"
      className="block w-[90vw] xl:w-[80vw] lg:max-w-[80vw]"
    >
      <div className="w-full h-[90vh] xl:h-[75vh] flex flex-col select-none text-primary">
        <div className="flex w-full justify-between items-center mb-2">
          <div className="flex mb-2 w-fit rounded text-xs mt-2">
            <DaTabItem
              active={activeTab === 'builtin'}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('builtin')
              }}
            >
              <TbLayoutGrid className="mr-2" />
              Built-in ({buildinWidgets.length})
            </DaTabItem>
            {marketWidgets && (
              <DaTabItem
                active={activeTab === 'market'}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab('market')
                }}
              >
                <TbShoppingCart className="mr-2" />
                Marketplace ({marketWidgets.length})
              </DaTabItem>
            )}

            {/* <DaTabItem
              active={activeTab === 'genAI'}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('genAI')
              }}
            >
              <BsStars className="mr-2" />
              Widget ProtoPilot
            </DaTabItem> */}
          </div>
          {activeTab !== 'genAI' && <>
            {/* <Button
              variant="ghost"
              className="h-8"
              onClick={() => {
                setIsWidgetGenAI(false)
                handleCreateFromScratch()
              }}
              disabled={projectCreating}
            >
              <TbExternalLink className="mr-2" />
              {projectCreating ? '...' : 'Create widget with Studio'}
            </Button> */}
          </>}
        </div>
        {(activeTab == 'market' || activeTab == 'builtin') && (
          <div className="flex h-full overflow-y-auto space-x-2">
            <DaWidgetList
              renderWidgets={renderWidgets}
              activeWidgetState={[activeWidget, setActiveWidget]}
              activeTab={activeTab}
            />
          </div>
        )}

        {activeTab == 'genAI' && (
          <div className="flex h-full overflow-y-auto space-x-2 ">
            <DaWidgetSetup
              setWidgetUrl={setWidgetUrl}
              isWidgetGenAI={true}
              optionsStr={optionsStr}
            />
          </div>
        )}

        <div className="flex w-full justify-end items-center mt-4">
          <Button
            variant="ghost"
            className="px-4 py-2 text-base mr-2 h-8"
            onClick={() => {
              setOpen(false)
            }}
          >
            Cancel
          </Button>
          {pickedCells && pickedCells.length > 0 && !isWidgetDiscrete && (
            <Button
              variant="default"
              disabled={(isWidgetGenAI || !activeWidget) && !widgetUrl}
              className="px-4 py-2 text-base h-8"
              onClick={() => {
                if (activeTab === 'genAI') {
                  setIsWidgetGenAI(true)
                  handleCreateFromScratch()
                } else {
                  handleAddWidgetClick()
                }
              }}
            >
              {isWidgetGenAI
                ? projectCreating
                  ? 'Creating...'
                  : 'Add widget'
                : 'Add selected widget'}
            </Button>
          )}
        </div>
      </div>
    </DaDialog>
  )
}

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
  const [selectedWidget, setSelectedWidget] = useState<any>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [warningMessage2, setWarningMessage2] = useState<string | null>(null)
  const [isConfigValid, setIsConfigValid] = useState(true)
  const [selectedCells, setSelectedCells] = useState<number[]>([])

  const [isSelectedCellValid, setIsSelectedCellValid] = useState<boolean>(false)
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState<boolean>(false)
  const [targetSelectionCells, setTargetSelectionCells] = useState<number[]>([])

  const codeEditorPopup = useState<boolean>(false)
  const [isAddingFromURL, setIsAddingFromURL] = useState<boolean>(false)
  const [buildinWidgets, setBuildinWidgets] = useState<any[]>(BUILT_IN_WIDGETS)

  useEffect(() => {
    if (!entireWidgetConfig) return
    try {
      const config = JSON.parse(entireWidgetConfig)
      const widgetArray = config.widgets || config
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

  const handleOpenWidget = (index: number) => {
    const widgetConfig = widgetConfigs[index]
    if (widgetConfig.options?.url?.includes('bewebstudio')) {
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
    setSelectedWidgetIndex(null)
  }

  const handleWidgetClick = (index: number) => {
    setSelectedWidgetIndex(index)
    setSelectedCells([])
  }

  const handleUpdateWidget = (widgetConfig: string) => {
    if (selectedWidgetIndex !== null) {
      try {
        const updatedWidgetConfig = JSON.parse(widgetConfig)
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

  const handleAddWidgetFromURL = (wConfig: string) => {
    const widgetConfig = JSON.parse(wConfig)
    const newWidgetConfigs = [...widgetConfigs, widgetConfig]
    onDashboardConfigChanged(JSON.stringify(newWidgetConfigs, null, 4))
    setSelectedCells([])
  }

  const handleOnWidgetEditorSave = (widgetConfig: string) => {
    if (isAddingFromURL) {
      handleAddWidgetFromURL(widgetConfig)
      setIsAddingFromURL(false)
    } else {
      handleUpdateWidget(widgetConfig)
    }
  }

  const handleOnDashboardConfigChanged = (newConfigString: string) => {
    try {
      onDashboardConfigChanged(newConfigString)
      setSelectedCells([])
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
          'group relative flex cursor-pointer select-none border border-gray-300 text-gray-700 text-sm',
          `col-span-${colSpan} row-span-${rowSpan}`,
          selectedWidgetIndex === index &&
            '!border-primary !bg-gray-100 !text-primary',
          'bg-gray-100 hover:bg-gray-100',
        )}
        key={`${index}-${cell}`}
        onClick={() => handleWidgetClick(index)}
      >
        <div className="absolute right-1 top-1 hidden w-fit rounded bg-white group-hover:block">
          <div className="flex items-center">
            <DaTooltip tooltipMessage="Delete widget">
              <Button
                variant="destructive"
                size="sm"
                className="!px-0"
                onClick={() => handleDeleteWidget(index)}
              >
                <TbTrash className="mx-2 h-5 w-5"></TbTrash>
              </Button>
            </DaTooltip>
            {widgetConfig.options?.url &&
              widgetConfig.options.url.includes('bewebstudio') && (
                <DaTooltip tooltipMessage="Open widget in Studio">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!px-0 hover:text-primary"
                    onClick={() => handleOpenWidget(index)}
                  >
                    <TbExternalLink className="mx-2 h-5 w-5" />
                  </Button>
                </DaTooltip>
              )}

            <DaTooltip tooltipMessage="Edit widget">
              <Button
                variant="ghost"
                size="sm"
                className="!px-0 hover:text-primary"
                onClick={() => {
                  setSelectedWidget(JSON.stringify(widgetConfig, null, 4))
                  setIsAddingFromURL(false)
                  codeEditorPopup[1](true)
                }}
              >
                <TbEdit className="mx-2 h-5 w-5" />
              </Button>
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
                    <TbCategory className="text-blue-600 h-full w-full stroke-[1.8] pb-2" />
                  )
                }
              })()}
            </div>
            <div className="w-full pt-2 text-center !text-xs font-semibold">
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
          <div className="flex h-full items-center text-gray-400">
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
                'widget-grid-cell relative flex cursor-pointer items-center justify-center border-2 border-primary !bg-white text-gray-700 gap-2 flex-wrap',
                `col-span-${colSpan} row-span-${rowSpan}`,
              )}
            >
              <DaTooltip tooltipMessage="Add widget from marketplace or built-in">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddWidget()}
                  className="hover:text-gray-700"
                  data-id="dashboard-add-widget-button"
                >
                  <TbCategoryPlus className="mr-1 h-4 w-4" />
                  Add widget
                </Button>
              </DaTooltip>

              <DaTooltip tooltipMessage="Add widget from URL">
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:text-gray-700"
                  data-id="dashboard-add-widget-from-url-button"
                  onClick={() => {
                    setSelectedWidget(
                      JSON.stringify(
                        {
                          ...BUILT_IN_EMBEDDED_WIDGETS,
                          boxes: selectedCells,
                        },
                        null,
                        4,
                      ),
                    )
                    setIsAddingFromURL(true)
                    codeEditorPopup[1](true)
                  }}
                >
                  <TbLinkPlus className="h-4 w-4" />
                </Button>
              </DaTooltip>

              <DaTooltip tooltipMessage="Cancel place widget">
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute right-1 top-1 mr-0"
                  data-id="dashboard-cancel-place-widget-button"
                  onClick={() => setSelectedCells([])}
                >
                  <TbX className="h-5 w-5" />
                </Button>
              </DaTooltip>
            </div>
          )
        }
        return null
      }

      if (widgetIndex !== -1 && !renderedWidgets.has(widgetIndex)) {
        renderedWidgets.add(widgetIndex)
        return widgetItem(widgetConfigs[widgetIndex], widgetIndex, cell)
      } else if (widgetIndex === -1) {
        return (
          <div
            key={`empty-${cell}`}
            className={cn(
              'text-sm text-lg font-semibold flex select-none items-center justify-center border border-gray-300 text-gray-400',
              selectedCells.includes(cell)
                ? 'widget-grid-cell-selected bg-gray-100 text-gray-700'
                : 'widget-grid-cell-empty',
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
        className={cn(
          'grid w-full grid-cols-5 grow grid-rows-2 border border-gray-300',
          editable ? 'cursor-pointer' : '!pointer-events-none',
        )}
        style={{ gridTemplateRows: 'repeat(2)' }}
      >
        {widgetGrid()}
      </div>
      {editable && (
        <span className="py-2 text-sm font-semibold text-orange-500">
          Click on empty cell to place new widget
        </span>
      )}
      {warningMessage && (
        <div className="mt-3 flex w-fit select-none items-center justify-center rounded border border-gray-200 px-2 py-1 shadow-sm">
          <TbExclamationMark className="mr-1 flex h-5 w-5 text-orange-500" />
          <div className="flex text-gray-700">{warningMessage}</div>
        </div>
      )}

      {!hideWidget && (
        <>
          <DaDashboardWidgetEditor
            widgetEditorPopupState={codeEditorPopup}
            selectedWidget={selectedWidget}
            handleUpdateWidget={handleOnWidgetEditorSave}
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

