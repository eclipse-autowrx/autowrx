import clsx from "clsx"
import { VscGithubInverted, VscSave } from "react-icons/vsc"
import { Model, Prototype } from "../../../apis/models"
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel"
import Tab from "../../../reusable/Tabs/Tab"
import CodeEditor, { CodeEditorProps } from "./CodeEditor"
import TriggerPopup from "../../../reusable/triggerPopup/triggerPopup"
import CreateRepo from "./CreateRepo"
import useCurrentUser from "../../../reusable/hooks/useCurrentUser"
import { useState } from "react"
import { saveWidgetConfig } from "../../../apis"
import useCurrentPrototype from "../../../hooks/useCurrentPrototype"
import { CircularProgress } from "@mui/material"
import copyText from "../../../reusable/copyText"
import { useCurrentProtototypePermissions } from "../../../permissions/hooks"
import deployToEPAM from "./deployToEPAM"
import { FaRocket } from "react-icons/fa"
import { IoRocket } from "react-icons/io5"
import permissions from "../../../permissions"
import { IsBrowser } from "../../../apis/utils/browser"
import triggerSnackbar from "../../../reusable/triggerSnackbar"
import ListHalfMemoized from "../core/Model/VehicleInterface/ListView/ListHalf"

interface CodeViewerProps extends CodeEditorProps {
    saving: boolean
    saveCode: () => Promise<void>
}

const CodeViewer = ({saving, saveCode, ...props}: CodeViewerProps) => {
    const model = useCurrentModel() as Model
    const prototype = useCurrentPrototype() as Prototype
    const {profile, isLoggedIn} = useCurrentUser()
    const canEdit = useCurrentProtototypePermissions().canEdit()
    const [widgetConfig, setWidgetConfig] = useState(prototype.widget_config ?? "")
    const [savingWidgetConfig, setSavingWidgetConfig] = useState(false)
    const prototypePermissions = useCurrentProtototypePermissions()
    const [deployingToEpam, setDeployingToEpam] = useState(false)

    return (
        <div className="flex h-full w-full">
            {savingWidgetConfig && (
                <div className="flex w-full h-full bg-black fixed left-0 top-0 z-10 opacity-90 text-center items-center justify-center select-none text-3xl">
                    <CircularProgress size="1em" style={{color: "white"}} className="mr-5" />
                    <div className="text-white">Saving Widgets Config</div>
                </div>
            )}
            <div className="flex flex-col h-full w-3/6">
                {prototypePermissions.canRead() && (
                    <div className="flex w-full bg-slate-50">
                        <Tab
                        label={
                            <div className="flex items-center text-sm">
                                <IoRocket size="1.2em" className="mr-2" />Deploy as EPAM Service
                            </div>
                        }
                        className={clsx(
                            "px-3 pt-2 pb-2 ml-auto !w-fit select-none transition",
                            deployingToEpam ? "text-gray-300 pointer-events-none" : "text-gray-500 hover:text-cyan-600" 
                        )}
                        onClick={async () => {
                            setDeployingToEpam(true)
                            const json = await deployToEPAM(
                                prototype.id,
                                props.code
                            )
                            setDeployingToEpam(false)
                            TriggerPopup(
                                <pre
                                className="bg-gray-200 p-5"
                                style={{whiteSpace: "break-spaces", maxWidth: 700, wordBreak: "break-word"}}
                                >
                                    <code>{JSON.stringify(json, null, 4)}</code>
                                </pre>,
                                "!w-fit !min-w-fit"
                            )
                        }}
                        />
                        <Tab
                        label={
                            <div className="flex items-center text-sm">
                                <VscGithubInverted size="1.2em" className="mr-2" />Create Eclipse Velocitas Project
                            </div>
                        }
                        className={clsx(
                            "px-3 pt-2 pb-2 !w-fit select-none transition",
                            false ? "text-gray-300 pointer-events-none" : "text-gray-500 hover:text-purple-700" 
                        )}
                        onClick={async () => {
                            if (IsBrowser.Safari()) {
                                triggerSnackbar("This feature is not available on Safari.")
                                return
                            }
                            TriggerPopup(
                                <CreateRepo model={model} code={props.code} />,
                                "!w-fit !min-w-max"
                            )
                        }}
                        />
                        {canEdit && (
                            <Tab
                            onClick={() => saveCode()}
                            label={
                                <div className="flex items-center text-sm">
                                    <VscSave size="1.2em" className="mr-2" />Save
                                </div>
                            }
                            className={clsx(
                                "px-3 pt-2 pb-2 !w-fit select-none transition",
                                saving ? "text-gray-300 pointer-events-none" : "text-gray-500 hover:text-sky-900" 
                            )}
                            />
                        )}
                    </div>
                )}
                <div className="flex flex-col h-full w-full overflow-hidden border-r border-slate-100">
                    <CodeEditor {...props}  />
                </div>
            </div>
            <div className="flex flex-col h-full w-3/6">
                <ListHalfMemoized
                node_name=""
                model={model}
                onClickApi={async (api) => {
                    copyText(api, `Copied "${api}" to clipboard.`)
                }}
                />
                <div className="flex flex-col h-full w-full overflow-hidden">
                    <div className="flex w-full bg-slate-50 pl-5 pr-2 items-center select-none">
                        <div className="text-aiot-blue font-bold">Widgets Config</div>
                        {permissions.PROTOTYPE(profile, model, prototype).canEdit() && (
                            <Tab
                            onClick={async () => {
                                setSavingWidgetConfig(true)
                                await saveWidgetConfig(prototype.id, widgetConfig)
                                window.location.reload()
                            }}
                            label={
                                <div className="flex items-center text-sm">
                                    <VscSave size="1.2em" className="mr-2" />Save
                                </div>
                            }
                            className={clsx(
                                "px-3 pt-2 pb-2 !w-fit select-none transition ml-auto",
                                savingWidgetConfig ? "text-gray-300 pointer-events-none" : "text-gray-500 hover:text-sky-900" 
                            )}
                            />
                        )}
                    </div>
                    <CodeEditor code={widgetConfig} setCode={setWidgetConfig} editable={true} language="json" />
                </div>
            </div>
        </div>
    )
}

export default CodeViewer
