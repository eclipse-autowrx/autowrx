import { useEffect } from "react"

type TriggersSoftTyping = "update_monitor"

type AnyFunction = (...args: any[]) => void

const listeners: {
    [name: string]: AnyFunction[]
} = {}

const useINTERNALSHook = (name: TriggersSoftTyping, listener: AnyFunction, dependencies: any[] = []) => {
    listeners[name] = listeners[name] ?? []
    useEffect(() => {
        const insertAt = listeners[name].length
        listeners[name][insertAt] = listener
        return () => {
            listeners[name].splice(insertAt, 1)
        }
    }, [name, ...dependencies])
}

export const INTERNALS_Proxy = {
    update_monitor: (...args: any[]) => {
        for (const listener of listeners["update_monitor"]) {
            listener(...args)
        }
    }
}

export default useINTERNALSHook