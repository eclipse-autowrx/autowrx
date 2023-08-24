import clsx from "clsx"
import { FC, useState } from "react"
import { getPlugins } from "../../apis"
import { Model } from "../../apis/models"
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh"
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel"
import LoadingPage from "../components/LoadingPage"
import PluginsList from "./PluginsList"

interface PluginsProps {
    tab: "list" | "dashboard"
}

const Plugins: FC<PluginsProps> = ({tab}) => {
    const model = useCurrentModel() as Model

    const [refreshCounter, setRefreshCounter] = useState(0)

    const {value: plugins} = useAsyncRefresh(
        () => getPlugins(model.id),
        [model.id, refreshCounter],
        5 * 60 * 1000
    )
    if (typeof plugins === "undefined") {
        return <LoadingPage />
    }

    return (
        <div className="flex flex-col h-full w-full border-t">
            {/* <div className="flex w-full h-fit bg-slate-50 px-4">
                <LinkWrap to="/model/:model_id/plugins/" className={clsx("ml-auto", tab === "list" && "pointer-events-none")} >
                    <Tab label="List" active={tab === "list"} className="w-fit whitespace-nowrap mr-4" />
                </LinkWrap>
            </div> */}
            <PluginsList plugins={plugins} />
        </div>
    )
}

export default Plugins