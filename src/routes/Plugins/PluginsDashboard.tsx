import { FC, useEffect, useState } from "react"
import { Model, Plugin, Prototype } from "../../apis/models"
import loadPlugins from "./loadPlugins"
import { PluginPropWidgets, WidgetType } from "./pluginTypes"
import { DashboardGridType } from "./GridItem/types"
import { runner } from "../components/CodeViewer/runCode"
import { INTERNALS_Proxy } from "../../hooks/useINTERNALSHook"
import SlidingControlCenter from "../components/RunDashboard/ControlCenter/SlidingControlCenter"
import PluginsDashboardGrid from "./PluginsDashboardGrid"
import LoadingPage from "../components/LoadingPage"
import parseCJFromInput from "../components/EditableCustomerJourney/parser/parseCJFromInput"
import useCurrentPrototype from "../../hooks/useCurrentPrototype"
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel"
import useCviApiMonitor from "../../hooks/useCviApiMonitor"
import SelectAndDisplayImage from "../components/PrototypeOverview/SelectAndDisplayImage"
import { REFS } from "../../apis/firebase"
import permissions from "../../permissions"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import UsedWidgetsStatus from "./UsedWidgetsStatus"

interface PluginsDashboardProps {
    code: string
    plugins: Plugin[]
    grid: DashboardGridType | Error
}

const PluginsDashboard: FC<PluginsDashboardProps> = ({plugins, grid, code}) => {
    const { profile } = useCurrentUser()
    const prototype = useCurrentPrototype() as Prototype
    const model = useCurrentModel() as Model
    const [monitor] = useCviApiMonitor()
    
    const [pluginsLoading, setPluginsLoading] = useState(false)
    const [widgetsLibrary, setWidgetsLibrary] = useState<{
        [plugin_widget: string]: WidgetType
    }>({})

    useEffect(() => {
        setPluginsLoading(true)
        setTimeout(async () => {
            const [id, interceptor, hooks] = await loadPlugins(plugins.map(plugin => ({
                name: plugin.name,
                url: plugin.js_code_url
            })), widgetsCreator, {
                customer_journey: parseCJFromInput(prototype.customer_journey) ?? []
            }, {
                model,
                monitor
            })

            ;(runner.iframeWindow as any).PYTHON_BRIDGE = {
                interceptor,
                plugins: hooks,
                INTERNALS: INTERNALS_Proxy
            }
            
            setPluginsLoading(false)
            
        })
    }, [plugins.map(plugin => plugin.js_code_url).join(", ")])

    const widgetsCreator = (plugin_name: string): PluginPropWidgets => {
        return {
            register(name, onActivate) {
                setWidgetsLibrary(widgetsLibrary => ({
                    ...widgetsLibrary,
                    [plugin_name + "::" + name]: {
                        name,
                        plugin_name,
                        boxes: 0,
                        direction: "horizontal",
                        onActivate,
                    }
                }))

                return undefined
            },
        }
    }

    if (pluginsLoading) {
        return <LoadingPage/>
    }

    return (
        <div className="relative flex w-full h-full">
            {(!(grid instanceof Error) && permissions.PROTOTYPE(profile, model, prototype).canEdit()) && (
                <UsedWidgetsStatus plugins={plugins} widgetsLibrary={widgetsLibrary} grid={grid} />
            )}
            <div className="flex flex-col h-full w-full mr-10">
                <PluginsDashboardGrid widgetsLibrary={widgetsLibrary} grid={grid} />
                <div className="flex h-full text-gray-400 bg-gray-100 items-center justify-center select-none font-bold overflow-hidden relative">
                    <div className="flex w-full h-full absolute px-4">
                        <div className="flex h-full text-2xl items-center pr-6">playground.digital.auto</div>
                        <div className="flex w-fit relative ml-auto text-xs">
                            <SelectAndDisplayImage
                            disableNoImagePlaceholder
                            canEdit={permissions.PROTOTYPE(profile, model, prototype).canEdit}
                            db={REFS.prototype}
                            object={prototype}
                            object_key="partner_logo"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <SlidingControlCenter code={code} />
        </div>
    )
}

export default PluginsDashboard