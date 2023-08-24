import clsx from "clsx"
import { FC, Fragment, useEffect, useState } from "react"
import SquareGrid from "../../reusable/SquareGrid"
import getGridItemSpan from "./getGridItemSpan"
import InjectableIframe from "./GridItem/InjectableIframe"
import SkeletonGridItem from "./GridItem/SkeletonGridItem"
import { DashboardGridType, GridItem } from "./GridItem/types"
import { WidgetType } from "./pluginTypes"

interface PluginsDashboardGridProps {
    widgetsLibrary: {
        [plugin_widget: string]: WidgetType
    }
    grid: DashboardGridType | Error
}

const PluginsDashboardGrid: FC<PluginsDashboardGridProps> = ({grid, widgetsLibrary}) => {
    const [mountedOnce, setMountedOnce] = useState(false)

    const usedGrid: {
        [space: number]: true
    } = {}

    const gridBeginning: {
        [start_at: number]: GridItem
    } = {}

    let widgetsError: null | string = null

    if (!(grid instanceof Error)) {
        Object.entries(grid).forEach(([_, gridItem]) => {
            try {
                getGridItemSpan(gridItem)
            } catch (error) {
                widgetsError = (error as Error).message
            }
            gridBeginning[Math.min(...gridItem.boxes)] = gridItem
            for (const space of gridItem.boxes) {
                if (typeof usedGrid[space] !== "undefined") {
                    widgetsError = `Box ${space} is being used for multiple widgets.`
                }
                usedGrid[space] = true
            }
        })
    } else {
        widgetsError = grid.message
    }


    if (widgetsError !== null) {
        return (
            <div className="flex flex-col w-full h-full p-4 items-center justify-center select-none">
                <div className="text-4xl text-gray-600 mb-3">Widgets can't be loaded.</div>
                <div className="text-2xl text-gray-500">{widgetsError}</div>
            </div>
        )
    }

    return (
        <SquareGrid columns={5} fixedWidth="calc(100vw - 40px)">
            {new Array(10).fill(true).map((_, i) => {
                const space = i + 1
                if (typeof usedGrid[space] === "undefined") {
                    return (
                        <SkeletonGridItem
                        key={"skeleton" + space}
                        space={space}
                        // className={
                        //     [3, 8].includes(space) ? "border-r-8" : (
                        //     [4, 9].includes(space) ? "border-l-0" :
                        //     ""
                        // )}
                        />
                    )
                }
                
                const gridItem = gridBeginning[space]
                if (typeof gridItem == "undefined") {
                    // Extended from other
                    return <Fragment key={"null" + space}></Fragment>
                }

                const widget = widgetsLibrary[gridItem.plugin + "::" + gridItem.widget]

                return (
                    <div className={clsx("flex w-full h-full", getGridItemSpan(gridItem))} data-space={space}>
                        {typeof widget === "undefined" ? (
                            <div className="flex w-full h-full justify-center items-center text-center text-gray-500 break-words select-none p-3">
                                <span className="overflow-hidden"><strong>{gridItem.plugin + "::" + gridItem.widget}</strong> doesn't exist.</span>
                            </div>
                        ) : (
                            <InjectableIframe
                            key={space}
                            gridItem={gridItem}
                            widget={widget}
                            />    
                        )}
                    </div>
                )
            })}
        </SquareGrid>
    )
}

export default PluginsDashboardGrid