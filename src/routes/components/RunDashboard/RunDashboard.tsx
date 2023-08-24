import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { Model, Prototype } from "../../../apis/models";
import PluginsDashboard from "../../Plugins/PluginsDashboard";
import { GridItem } from "../../Plugins/GridItem/types";
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh";
import { getPlugins } from "../../../apis";
import LoadingPage from "../LoadingPage";
import useINTERNALSHook from "../../../hooks/useINTERNALSHook";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";

interface RunDashboardProps {
    code: string
}

const RunDashboard = ({code}: RunDashboardProps) => {
    // useGlobalBrythonHook("dashboard.CarDash.set_text", (text: string) => {
    //     setCarDashText(text)
    // })

    // useGlobalBrythonHook("dashboard.SmartPhone.set_text", (text: string) => {
    //     setSmartPhoneText(text)
    // })

    // useGlobalBrythonHook("customer_journey.highlight", (text: string) => {
    //     console.log(text)
    // })

    const model = useCurrentModel() as Model
    const prototype = useCurrentPrototype() as Prototype

    const parseWidgetConfig = () => {
        if (!prototype.widget_config) {
            return []
        }
        try {
            const parsed = JSON.parse(prototype.widget_config ?? "") as unknown[]
            if (!Array.isArray(parsed)) {
                return []
            }
            return parsed.filter(gridItem => {
                return (
                    Object.keys(gridItem).sort().join(",") === "boxes,plugin,widget" &&
                    typeof gridItem.plugin === "string" &&
                    typeof gridItem.widget === "string" &&
                    Array.isArray(gridItem.boxes) &&
                    !(gridItem.boxes as unknown[]).find(num => typeof num !== "number")
                )
            }) as GridItem[]
        } catch (error) {
            return new Error("Widgets Config is not a valid JSON array.")
        }
    }

    useINTERNALSHook("update_monitor", ({name}) => {
    })

    const {value: plugins} = useAsyncRefresh(
        () => getPlugins(model.id),
        [model.id],
        5 * 60 * 1000
    )
    if (typeof plugins === "undefined") {
        return <LoadingPage />
    }

    const parsedGrid: GridItem[] | Error = parseWidgetConfig()
    const grid = parsedGrid instanceof Error ? parsedGrid : (
        Object.fromEntries(parsedGrid.map(gridItem => [gridItem.plugin + "::" + gridItem.widget, gridItem]))
    )
    
    return (
        <PluginsDashboard
        code={code}
        plugins={plugins}
        grid={grid}
        />
    )
}

export default RunDashboard
