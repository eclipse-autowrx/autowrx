import { TableDataType } from "../components/EditableCustomerJourney/parser/parseCJFromInput"

interface WidgetOptions {
    boxes: number,
    direction: "horizontal" | "vertical"
}

export type InterceptorType = (
    api: string,
    method: "get" | "set" | "subscribe"
) => (
    ((args: any[], prevReturnValue: any) => Promise<any | true>) | null
)

type WidgetDeactivateFunction = () => void

type PopupDeactivateFunction = () => void

interface BoxType {
    window: Window | null
    injectNode: (node: Node) => void
    injectHTML: (html: string) => void
    triggerPopup: (node: Node, className?: string) => undefined | PopupDeactivateFunction
}

type WidgetActivateFunction = (box: BoxType) => undefined | WidgetDeactivateFunction

export type WidgetType = {
    plugin_name: string
    name: string
    boxes: number
    direction: "horizontal" | "vertical"
    onActivate: WidgetActivateFunction
}

export interface PluginPropWidgets {
    register: (name: string, onActivate: WidgetActivateFunction) => undefined
}

export interface PluginPropPrototype {
    customer_journey: TableDataType
}

export type PluginPropVehicle = {
    [key: string]: any
}

export type SimulatorModifier = <ReturnValueType extends any>(props: {
    args: any[],
    prevReturnValue: ReturnValueType
}
) => Promise<ReturnValueType>

export type PluginPropSimulator = (api: string, method: "get" | "set" | "subscribe", func: SimulatorModifier) => void   

export type PluginProps = {
    widgets: PluginPropWidgets
    simulator: PluginPropSimulator
    prototype: PluginPropPrototype
    vehicle: {
        [key: string]: any
    }
    modelObjectCreator: (root_name: string) => {
        [key: string]: any;
    }    
}

export type PluginFunction = (props: PluginProps) => {
    [key: string]: (...args: any[]) => (any | Promise<any>)
}
