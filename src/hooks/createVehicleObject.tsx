import { Model } from "../apis/models";
import getNodeFromFullName from "../routes/components/core/Model/VehicleInterface/utils/getNodeFromFullName";
import { DataType } from "../routes/components/core/Model/VehicleInterface/Spec";
import { InterceptorType } from "../routes/Plugins/pluginTypes";
import { MonitorType, MONITOR_GLOBAL_ACCESS } from "./useCviApiMonitor";
import BrythonRunner from "../brython-runner/BrythonRunner";

const getDatatypeDefault = (datatype: DataType) => {
    const IntTypes = ["uint8", "uint16", "uint32", "int8", "int16", "int32"];
    const FloatTypes = ["float", "double"];
    const StringTypes = ["string"];
    const BoolTypes = ["boolean"];
    const ListOfStringTypes = ["string[]"];
    const ListOfIntTypes = ["uint8[]"];

    if (IntTypes.includes(datatype)) {
        return 0;
    } else if (FloatTypes.includes(datatype)) {
        return 0.0;
    } else if (StringTypes.includes(datatype)) {
        return "";
    } else if (ListOfStringTypes.includes(datatype)) {
        return [];
    } else if (BoolTypes.includes(datatype)) {
        return false;
    } else if (ListOfIntTypes.includes(datatype)) {
        return [];
    }

    throw new Error(`unknown datatype: ${datatype}`);
};

export interface CreateModelObjectOptions {
    interceptor: InterceptorType;
    monitor: MonitorType;
    model: Model;
}

export const createModelProxy = (
    { model, interceptor, ...props }: CreateModelObjectOptions,
    prefix: string = "",
    runner: BrythonRunner
) => {
    const proxy: {
        [key: string]: any;
    } = new Proxy(
        {},
        {
            get: (target, prop, receiver) => {
                const finalName = prop.toString();
                if (finalName === "get") {
                    const { node, isCustom } = getNodeFromFullName(model, prefix);
                    if (node === null) {
                        throw new Error("unexpected error 47");
                    }

                    // 3 Layers
                    // 1. Default value
                    // 2. Last value (currently not using)
                    // 3. interceptor
                    return async () => {
                        if (node.type === "branch") {
                            throw new Error(`'${prop.toString()}' has no get() function`);
                        }
                        // Layer 1
                        let value: boolean | string | number | number[] | string[] = getDatatypeDefault(node.datatype);

                        const monitor = MONITOR_GLOBAL_ACCESS();
                        // Layer 2
                        if (prefix in monitor) {
                            value = monitor[prefix].value;
                        }

                        if (runner) {
                            let iframeWidnow = runner.iframeWindow as any;
                            let valueInMap = iframeWidnow.PYTHON_BRIDGE.valueMap.get(prefix);
                            if (valueInMap != undefined) {
                                value = valueInMap;
                            }
                        }

                        // Layer 3
                        const interceptingFunc = interceptor(prefix, "get");
                        if (interceptingFunc !== null) {
                            value = await interceptingFunc([], JSON.parse(JSON.stringify(value)));
                        }

                        return value;
                    };
                } else if (finalName === "set") {
                    // throw new Error("set() cannot be called from a plugin")
                    const { node, isCustom } = getNodeFromFullName(model, prefix);
                    if (node === null) {
                        throw new Error("unexpected error 47");
                    }
                    return async (newValue: any) => {
                        console.log(`${prefix}.${finalName} ${newValue} ${typeof newValue}`);
                        if (node.type === "branch") {
                            throw new Error(`'${prop.toString()}' has no get() function`);
                        }
                        if (runner) {
                            let iframeWidnow = runner.iframeWindow as any;
                            iframeWidnow.PYTHON_BRIDGE.valueMap.set(prefix, newValue);
                        } else {
                            console.log("runner is null");
                        }

                        return true;
                    };
                } else if (finalName === "subscribe") {
                    throw new Error("subscribe() cannot be called from a plugin");
                } else {
                    const fullName = prefix + "." + finalName;
                    if (getNodeFromFullName(model, fullName).node === null) {
                        throw new Error(`${prefix} has no child ${finalName}`);
                    }
                    return createModelProxy({ model, interceptor, monitor: props.monitor }, fullName, runner);
                }
            },
        }
    );

    return proxy;
};
