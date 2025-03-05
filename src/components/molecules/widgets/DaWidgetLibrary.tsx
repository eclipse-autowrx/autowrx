import { FC, useEffect, useState, useRef } from 'react'
import DaPopup from '../../atoms/DaPopup'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { createNewWidgetByWebStudio } from '@/services/webStudio.service'
import BUILT_IN_WIDGETS from '@/data/builtinWidgets'
import { TbShoppingCart, TbLayoutGrid, TbExternalLink } from 'react-icons/tb'
import { DaButton } from '../../atoms/DaButton'
import { isContinuousRectangle, parseWidgetConfig } from '@/lib/utils'
import { toast } from 'react-toastify'
import { BsStars } from 'react-icons/bs'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { DaText } from '../../atoms/DaText'
import DaTabItem from '../../atoms/DaTabItem'
import DaWidgetSetup from './DaWidgetSetup'
import DaWidgetList from './DaWidgetList'
import useListMarketplaceWidgets from '@/hooks/useListMarketplaceWidgets'

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
    (state) => [state.prototype as Prototype],
    shallow,
  )
  const { data: user } = useSelfProfileQuery()
  const { data: marketWidgets } = useListMarketplaceWidgets()
  const modalRef = useRef<HTMLDivElement>(null)
  const buildinWidgets = BUILT_IN_WIDGETS
  let [renderWidgets, setRenderWidgets] = useState<any[]>([])
  let [activeTab, setActiveTab] = useState<'builtin' | 'market' | 'genAI'>(
    'market',
  )

  let [activeWidget, setActiveWidget] = useState<any>(null)
  let [pickedCells, setPickedCells] = useState<any[]>([])
  const [optionsStr, setOptionStr] = useState<string>('')
  const [projectCreating, setProjectCreating] = useState<boolean>(false)

  // Related to Widget Gen AI
  const [isWidgetGenAI, setIsWidgetGenAI] = useState<boolean>(true)
  const [widgetUrl, setWidgetUrl] = useState<string>('')
  const [isWidgetDiscrete, setIsWidgetDiscrete] = useState<boolean>(false)

  const PIN_WIDGETS = [
    { name: 'Single Signal Widget', weight: 0 },
    { name: 'Chart Signal Widget', weight: 1 },
    { name: 'Signal List Settable', weight: 2 },
    { name: 'Terminal', weight: 3 },
    { name: 'Image by Signal value', weight: 4 },
    { name: 'Map', weight: 5 },
    { name: 'General 3D Car Model', weight: 6 },
    { name: 'Simple Fan Widget', weight: 7 },
    { name: 'Simple Wiper Widget', weight: 8 },
  ]

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
    popupState[1](false)
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
    popupState[1](false)
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
    try {
      widgets = JSON.parse(JSON.stringify(marketWidgets))
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
    setRenderWidgets(widgets)
    // setRenderWidgets(activeTab === 'builtin' ? buildinWidgets : marketWidgets)
  }, [activeTab, marketWidgets])

  useEffect(() => {
    let tmp_usageCells: any[] = []
    const widgetConfig = parseWidgetConfig(entireWidgetConfig) // Assuming this is an array of widget config objects

    // Ensure widgetConfig is an array before using forEach
    if (Array.isArray(widgetConfig)) {
      widgetConfig.forEach((config: any) => {
        if (config.boxes && Array.isArray(config.boxes)) {
          tmp_usageCells = [...tmp_usageCells, ...config.boxes]
        }
      })
    }
  }, [entireWidgetConfig])
  useEffect(() => {
    if (activeWidget && activeWidget.options) {
      setOptionStr(JSON.stringify(activeWidget.options, null, 4))
    } else {
      setOptionStr('{}')
    }
  }, [activeWidget])

  useEffect(() => {
    setIsWidgetDiscrete(!isContinuousRectangle(pickedCells))
  }, [pickedCells])

  return (
    <DaPopup
      ref={modalRef}
      state={popupState}
      trigger={
        <div className="py-1 px-2 cursor-pointer hover:da-gray-dark-light text-da-primary-500 rounded hidden">
          Pick a widget from gallery
        </div>
      }
    >
      <div className="flex flex-col w-full min-w-[80vw] xl:min-w-[60vw] lg:max-w-[80vw] h-[90vh] xl:h-[75vh] select-none text-da-primary-500 ">
        <DaText variant="sub-title" className="text-da-primary-500 mb-2">
          Place new widget to dashboard
        </DaText>
        <div className="flex w-full justify-between items-center">
          <div className="flex mb-2 w-fit rounded !da-label-small mt-2">
            {/* <DaTabItem
              active={activeTab === 'builtin'}
              onClick={() => setActiveTab('builtin')}
            >
              <TbLayoutGrid className="mr-2" />
              Built-in ({buildinWidgets.length})
            </DaTabItem> */}
            {marketWidgets && (
              <DaTabItem
                active={activeTab === 'market'}
                onClick={() => setActiveTab('market')}
              >
                <TbShoppingCart className="mr-2" />
                Marketplace ({marketWidgets.length})
              </DaTabItem>
            )}

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
        {activeTab == 'market' && (
          <div className="flex h-full overflow-y-auto space-x-2  my-2">
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
              disabled={(isWidgetGenAI || !activeWidget) && !widgetUrl}
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
              {isWidgetGenAI
                ? projectCreating
                  ? 'Creating...'
                  : 'Add widget'
                : 'Add selected widget'}
            </DaButton>
          )}
        </div>
      </div>
    </DaPopup>
  )
}

export default DaWidgetLibrary
