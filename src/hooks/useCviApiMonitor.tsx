import { useEffect } from "react"
import useINTERNALSHook from "./useINTERNALSHook"

type ValidValueTypes = boolean | string | number | number[] | string[]

interface ApiMessage {
    name: string
    value: ValidValueTypes
    called: number
    history: ValidValueTypes[]
}

export interface MonitorType {
    [node_name: string]: ApiMessage
}

let monitor: MonitorType = {}

const useCviApiMonitor = () => {
    useINTERNALSHook("update_monitor", (message: ApiMessage) => {
        monitor[message.name] = message
    })

    const clearMonitor = () => {
        monitor = {}
    }

    useEffect(() => {
        return () => clearMonitor()
    }, [])

    return [monitor, clearMonitor] as const
}

export const MONITOR_GLOBAL_ACCESS = () => monitor

export default useCviApiMonitor