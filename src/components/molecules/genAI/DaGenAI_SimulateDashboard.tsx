import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from '../dashboard/DaDashboardGrid'
import { MdOutlineDesignServices } from 'react-icons/md'
import { TbDeviceFloppy } from 'react-icons/tb'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import DaDashboardEditor from '../dashboard/DaDashboardEditor'
import { DaButton } from '@/components/atoms/DaButton'
import DaDashboardTemplate from '../DaDashboardTemplate'
import dashboard_templates from '@/data/dashboard_templates'
import { cloneDeep } from 'lodash'
import DaText from '@/components/atoms/DaText'

const MODE_RUN = 'run'
const MODE_EDIT = 'edit'

const DaGenAI_SimulateDashboard: FC = ({}) => {
  const {
    wizardPrototype: prototypeData,
    setPrototypeData,
    activeModelApis,
    wizardActiveRtId,
  } = useWizardGenAIStore()
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [templates, setTemplates] = useState(cloneDeep(dashboard_templates))
  const [selected, setSelected] = useState<number | null>(0)
  const [usedApis, setUsedApis] = useState<any[]>([])

  useEffect(() => {
    let widgetItems = []
    if (prototypeData.widget_config && prototypeData.widget_config.length > 0) {
      try {
        let dashboard_config = JSON.parse(prototypeData.widget_config)
        if (Array.isArray(dashboard_config)) {
          widgetItems = dashboard_config
        } else {
          if (
            dashboard_config?.widgets &&
            Array.isArray(dashboard_config.widgets)
          ) {
            widgetItems = dashboard_config.widgets
          }
        }
      } catch (err) {
        console.error('Error parsing widget config', err)
      }
    } else {
      // Set as default template if no widget_config
      setPrototypeData({ widget_config: dashboard_templates[0].config })
    }
    //
    processWidgetItems(widgetItems)
    setWidgetItems(widgetItems)
  }, [prototypeData.widget_config])

  useEffect(() => {
    if (
      !prototypeData.code ||
      !activeModelApis ||
      activeModelApis.length === 0
    ) {
      setUsedApis([])
      return
    }
    let apis: any[] = []
    let code = prototypeData.code || ''
    activeModelApis.forEach((item: any) => {
      if (code.includes(item.shortName)) {
        apis.push(item.name)
      }
    })
    setUsedApis(apis)
  }, [prototypeData.code, activeModelApis])

  const processWidgetItems = (widgetItems: any[]) => {
    if (!widgetItems) return
    widgetItems.forEach((widget) => {
      if (!widget?.url) {
        if (widget.options?.url) {
          widget.url = widget.options.url
        }
      }
    })
  }

  // New useEffect to update options.apis of the table-settable widget
  useEffect(() => {
    if (!widgetItems || widgetItems.length === 0) return

    let needsUpdate = false

    // Update widgetItems with new apis
    let updatedWidgetItems = widgetItems.map((widget: any) => {
      if (
        widget.options &&
        widget.options.url &&
        widget.options.url.includes('table-settable')
      ) {
        // Get existing apis from the settable widget
        const existingApis = widget.options.apis || []
        // Determine if the APIs have changed to avoid unnecessary updates
        const apisChanged =
          existingApis.length !== usedApis.length ||
          !existingApis.every(
            (api: string, idx: number) => api === usedApis[idx], // Check if each API matches the corresponding used API
          )
        if (apisChanged) {
          needsUpdate = true
          return {
            ...widget, // Copy existing widget properties
            options: {
              ...widget.options, // Copy existing options
              apis: usedApis, // Only update the apis array with usedApis
            },
          }
        } else {
          return widget
        }
      } else {
        return widget
      }
    })

    if (needsUpdate) {
      // Create the updated widget_config
      let updatedConfig
      try {
        let dashboard_config = JSON.parse(prototypeData.widget_config)
        if (Array.isArray(dashboard_config)) {
          // If the configuration is an array, it's the widgets array
          // So we replace it directly with the updated widget items
          updatedConfig = updatedWidgetItems
        } else if (
          dashboard_config?.widgets &&
          Array.isArray(dashboard_config.widgets)
        ) {
          updatedConfig = {
            ...dashboard_config, // Copy the existing config auto_run,...
            widgets: updatedWidgetItems,
          }
        } else {
          // For any other format, attempt to set the widgets property
          updatedConfig = {
            ...dashboard_config,
            widgets: updatedWidgetItems,
          }
        }
        // Save the updatedConfig
        handleDashboardConfigChanged(JSON.stringify(updatedConfig))
      } catch (err) {
        console.error('Error parsing widget config', err)
      }
    }
  }, [usedApis])

  const handleDashboardConfigChanged = (config: any) => {
    let parsedConfig = JSON.parse(config) // Parse the incoming config string to object

    // Check if the parsed config already has the correct format
    const widget_config =
      parsedConfig.autorun !== undefined && Array.isArray(parsedConfig.widgets)
        ? parsedConfig // If it's already in the correct format, use it as-is
        : {
            autorun: false,
            widgets: parsedConfig,
          }
    setPrototypeData({ widget_config: JSON.stringify(widget_config) }) // Store as JSON string
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pr-2">
      <div className="flex w-full h-fit items-start pb-3">
        <DaButton
          className="flex w-fit"
          size="sm"
          variant="outline-nocolor"
          onClick={() => setMode(mode === MODE_RUN ? MODE_EDIT : MODE_RUN)}
        >
          <div className="flex items-center">
            {mode === MODE_RUN ? (
              <>
                <MdOutlineDesignServices className="size-5 mr-2" />
                Design Dashboard
              </>
            ) : (
              <>
                <TbDeviceFloppy className="size-5 mr-2" />
                Save
              </>
            )}
          </div>
        </DaButton>
      </div>

      <div className="flex flex-col w-full h-full ">
        {mode === MODE_RUN && (
          <DaDashboardGrid
            widgetItems={widgetItems}
            key={JSON.stringify(
              wizardActiveRtId
                ? widgetItems + wizardActiveRtId
                : wizardActiveRtId,
            )} // Force re-render when widgetItems or Runtime change
          />
        )}
        {mode === MODE_EDIT && (
          <div className="flex flex-col w-full h-full">
            <DaDashboardEditor
              entireWidgetConfig={prototypeData.widget_config}
              editable={true}
              onDashboardConfigChanged={handleDashboardConfigChanged}
              isWizard={true}
            />
            <DaText variant="sub-title" className="flex text-da-primary-500">
              Select Dashboard Template
            </DaText>

            <div className="mt-4 h-fit grid grid-cols-4 gap-4">
              {templates.map((template, index) => (
                <div className="col-span-1" key={index}>
                  <DaDashboardTemplate
                    onClick={() => {
                      setSelected(index)
                      handleDashboardConfigChanged(template.config)
                    }}
                    selected={selected === index}
                    template={template}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DaGenAI_SimulateDashboard
