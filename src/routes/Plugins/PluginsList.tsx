import clsx from "clsx"
import { FC, useEffect, useState } from "react"
import { HiPlus } from "react-icons/hi"
import { useNavigate } from "react-router-dom"
import { Model, Plugin } from "../../apis/models"
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import { useParamsX } from "../../reusable/hooks/useUpdateNavigate"
import NewPlugin from "./NewPlugin"
import NoPluginDisplay from "./NoPluginDisplay"
import PluginDisplay from "./PluginDisplay"
import PluginNotFound from "./PluginNotFound"
import PluginOverview from "./PluginOverview"
import { TbArrowsSort } from "react-icons/tb"
import { useCurrentModelPermissions } from "../../permissions/hooks"

interface PluginsListProps {
    plugins: Plugin[]
}

const PluginsList: FC<PluginsListProps> = ({plugins}) => {
    const {plugin_id = ""} = useParamsX()
    const {isLoggedIn} = useCurrentUser()

    const navigate = useNavigate()
    const model = useCurrentModel() as Model
    const modelPermissions = useCurrentModelPermissions()

    const [ordering, setOrdering] = useState(false)

    useEffect(() => {
        if (plugin_id === "" && typeof plugins !== "undefined" && plugins.length) {
            navigate(`/model/${model.id}/plugins/plugin/${plugins[0].id}`)
        }
    }, [plugin_id, typeof plugins])

    const selectedPlugin = plugins.find(plugins => plugins.id === plugin_id)

    return (
        <div className="flex w-full" style={{height: "calc(100% - 42px)"}}>
            <div className="flex flex-col h-full w-2/6 border-r">
                <div className="flex w-full">
                    {modelPermissions.canEdit() && (
                        <NewPlugin trigger={
                            <div className="flex w-full items-center px-4 py-3 cursor-pointer text-aiot-blue select-none w-full border-b">
                                <HiPlus className="text-xl mr-2"/>New Plugin
                            </div>
                        }/>
                    )}
                    {/* {isLoggedIn && (
                        <div
                        className="ml-auto flex w-fit items-center px-4 py-3 cursor-pointer text-aiot-blue select-none w-full border-b"
                        onClick={() => setOrdering(false)}
                        >
                            <TbArrowsSort className="text-xl mr-2"/>Reorder
                        </div>
                    )} */}
                </div>
                <div className="flex flex-col overflow-auto">
                    {plugins.map(plugin => {
                        return (
                            <PluginOverview
                            plugin={plugin}
                            key={plugin.id}
                            active={plugin.id === plugin_id}
                            />
                        )
                    })}
                </div>
                {plugins.length === 0 && (
                    <div className="flex p-4 text-gray-400 text-2xl w-full h-full justify-center items-center select-none mb-40">No Plugins in Library</div>
                )}
            </div>
            <div className="flex flex-col h-full w-4/6 overflow-auto">
                {plugins.length === 0 ? (
                    <NoPluginDisplay />
                ) : (
                    typeof selectedPlugin === "undefined" ? (
                        <PluginNotFound />
                    ) : (
                        <PluginDisplay plugin={selectedPlugin} />
                    )
                )}
            </div>
        </div>
    )
}

export default PluginsList