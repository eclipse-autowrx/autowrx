import clsx from "clsx"
import { VscTrash } from "react-icons/vsc"
import { useParamsX } from "../../../reusable/hooks/useUpdateNavigate"
import { nodeTypeColor } from "./BranchViewer"
import HeadingRow from "./HeadingRow"
import PropertyRow from "./PropertyRow"
import { HiDotsVertical } from "react-icons/hi"
import Dropdown from "../../../reusable/Dropdown"
import { MenuItem } from "@mui/material"
import copyText from "../../../reusable/copyText"
import { FiCopy } from "react-icons/fi"
import { AnyNode } from "../core/Model/VehicleInterface/Spec"

const Seperator = () => {
    return (
        <tr>
            <td colSpan={2}>
                <div className="bg-gray-300 w-full my-2" style={{height: 1}}></div>
            </td>
        </tr>
    )
}

const OneOfFromName = (list: string[], name: string) => {
    return list[name.length % 4]
}

interface NodeViewerProps {
    name: string
    node: AnyNode
    isCustom: boolean
    // editCustomNode: (node_name: string, node: AnyNode) => void
    deleteCustomNode: (node_name: string) => void
}

const NodeViewer = ({name, node, isCustom, deleteCustomNode}: NodeViewerProps) => {
    // const clients = prototypes.filter(prototype => prototype.apis.VSS.includes(name))

    const {prototype_id = ""} = useParamsX()
    
    return (
        <div className="flex flex-col w-full h-full relative">
            <div className="flex bg-aiot-blue text-white px-4 py-1 text-bold font-bold select-none items-center">
                <span className="inline-flex items-center cursor-pointer" onClick={() => copyText(name, `Copied "${name}" to clipboard.`)}>
                    <span
                    className="inline-flex items-center"
                    >
                        {name}
                    </span>
                    {isCustom && <div className="flex items-center justify-center bg-fuchsia-500 text-white rounded-xl w-2 h-2 ml-2" style={{fontSize: "0.6rem", lineHeight: 0, padding: "0.6rem"}}>W</div>}
                    <FiCopy className="ml-3" size="0.9em" />
                </span>
                <span style={{fontSize: ".65em"}} className={clsx(
                    nodeTypeColor("bg", node.type),
                    "py-0.5 px-2 ml-auto"
                )}>{node.type.toUpperCase()}</span>
                {isCustom && (
                    <Dropdown
                    trigger={
                        <span
                        className="hover:bg-gray-500/50 rounded-full p-1 relative left-2 cursor-pointer transition"
                        ><HiDotsVertical/></span>    
                    }>
                        <MenuItem
                        className="!pl-2 !pr-5 !py-0" style={{minHeight: 36}}
                        onClick={() => deleteCustomNode(name)}
                        >
                            <VscTrash className="text-3xl text-slate-500" style={{transform: "scale(0.6)", marginRight: "2px"}}/>
                            <div className="text-slate-500">Delete</div>
                        </MenuItem>
                    </Dropdown>
                )}
            </div>
            <div className="overflow-auto pb-2">
                <table className="h-full table-auto w-full mt-1">
                    <tbody>
                        <HeadingRow heading="VSS Specification" />
                        {Object.entries(node).filter(([key, value]) => typeof value !== "object").map(([key, value]) => {
                            return (
                                <PropertyRow key={key + value} property={key !== "datatype" ? key : `DataType (${node.type === "actuator" ? "Input" : "Output"})`} value={value} />
                            )
                        })}
                        <PropertyRow link={!isCustom} property="Source" value={isCustom ? "Custom" : "https://github.com/COVESA/vehicle_signal_specification/tree/master/spec"} />
                        {prototype_id !== "" && (
                            <>
                                <Seperator/>
                                <HeadingRow heading="Testing" />
                                {
                                node.type === "actuator" ? (
                                    <>
                                        <PropertyRow property="Current Value" value="TBD" isDynamicProp />
                                        <PropertyRow property="History" value="[]" isDynamicProp />
                                    </>
                                ) : (node.type === "attribute" ? (
                                    <>
                                        <PropertyRow property="Value" value="TBD" isDynamicProp />
                                    </>
                                ) : ( node.type === "sensor" &&
                                    <>
                                        <PropertyRow property="Current Value" value="TBD" isDynamicProp />
                                        <PropertyRow property="Test Data" value="[]" isDynamicProp />
                                    </>
                                ))
                                }
                            </>
                        )}
                        <Seperator />
                        <HeadingRow heading="Dependencies" />
                        <PropertyRow property="Used by these vehicle apps" value={([] as any[]).map(client => client.title).join(", ")} />
                        <Seperator />
                        <HeadingRow heading="Implementation" />
                        <PropertyRow property="Implementation Status" value={OneOfFromName([
                            "Wishlist",
                            "VSS Spec",
                            "HW Prototype",
                            "Production ready"
                        ], name)} />
                        <PropertyRow property="API Lifecycle Status" value={OneOfFromName([
                            "Proposal: Proposed new API",
                            "Validated: Has at least one valid client use case / example prototype",
                            "Committed: Server implementation has been committed for next release",
                            "Available: Server implementation is available"
                        ], name)} />
                        <PropertyRow property="API Standardization" value={OneOfFromName([
                            "Undefined",
                            "Proprietary: Proprietary API definition (OEM only)",
                            "Proposed for standardization: Formal proposal to API standards organization, e.g. COVESA",
                            "Standardized: Proposal has been accepted"
                        ], name)} />
                        <PropertyRow property="API Visibility" value={OneOfFromName([
                            "Internal: This API is only accessible for apps provided by the OEM",
                            "Partner: This API is only available to the OEM as well as selected development partners",
                            "Open AppStore: This API is available to any vehicle AppStore developer"
                        ], name)} />
                        <PropertyRow property="Supported Hardware" value=""  />
                        <PropertyRow property="Key Stakeholders" value="" />
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default NodeViewer