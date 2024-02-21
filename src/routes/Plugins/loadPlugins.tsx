import dedent from "dedent";
import { Model } from "../../apis/models";
import { createModelProxy } from "../../hooks/createVehicleObject";
import { MonitorType } from "../../hooks/useCviApiMonitor";
import { random } from "../../reusable/functions";
import {
    InterceptorType,
    PluginFunction,
    PluginPropPrototype,
    PluginPropSimulator,
    PluginPropWidgets,
    SimulatorModifier,
} from "./pluginTypes";
import BrythonRunner from "../../brython-runner/BrythonRunner";

type PluginHooksType = {
    [plugin_name: string]: {
        [hook_name: string]: (...args: any[]) => any | Promise<any>;
    };
};

type SimulatorModifiersType = {
    [api_concat_apiType: string]: SimulatorModifier;
};

const transformPluginArgs = (args: any[]) => {
    if (args.length === 0) {
        return args;
    }
    const isAsyncFuncWrapper = (arg: any) => typeof arg === "function" && arg.$infos && arg.$set_defaults;

    // We're not using map to avoid creating an unnecessary new array if not needed
    // We'll first do find. If doesn't exist, will return passed array
    if (typeof args.find(isAsyncFuncWrapper) === "undefined") {
        return args;
    }

    return args.map((arg) => (isAsyncFuncWrapper(arg) ? arg().$func : arg));
};

const loadPlugins = (
    plugin_urls: {
        name: string;
        url: string;
    }[],
    widgetsCreator: (plugin_name: string) => PluginPropWidgets,
    prototype: PluginPropPrototype,
    vehicleObjectOpts: {
        monitor: MonitorType;
        model: Model;
    },
    runner: BrythonRunner
) =>
    new Promise<[string, InterceptorType, PluginHooksType]>(async (resolve) => {
        const id = random();
        const portScript = document.createElement("script");
        portScript.type = "module";
        portScript.textContent = dedent(`
    ${plugin_urls.length === 0 ? `` : `let `}${plugin_urls.map(({ name }, i) => `a${i} = null`).join(", ")}
    ${plugin_urls
        .map(({ name, url }, i) =>
            dedent(`
        try {
            let from = new Date().getTime()
            a${i} = (await import('${url}')).default
            console.log('Get ${url} take ' + (new Date().getTime()-from) + "ms")
        } catch (error) {
            console.error(error)
        }`)
        )
        .join("\n")}

    window['${id}']([${plugin_urls.map(({ name, url }, i) => `['${name.replaceAll("'", "\\'")}', a${i}]`).join(",")}])
    `);

        const pluginHooks: PluginHooksType = {};

        const simulatorFunctions: SimulatorModifiersType = {};

        const interceptor: InterceptorType = (api: string, method: "get" | "set" | "subscribe") => {
            const key = api + "-" + method;
            if (key in simulatorFunctions) {
                return async (args: any[], prevReturnValue: any) => {
                    return (await simulatorFunctions[key]({ args, prevReturnValue })) ?? true;
                };
            } else {
                return null;
            }
        };

        const simulator: PluginPropSimulator = (api, method, func) => {
            const key = api + "-" + method;
            if (!(key in simulatorFunctions)) {
                simulatorFunctions[key] = async ({ args, prevReturnValue }) => {
                    return await func({ args: transformPluginArgs(args), prevReturnValue });
                };
            } else {
                let prevFunc = simulatorFunctions[key];
                simulatorFunctions[key] = async ({ args, prevReturnValue: prevX2ReturnValue }) => {
                    const prevReturnValue = await prevFunc({ args, prevReturnValue: prevX2ReturnValue });
                    return await func({ args: transformPluginArgs(args), prevReturnValue });
                };
            }
        };

        const vehicle = createModelProxy({ ...vehicleObjectOpts, interceptor }, "Vehicle", runner);
        const modelObjectCreator = (root_name: string) =>
            createModelProxy({ ...vehicleObjectOpts, interceptor }, root_name, runner);

        (window as any)[id] = (pluginsFuncs: [string, PluginFunction | null][]) => {
            // console.log(">>>>>>\n>>>>>>\npluginsFuncs", pluginsFuncs)
            for (const [name, pluginFuncs] of pluginsFuncs) {
                if (pluginFuncs === null) {
                    //alert(`Plugin ${name} couldn't be loaded. Check console for errors.`)
                    continue;
                } else if (typeof pluginFuncs !== "function") {
                    //alert(`Plugin ${name} does not have a default-exported function.`)
                    continue;
                }
                try {
                    const hooks =
                        pluginFuncs({
                            widgets: widgetsCreator(name),
                            simulator,
                            prototype,
                            vehicle,
                            modelObjectCreator,
                            runner,
                        }) || {};
                    pluginHooks[name] = Object.fromEntries(
                        Object.entries(hooks).map(([hookName, hookFunc]) => [
                            hookName,
                            (...args: any[]) => hookFunc(...transformPluginArgs(args)),
                        ])
                    );
                } catch (error) {
                    console.error(error);
                    //alert(`Plugin ${name} couldn't be executed. Check console for errors.`)
                }
            }
            // document.body.removeChild(portScript)
            resolve([id, interceptor, pluginHooks]);
        };
        // console.log("portScript", portScript)
        document.body.appendChild(portScript);
    });

export default loadPlugins;
