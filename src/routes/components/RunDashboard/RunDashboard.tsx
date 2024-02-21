import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { Model, Prototype } from "../../../apis/models";
import PluginsDashboard from "../../Plugins/PluginsDashboard";
import { GridItem } from "../../Plugins/GridItem/types";
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh";
import { getPlugins } from "../../../apis";
import LoadingPage from "../LoadingPage";
import useINTERNALSHook from "../../../hooks/useINTERNALSHook";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import buildinPlugins from "../../../data/buildinPlugins";
import { DashboardConfig } from "../../Plugins/GridItem/types";
import { useEffect } from "react";

interface RunDashboardProps {
    code: string;
}

const RunDashboard = ({ code }: RunDashboardProps) => {
    // useGlobalBrythonHook("dashboard.CarDash.set_text", (text: string) => {
    //     setCarDashText(text)
    // })

    // useGlobalBrythonHook("dashboard.SmartPhone.set_text", (text: string) => {
    //     setSmartPhoneText(text)
    // })

    // useGlobalBrythonHook("customer_journey.highlight", (text: string) => {
    //     console.log(text)
    // })

    const model = useCurrentModel() as Model;
    const prototype = useCurrentPrototype() as Prototype;

    const parseWidgetConfig = () => {
        // console.log(`parseWidgetConfig`)
        let retObject = {
            auto_run: false,
            widgets: [] as any[],
            simulators: [] as any[],
        };
        if (!prototype.widget_config) {
            return retObject;
        }
        try {
            const parsed = JSON.parse(prototype.widget_config ?? "") as any;
            let rawGrid = [] as any[];
            if (Array.isArray(parsed)) {
                rawGrid = parsed;
            } else {
                retObject.auto_run = parsed.auto_run || false;
                rawGrid = parsed.widgets;
            }
            // console.log(`rawGrid`, rawGrid)
            retObject.widgets = rawGrid.filter((gridItem: any) => {
                return (
                    ["boxes,plugin,widget", "boxes,options,plugin,widget"].includes(
                        Object.keys(gridItem).sort().join(",")
                    ) &&
                    typeof gridItem.plugin === "string" &&
                    typeof gridItem.widget === "string" &&
                    Array.isArray(gridItem.boxes) &&
                    !(gridItem.boxes as unknown[]).find((num) => typeof num !== "number")
                );
            });
        } catch (error) {
            return new Error("Widgets Config is not a valid JSON array.");
        }
        // console.log("retObject", retObject)
        return retObject;
    };

    useINTERNALSHook("update_monitor", ({ name }) => {});

    const { value: plugins } = useAsyncRefresh(
        // () => getPlugins(model.id),
        async () => {
            let modelPlugins = await getPlugins(model.id);

            return buildinPlugins.concat(modelPlugins);
        },
        [model.id],
        5 * 60 * 1000
    );

    // console.log('plugins', plugins)

    if (typeof plugins === "undefined") {
        return <LoadingPage />;
    }

    const dashboard_cfg: DashboardConfig | Error = parseWidgetConfig();
    // Each widget now has a unique key
    const grid =
        dashboard_cfg instanceof Error
            ? dashboard_cfg
            : Object.fromEntries(
                  dashboard_cfg.widgets.map((gridItem, index) => [
                      `${gridItem.plugin}::${gridItem.widget}::${index}`,
                      gridItem,
                  ])
              );

    return (
        <PluginsDashboard
            code={code}
            plugins={plugins}
            grid={grid}
            auto_run={dashboard_cfg instanceof Error ? false : dashboard_cfg.auto_run}
        />
    );
};

export default RunDashboard;
