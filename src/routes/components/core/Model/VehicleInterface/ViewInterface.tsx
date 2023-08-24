import clsx from "clsx"
import { FC, useState } from "react"
import { useCurrentModel } from "../../../../../reusable/hooks/useCurrentModel"
import useCurrentPrototype from "../../../../../hooks/useCurrentPrototype"
import Select from "../../../../../reusable/Select"
import TriggerPopup from "../../../../../reusable/triggerPopup/triggerPopup"
import Tab from "../../../../../reusable/Tabs/Tab"
import LinkWrap from "../../../../../reusable/LinkWrap"
import { Model } from "../../../../../apis/models"
import { useParams } from "react-router-dom"
import ListView from "./ListView"
import TreeView from "./TreeView"
import getNodeFromFullName from "./utils/getNodeFromFullName"

const ViewInterfaceHeader: FC<ViewInterfaceProps & {
    onlyInUse: boolean
    setOnlyInUse: React.Dispatch<React.SetStateAction<boolean>>
}> = ({display, onlyInUse, setOnlyInUse}) => {
    const prototype = useCurrentPrototype()

    const cviLink = `/cvi`
    const fullLink = typeof prototype === "undefined" ? `/model/:model_id${cviLink}/` : `/model/:model_id/library/prototype/:prototype_id/view${cviLink}/`

    return (
        <div className="flex w-full bg-slate-50 px-4">
            {display === "list" && typeof prototype !== "undefined" ? (
                <>
                    <Tab
                    label="In-Use APIs"
                    className="!w-fit whitespace-nowrap mr-4 text-xs flex items-center  pb-1"
                    active={onlyInUse}
                    onClick={() => setOnlyInUse(true)}
                    />
                    <Tab
                    label="All APIs"
                    className="!w-fit whitespace-nowrap text-xs flex items-center pb-1"
                    active={!onlyInUse}
                    onClick={() => setOnlyInUse(false)}
                    />
                </>
            ) : (
                <Select
                state={["covesa_vss", () => {}]}
                onSelect={option => TriggerPopup(
                    <>
                        <div className="text-2xl mb-2">Work In Progress</div>
                        <div>This feature is still being built.</div>
                    </>,
                    "!min-w-fit !w-fit"
                )}
                options={[
                    {
                        name: "COVESA VSS",
                        value: "covesa_vss"
                    },
                    {
                        name: "COVESA VSC",
                        value: "covesa_vsc",
                    },
                    {
                        name: "W3C VISS",
                        value: "w3c_viss",
                    },
                    {
                        name: "ISO 23150:2021",
                        value: "iso_23150_2021",
                    },
                    {
                        name: "SENSORIS",
                        value: "sensoris",
                    },
                ]} />
            )}
            <LinkWrap to={fullLink + "list"} className={clsx("ml-auto", display === "list" && "pointer-events-none")} >
                <Tab label="List View" active={display === "list"} className="w-fit whitespace-nowrap mr-4" />
            </LinkWrap>
            <LinkWrap to={fullLink + "tree"} className={clsx(display === "tree" && "pointer-events-none")} >
                <Tab label="Tree View" active={display === "tree"} className="w-fit whitespace-nowrap" />
            </LinkWrap>
        </div>
    )
}

interface ViewInterfaceProps {
    display: "tree" | "list"
}

const ViewInterface = ({display}: ViewInterfaceProps) => {
    const prototype = useCurrentPrototype()
    
    const [onlyInUse, setOnlyInUse] = useState(true)

    // Coercing because it wouldn't pass the App.tsx loading page if it was undefined
    const model = useCurrentModel() as Model

    const {node_path = ""} = useParams()
    const {node: activeNode, isCustom} = getNodeFromFullName(model, node_path)
    const Component = display === "list" ? ListView : TreeView

    return (
        <div className="flex flex-col h-full w-full">
            <ViewInterfaceHeader onlyInUse={onlyInUse} setOnlyInUse={setOnlyInUse} display={display} />
            <div className="flex w-full h-0 flex-1">
                <Component
                model={model}
                activeNode={activeNode}
                isActiveNodeCustom={isCustom}
                node_name={node_path}
                onlyShow={onlyInUse ? prototype?.apis.VSS : undefined}
                />
            </div>
        </div>
    )
}

export default ViewInterface