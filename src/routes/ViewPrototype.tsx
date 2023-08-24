import Tab from "../reusable/Tabs/Tab";
import TabContainer from "../reusable/Tabs/TabContainer";
import CodeViewer from "./components/CodeViewer/CodeViewer";
import { VscCode, VscDashboard, VscDebugStart, VscFeedback } from "react-icons/vsc";
import { GoDashboard } from "react-icons/go";
import { IoAnalytics } from "react-icons/io5"
import { IconType } from "react-icons";
import LinkWrap from "../reusable/LinkWrap";
import { useState } from "react";
import RunDashboard from "./components/RunDashboard/RunDashboard";
import useCurrentPrototype, { CurrentPrototypeProvider } from "../hooks/useCurrentPrototype";
import LoadingPage from "./components/LoadingPage";
import { Model } from "../apis/models";
import useAsyncRefresh from "../reusable/hooks/useAsyncRefresh";
import { getPrototypes, savePrototypeCode } from "../apis";
import { useCurrentModel } from "../reusable/hooks/useCurrentModel";
import { useParamsX } from "../reusable/hooks/useUpdateNavigate";
import Feedback from "./components/Feedback";
import { GiJourney } from "react-icons/gi"
import Journey from "./components/Journey";
import Analysis from "./components/Analysis";

interface IconTabProps {
    Icon: IconType
    label: string
    active?: boolean
    onClick?: React.MouseEventHandler<HTMLDivElement>
    size?: string
}

const IconTab = ({Icon, label, active = false, onClick, size = "1.2em"}: IconTabProps) => {
    return (
        <Tab
        onClick={onClick}
        label={
            <div className="flex items-center">
                <Icon size={size} className="mr-2" />{label}
            </div>
        }
        active={active}
        className="px-5"
        />
    )
}

interface ViewPrototypeProps {
    prototype_tab: "cvi" | "code" | "run" | "feedback" | "journey"
    display?: "tree" | "list"
}

const ViewPrototypeInner = ({prototype_tab, display = "list"}: ViewPrototypeProps) => {
    const prototype = useCurrentPrototype()
    const prototype_id = typeof prototype === "undefined" ? "new" : prototype.id

    const [code, setCode] = useState(prototype?.code ?? "")
    const [saving, setSaving] = useState(false)

    const saveCode = async () => {
        setSaving(true)
        await savePrototypeCode(prototype_id, code)
        setSaving(false)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex w-full bg-aiot-blue px-4 py-2 text-white font-bold select-none">{prototype?.name}</div>
            <div className="flex w-full bg-slate-50">
                <div className="flex w-full mr-8">
                    <TabContainer>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/journey`}>
                            <IconTab Icon={GiJourney} label="Journey" active={prototype_tab === "journey"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/code`}>
                            <IconTab Icon={VscCode} label="Code" active={prototype_tab === "code"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/run`}>
                            <IconTab Icon={VscDashboard} label="Dashboard" active={prototype_tab === "run"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/cvi/list`}>
                            <IconTab Icon={IoAnalytics} label="Analysis" active={prototype_tab === "cvi"} size="1.4em" />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/feedback`}>
                            <IconTab Icon={VscFeedback} label="Feedback" active={prototype_tab === "feedback"} />
                        </LinkWrap>
                    </TabContainer>
                </div>
            </div>
            <div className="flex h-full w-full" style={{height: "calc(100% - 86px)"}}>
                {prototype_tab === "code" ? (
                    <CodeViewer
                    saveCode={saveCode}
                    saving={saving}
                    code={code}
                    setCode={setCode}
                    editable={true}
                    language="python"
                    />
                ) : prototype_tab === "cvi" ? (
                    <Analysis/>
                ) : prototype_tab === "run" ? (
                    <RunDashboard code={code} />
                ) : prototype_tab === "feedback" ? (
                    <Feedback />
                ) : prototype_tab === "journey" ? (
                    <Journey/>
                ) : null}
            </div>
        </div>
    )
}

const ViewPrototype = ({prototype_tab, display = "list"}: ViewPrototypeProps) => {
    const model = useCurrentModel() as Model

    const {prototype_id = ""} = useParamsX()

    const {value: prototype, loading} = useAsyncRefresh(async () => {
        const prototypes = await getPrototypes(model.id)
        return prototypes.find(prototype => prototype.id === prototype_id)
    }, [model.id])

    if (loading) {
        return <LoadingPage/>
    }

    if (typeof prototype === "undefined" && prototype_id !== "new") {
        return (
            <div className="text-gray-400 text-5xl flex w-full h-full pb-20 items-center justify-center">
                Prototype not found
            </div>
        )
    }

    return (
        <CurrentPrototypeProvider value={prototype}>
            <ViewPrototypeInner prototype_tab={prototype_tab} display={display} />
        </CurrentPrototypeProvider>
    )

}

export default ViewPrototype