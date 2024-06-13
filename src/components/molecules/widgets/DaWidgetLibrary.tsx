// TODO: this file need to be refactored, maximum 250 lines

import { FC, useEffect, useState, useRef } from 'react'
import DaPopup from '../../atoms/DaPopup'
import { MdOutlineWidgets } from 'react-icons/md'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import {
  createNewWidgetByWebStudio,
  convertProjectPublicLinkToEditorLink,
} from '@/services/webStudio.service'
import BUILT_IN_WIDGETS from '@/data/builtinWidgets'
import { DaInput } from '../../atoms/DaInput'
import {
  TbDownload,
  TbHeart,
  TbSearch,
  TbShoppingCart,
  TbLayoutGrid,
  TbPlus,
  TbExternalLink,
} from 'react-icons/tb'
import { DaButton } from '../../atoms/DaButton'
import { isContinuousRectangle } from '@/lib/utils'
import { toast } from 'react-toastify'

import { BsStars } from 'react-icons/bs'
import CodeEditor from '../CodeEditor'
import DaMarketWidgetDetail from './DaMarketWidgetDetail'
// import WidgetSetup from "./WidgetSetup";

import useSelfProfileQuery from '@/hooks/useSelfProfile'
import {
  loadMarketWidgets,
  searchWidget,
  loadWidgetReviews,
} from '@/services/widget.service'
import { DaText } from '../../atoms/DaText'
import DaTabItem from '../../atoms/DaTabItem'
import DaWidgetReview from './DaWidgetReview'
import DaWidgetSetup from './DaWidgetSetup'

interface DaWidgetLibraryProp {
  entireWidgetConfig: string
  updateDashboardCfg: (val: string) => void
  openPopup?: any
  onClose?: any
  targetSelectionCells?: any
}

const DaWidgetLibrary: FC<DaWidgetLibraryProp> = ({
  entireWidgetConfig,
  updateDashboardCfg,
  openPopup,
  onClose,
  targetSelectionCells,
}) => {
  const popupState = useState(false)
  const [prototype] = useModelStore(
    (state) => [state.prototype as Prototype],
    shallow,
  )
  const { data: user } = useSelfProfileQuery()

  const modalRef = useRef<HTMLDivElement>(null)

  let [buildinWidgets, setBuildinWidgets] = useState<any[]>(BUILT_IN_WIDGETS)
  let [marketWidgets, setMarketWidgets] = useState<any[]>([])
  let [renderWidgets, setRenderWidgets] = useState<any[]>([])
  let [activeTab, setActiveTab] = useState<'builtin' | 'market' | 'genAI'>(
    'market',
  )

  let [usageCells, setUsedCells] = useState<any[]>([])
  let [pickedCells, setPickedCells] = useState<any[]>([])
  let [activeWidget, setActiveWidget] = useState<any>(null)

  const [optionsStr, setOptionStr] = useState<string>('')
  const [projectCreating, setProjectCreating] = useState<boolean>(false)
  const [isCreateMyOwnWidget, setIsCreateMyOwnWidget] = useState<boolean>(false)

  // Related to Widget Gen AI
  const [isWidgetGenAI, setIsWidgetGenAI] = useState<boolean>(true)
  const [widgetUrl, setWidgetUrl] = useState<string>('')

  const [searchText, setSearchText] = useState<string>('')
  const [isWidgetDiscrete, setIsWidgetDiscrete] = useState<boolean>(false)

  const [isExpanded, setIsExpanded] = useState<boolean>(false) // Expand used APIs dropdown list
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [editorHeight, setEditorHeight] = useState('')
  const [widgetReviews, setWidgetReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchWidgetReviews = async () => {
      if (!activeWidget) {
        setWidgetReviews([])
        return
      }
      const reviews = await loadWidgetReviews(activeWidget.id)
      setWidgetReviews(reviews)
    }

    fetchWidgetReviews()
  }, [activeWidget])

  // Monaco editor height not auto resize in modal, so we need to calculate the height manually
  useEffect(() => {
    const lineHeight = 20
    const lines = optionsStr.split('\n').length // Count the number of new lines
    let calculatedHeight = lines * lineHeight + 15 // 15px for padding at the bottom
    // console.log('calculatedHeight', calculatedHeight);
    setEditorHeight(`${calculatedHeight}px`)
  }, [optionsStr])

  // Check openPopup to set popupState
  useEffect(() => {
    if (openPopup) {
      popupState[1](true)
    }
  }, [openPopup])

  useEffect(() => {
    if (popupState[0]) {
      onClose()
    }
  }, [popupState[0]])

  // Handle case when entireWidgetConfig is an object instead of an array
  const normalizeWidgetConfig = (configStr: any) => {
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

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  useEffect(() => {
    setIsWidgetDiscrete(!isContinuousRectangle(pickedCells))
  }, [pickedCells])

  // Add filterWidgets function
  const filterWidgets = (widgets: any) => {
    return widgets.filter((widget: any) => {
      const label = widget.label || widget.widget || ''
      return label.toLowerCase().includes(searchText.toLowerCase())
    })
  }
  useEffect(() => {
    let filteredWidgets = []
    if (activeTab === 'builtin') {
      filteredWidgets = filterWidgets(buildinWidgets)
    } else if (activeTab === 'market') {
      filteredWidgets = filterWidgets(marketWidgets)
    }
    setRenderWidgets(filteredWidgets)
  }, [searchText, buildinWidgets, marketWidgets, activeTab])

  useEffect(() => {
    if (!popupState[0]) {
      setActiveTab('market')
      setActiveWidget(null)
      setOptionStr('')
      setPickedCells([])
      setIsCreateMyOwnWidget(false)
      setProjectCreating(false)
      setWidgetUrl('')
    }
  }, [popupState[0]])

  useEffect(() => {
    const fetchWidgets = async () => {
      const widgets = await loadMarketWidgets()
      setMarketWidgets(widgets)
    }

    fetchWidgets()
  }, [])

  useEffect(() => {
    setActiveWidget(null)
    switch (activeTab) {
      case 'builtin':
        setIsCreateMyOwnWidget(false)
        setIsWidgetGenAI(false)
        setRenderWidgets(buildinWidgets)
        break
      case 'market':
        setIsCreateMyOwnWidget(false)
        setIsWidgetGenAI(false)
        setRenderWidgets(marketWidgets)
        break
      case 'genAI':
        setActiveWidget({})
        setIsCreateMyOwnWidget(true)
        setIsWidgetGenAI(true)
        break
      default:
        setRenderWidgets([])
        break
    }
  }, [activeTab])

  useEffect(() => {
    let tmp_usageCells: any[] = []
    const normalizedWidgetConfigs = normalizeWidgetConfig(entireWidgetConfig)

    normalizedWidgetConfigs.forEach((widgetConfig: any) => {
      if (widgetConfig.boxes && Array.isArray(widgetConfig.boxes)) {
        tmp_usageCells = [...tmp_usageCells, ...widgetConfig.boxes]
      }
    })

    setUsedCells(tmp_usageCells)
  }, [entireWidgetConfig])

  useEffect(() => {
    // console.log("activeWidget", activeWidget);
    // console.log('activeWidget', activeWidget)
    // console.log('activeWidget.options', activeWidget && activeWidget.options)
    if (activeWidget && activeWidget.options) {
      setOptionStr(JSON.stringify(activeWidget.options, null, 4))
    } else {
      setOptionStr('{}')
    }
  }, [activeWidget])

  const applyActiveWidget = async (widget: any) => {
    if (!widget) return

    if (activeTab === 'market') {
      try {
        const widgetDetails = await searchWidget(widget.id)
        if (widgetDetails) {
          // console.log('widgetDetails', widgetDetails);
          setActiveWidget(widgetDetails)
        }
      } catch (error) {
        console.error('Error fetching widget details:', error)
      }
    } else {
      setActiveWidget(widget) // For built-in widget
    }
  }

  const handleAddWidgetClick = async () => {
    if (!updateDashboardCfg) return

    let newWidgetConfig = {}

    if (activeWidget) {
      let options = JSON.parse(optionsStr)
      if (activeTab === 'market') {
        options['iconURL'] = activeWidget.icon
      }
      newWidgetConfig = {
        plugin: activeWidget.plugin,
        widget: activeWidget.widget,
        options: options,
        boxes: pickedCells,
      }
      // If activeWidget append optionStr with "iconURL":"URL" in options
    } else {
      console.error('Active widget is null')
      return
    }

    let curWidgetConfigs = normalizeWidgetConfig(entireWidgetConfig)
    curWidgetConfigs.push(newWidgetConfig)
    updateDashboardCfg(JSON.stringify(curWidgetConfigs, null, 4))
    popupState[1](false)
  }

  const handleCreateFromScratch = async () => {
    let newWidgetConfig = {}
    // console.log("handleCreateFromScratch", isWidgetGenAI);
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

    let curWidgetConfigs = normalizeWidgetConfig(entireWidgetConfig)
    curWidgetConfigs.push(newWidgetConfig)
    await updateDashboardCfg(JSON.stringify(curWidgetConfigs, null, 4))
    popupState[1](false)
  }

  // Init picked cells passed from DashboardEditor
  useEffect(() => {
    if (targetSelectionCells) {
      setPickedCells(targetSelectionCells)
    }
  }, [targetSelectionCells])

  return (
    <DaPopup
      ref={modalRef}
      state={popupState}
      trigger={
        <div className="py-1 px-2 cursor-pointer hover:da-gray-dark-light text-da-primary-500 rounded hidden">
          Pick a widget from gallery
        </div>
      }
      width="85%"
      className="rounded-lg"
    >
      <div className="select-none text-da-primary-500">
        <DaText variant="sub-title" className="text-da-primary-500 mb-2">
          Place new widget to dashboard
        </DaText>
        <div className="flex w-full justify-between items-center">
          <div className="flex mb-2 w-fit rounded !da-label-small mt-2">
            <DaTabItem
              active={activeTab === 'builtin'}
              onClick={() => setActiveTab('builtin')}
            >
              <TbLayoutGrid className="mr-2" />
              Built-in ({buildinWidgets.length})
            </DaTabItem>
            <DaTabItem
              active={activeTab === 'market'}
              onClick={() => setActiveTab('market')}
            >
              <TbShoppingCart className="mr-2" />
              Marketplace ({marketWidgets.length})
            </DaTabItem>

            <DaTabItem
              active={activeTab === 'genAI'}
              onClick={() => setActiveTab('genAI')}
            >
              <BsStars className="mr-2" />
              Widget ProtoPilot
            </DaTabItem>
          </div>
          {activeTab !== 'genAI' && (
            <DaButton
              variant="plain"
              className="h-8"
              onClick={() => {
                setIsWidgetGenAI(false)
                handleCreateFromScratch()
              }}
              disabled={projectCreating}
            >
              <TbExternalLink className="mr-2" />
              {projectCreating ? '...' : 'Create widget with Studio'}
            </DaButton>
          )}
        </div>

        {(activeTab == 'builtin' || activeTab == 'market') && (
          <div className="flex items-stretch h-[500px] max-h-[80vh] space-x-2 pt-2">
            <div className="w-[320px] mr-2 flex flex-col">
              {renderWidgets && (
                <>
                  <DaInput
                    inputClassName=" text-[16px] placeholder-da-gray-dark"
                    className="bg-da-white border-da-gray-medium"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search Widget"
                    iconBefore
                    Icon={TbSearch}
                    iconSize={20}
                  />
                  <div className="grow">
                    <div className="max-h-[440px] w-full flex flex-col space-y-2 overflow-y-auto scroll-gray mt-3">
                      {renderWidgets.map((widget: any, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            applyActiveWidget(widget)
                          }}
                          className={`flex h-[120px] max-h-[120px] rounded px-1 py-1 mr-2 cursor-pointer border hover:border-gray-400
                                                        ${
                                                          activeWidget &&
                                                          activeWidget.plugin ==
                                                            widget.plugin &&
                                                          activeWidget.id ==
                                                            widget.id
                                                            ? 'border-aiot-blue bg-aiot-blue/5'
                                                            : ''
                                                        }`}
                        >
                          <div className="aspect-square grid place-items-center min-w-[100px] max-w-[100px]">
                            {!widget.icon && (
                              <MdOutlineWidgets
                                size={52}
                                className="text-gray-300"
                              />
                            )}
                            {widget.icon && (
                              <img
                                src={widget.icon}
                                className="w-[100px] aspect-square rounded-lg object-contain"
                              />
                            )}
                          </div>
                          <div className="px-4 py-1 truncate text-ellipsis text-da-primary-500 text-base">
                            <DaText variant="regular-bold">
                              {widget.label || widget.widget}
                            </DaText>
                            {widget.likes != undefined && (
                              <>
                                <div className="py-1 text-sm leading-tight max-h-[30px] max-w-max truncate text-ellipsis text-da-gray-dark">
                                  {widget.desc}
                                </div>
                                <div className="mt-2 flex items-center text-da-gray-dark da-label-small">
                                  <TbHeart
                                    className="w-4 h-4"
                                    style={{ strokeWidth: 1.8 }}
                                  />
                                  <div className="ml-1 mr-4">
                                    {widget.likes?.length}
                                  </div>
                                  <TbDownload
                                    className="w-4 h-4"
                                    style={{ strokeWidth: 1.8 }}
                                  />
                                  <div className="ml-1">
                                    {widget.downloads || 0}
                                  </div>
                                </div>
                              </>
                            )}
                            <div>{}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderWidgets.length == 0 && searchText && (
                      <div className="grid da-label-regular px-2 text-da-gray-medium italic place-items-center">{`No widget match "${searchText}"`}</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex grow h-full flex-col pl-4 pr-1 overflow-x-hidden scroll-gray text-da-gray-dark border-l border-da-gray-light">
              {!activeWidget && (
                <div className="bg-da-gray-light text-da-gray-medium da-label-regular w-full h-full rounded-xl grid place-items-center">
                  No widget selected
                </div>
              )}
              {activeWidget && (
                <div className="flex flex-col w-full pb-4 flex-1">
                  {activeWidget &&
                    activeTab === 'market' &&
                    activeWidget.id && (
                      <div className="flex w-full pr-7 mt-2">
                        <DaMarketWidgetDetail activeWidget={activeWidget} />
                      </div>
                    )}
                  <div className="flex flex-col pr-8 pt-1">
                    <div className="text-da-gray-medium da-label-regular italic">
                      Options
                    </div>
                    <div
                      className="flex pointer-events-none"
                      style={{ minHeight: editorHeight }}
                    >
                      <CodeEditor
                        code={optionsStr}
                        editable={true}
                        setCode={setOptionStr}
                        language="json"
                        onBlur={() => {}}
                      />
                    </div>
                    {activeTab === 'market' &&
                      widgetReviews &&
                      widgetReviews.length > 0 && (
                        <div className="flex flex-col w-full h-full">
                          <div className="text-da-gray-medium text-md italic">
                            Ratings and reviews
                          </div>
                          <div className="flex flex-col w-full h-full overflow-y-auto">
                            <DaWidgetReview reviews={widgetReviews} />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab == 'genAI' && (
          <div className="flex items-stretch h-[500px] max-h-[80vh] space-x-2">
            <DaWidgetSetup
              setWidgetUrl={setWidgetUrl}
              modalRef={modalRef}
              isWidgetGenAI={true}
              isCreateMyOwnWidget={true}
              optionsStr={optionsStr}
              setOptionStr={setOptionStr}
            />
          </div>
        )}
        <div className="flex w-full h-full justify-between items-center pt-10">
          <div className="grow"></div>
          <div className="flex">
            <DaButton
              variant="plain"
              className="px-4 py-2 !text-base mr-2 h-8"
              onClick={() => {
                popupState[1](false)
              }}
            >
              Cancel
            </DaButton>
            {pickedCells && pickedCells.length > 0 && !isWidgetDiscrete && (
              <DaButton
                variant="solid"
                disabled={
                  (isCreateMyOwnWidget || isWidgetGenAI || !activeWidget) &&
                  !widgetUrl
                }
                className="px-4 py-2 !text-base h-8"
                onClick={() => {
                  if (activeTab === 'genAI') {
                    setIsWidgetGenAI(true)
                    handleCreateFromScratch()
                  } else {
                    handleAddWidgetClick()
                  }
                }}
              >
                {isCreateMyOwnWidget
                  ? projectCreating
                    ? 'Creating...'
                    : 'Add widget'
                  : 'Add selected widget'}
              </DaButton>
            )}
          </div>
        </div>
      </div>
    </DaPopup>
  )
}

export default DaWidgetLibrary
