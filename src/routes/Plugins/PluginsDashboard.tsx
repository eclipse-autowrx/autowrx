import { FC, useEffect, useState } from "react";
import { Model, Plugin, Prototype } from "../../apis/models";
import loadPlugins from "./loadPlugins";
import { PluginPropWidgets, WidgetType } from "./pluginTypes";
import { DashboardGridType } from "./GridItem/types";
import { runner } from "../components/CodeViewer/runCode";
import { INTERNALS_Proxy } from "../../hooks/useINTERNALSHook";
import SlidingControlCenter from "../components/RunDashboard/ControlCenter/SlidingControlCenter";
import PluginsDashboardGrid from "./PluginsDashboardGrid";
import LoadingPage from "../components/LoadingPage";
import parseCJFromInput from "../components/EditableCustomerJourney/parser/parseCJFromInput";
import useCurrentPrototype from "../../hooks/useCurrentPrototype";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import useCviApiMonitor from "../../hooks/useCviApiMonitor";
import SelectAndDisplayImage from "../components/PrototypeOverview/SelectAndDisplayImage";
import { REFS } from "../../apis/firebase";
import permissions from "../../permissions";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import UsedWidgetsStatus from "./UsedWidgetsStatus";

interface PluginsDashboardProps {
    code: string;
    auto_run: boolean;
    plugins: Plugin[];
    grid: DashboardGridType | Error;
}

const PluginsDashboard: FC<PluginsDashboardProps> = ({ plugins, grid, code, auto_run }) => {
    const { profile } = useCurrentUser();
    const prototype = useCurrentPrototype() as Prototype;
    const model = useCurrentModel() as Model;
    const [monitor] = useCviApiMonitor();

    const [pluginsLoading, setPluginsLoading] = useState(false);
    const [widgetsLibrary, setWidgetsLibrary] = useState<{
        [plugin_widget: string]: WidgetType;
    }>({});

    // useEffect(() => {
    //     console.log("widgetsLibrary", widgetsLibrary)
    // }, [widgetsLibrary])

    useEffect(() => {
        setPluginsLoading(true);
        let from = new Date().getTime();
        setTimeout(async () => {
            // console.log(`Starting to load plugins`)
            // console.log('grid', grid)
            // console.log('plugins', plugins)
            let usedPluginName: string[] = [];
            for (let key in grid) {
                if (grid[key].plugin) {
                    usedPluginName.push(grid[key].plugin);
                }
            }
            usedPluginName = [...new Set(usedPluginName)];
            let usedPlugins = plugins.filter((plugin) => usedPluginName.includes(plugin.name));
            // console.log('usedPlugins', usedPlugins)

            const [id, interceptor, hooks] = await loadPlugins(
                usedPlugins.map((plugin) => ({
                    name: plugin.name,
                    url: plugin.js_code_url,
                })),
                widgetsCreator,
                {
                    customer_journey: parseCJFromInput(prototype.customer_journey) ?? [],
                },
                {
                    model,
                    monitor,
                },
                runner
            );

            (runner.iframeWindow as any).PYTHON_BRIDGE = {
                interceptor,
                plugins: hooks,
                INTERNALS: INTERNALS_Proxy,
                // apiMap: new Map(),
                // apiSetMap: new Map(),
                // listenerMap: new Map(),
                valueMap: new Map(),
            };
            // console.log(`---\n---\n---\n`)
            // console.log(`Loaded plugins in ${new Date().getTime() - from}ms`)
            setPluginsLoading(false);
        });
    }, [plugins.map((plugin) => plugin.js_code_url).join(", ")]);

    const widgetsCreator = (plugin_name: string): PluginPropWidgets => {
        return {
            register(name, onActivate) {
                setWidgetsLibrary((widgetsLibrary) => ({
                    ...widgetsLibrary,
                    [plugin_name + "::" + name]: {
                        name,
                        plugin_name,
                        boxes: 0,
                        direction: "horizontal",
                        onActivate,
                    },
                }));

                return undefined;
            },
        };
    };

    if (pluginsLoading) {
        return <LoadingPage />;
    }

    return (
        <div className="relative flex w-full h-full">
            {/* {(!(grid instanceof Error) && permissions.PROTOTYPE(profile, model, prototype).canEdit()) && (
                <UsedWidgetsStatus plugins={plugins} widgetsLibrary={widgetsLibrary} grid={grid} />
            )} */}
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
            <SlidingControlCenter code={code} auto_run={auto_run} />
        </div>
    );
};

export default PluginsDashboard;
