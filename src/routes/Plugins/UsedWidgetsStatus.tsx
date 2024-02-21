import { FC } from "react";
import { VscCircleFilled } from "react-icons/vsc";
import Dropdown from "../../reusable/Dropdown";
import { Plugin } from "../../apis/models";
import { DashboardGridType } from "./GridItem/types";
import { WidgetType } from "./pluginTypes";
import copyText from "../../reusable/copyText";

const UsedWidgetsStatus: FC<{
    plugins: Plugin[];
    grid: DashboardGridType;
    widgetsLibrary: {
        [plugin_widget: string]: WidgetType;
    };
}> = ({ plugins, grid, widgetsLibrary }) => {
    return (
        <div className="absolute" style={{ top: "-37px", right: "160px" }}>
            <Dropdown
                trigger={
                    <div
                        className="flex text-gray-500 z-10 rounded px-3 py-1 select-none items-center cursor-pointer"
                        style={{ boxShadow: "rgb(0 0 0 / 16%) 0px 1px 4px" }}
                    >
                        <VscCircleFilled className="mr-1" color="#16a34a" />
                        <div className="text-sm font-bold">{Object.keys(widgetsLibrary).length} Widgets</div>
                    </div>
                }
            >
                <div className="flex flex-col w-full py-2">
                    {plugins.map((plugin, j) => (
                        <div key={j} className="flex flex-col px-3 py-1 text-sm">
                            <div className="flex text-gray-500 items-center select-none font-bold">{plugin.name}</div>
                            <div className="flex flex-col pl-3">
                                {Object.entries(widgetsLibrary)
                                    .filter(([plugin_widget, widget]) => widget.plugin_name === plugin.name)
                                    .map(([plugin_widget, widget], i) => (
                                        <div key={i} className="flex text-gray-500 items-center select-none pt-1">
                                            <VscCircleFilled
                                                className="mr-1"
                                                color={grid[plugin_widget] ? "#16a34a" : "#9ca3af"}
                                            />
                                            <div
                                                className="text-sm font-bold cursor-pointer"
                                                onClick={() => copyText(widget.name, "Copied widget name!")}
                                            >
                                                {widget.name}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Dropdown>
        </div>
    );
};

export default UsedWidgetsStatus;
