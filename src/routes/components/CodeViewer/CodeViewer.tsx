import clsx from "clsx";
import { VscGithubInverted, VscSave } from "react-icons/vsc";
import { Model, Prototype, PrototypeGetSet } from "../../../apis/models";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import Tab from "../../../reusable/Tabs/Tab";
import CodeEditor, { CodeEditorProps } from "./CodeEditor";
import TriggerPopup from "../../../reusable/triggerPopup/triggerPopup";
import CreateRepo from "./CreateRepo";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { useState, useEffect } from "react";
import { saveWidgetConfig } from "../../../apis";
import useCurrentPrototype, { useCurrentPrototypeGetSet } from "../../../hooks/useCurrentPrototype";
import copyText from "../../../reusable/copyText";
import { useCurrentProtototypePermissions } from "../../../permissions/hooks";
import deployToEPAM from "./deployToEPAM";
import { IoRocket, IoRocketSharp } from "react-icons/io5";
import permissions from "../../../permissions";
import { IsBrowser } from "../../../apis/utils/browser";
import triggerSnackbar from "../../../reusable/triggerSnackbar";
import ListHalfMemoized from "../core/Model/VehicleInterface/ListView/ListHalf";
import ApiListItem from "../CVIViewer/models/ApiListItem";
import Popup from "../../../reusable/Popup/Popup";
import DeployPopup from "../Deploy/DeployPopup";
import WidgetLibrary from "../WidgetLibrary";
import { IoIosWarning } from "react-icons/io";
import { fetchTagsInAPI } from "../../TagsFilter/ApiTagUtilities";
import { useGetUserFeatures } from "../../../reusable/hooks/useGetUserFeatures";
import DashboardEditor from "../Widget/DashboardEditor";
import { TbChevronDown, TbChevronRight, TbArrowUpRight, TbCloudCheck, TbCloudX } from "react-icons/tb";
import Button from "../../../reusable/Button";
import { CircularProgress } from "@mui/material";

import { WEB_STUDIO_API, convertProjectPublicLinkToEditorLink } from "../../../services/webStudio";
import CodeAssistant from "./CodeAssistant";

import APIDetails from "./APIDetails";

interface CodeViewerProps extends CodeEditorProps {
    saving: boolean;
    saveCode: () => Promise<void>;
}

interface ApiCodeBlockProps {
    apiName: string;
    onCopied: () => void;
}

const CodeViewer = ({ saving, saveCode, ...props }: CodeViewerProps) => {
    const model = useCurrentModel() as Model;
    // const prototype = useCurrentPrototype() as Prototype
    const { prototype, updatePrototype } = useCurrentPrototypeGetSet() as PrototypeGetSet;
    const { profile, isLoggedIn, user } = useCurrentUser();
    const canEdit = useCurrentProtototypePermissions().canEdit();
    const [widgetConfig, setWidgetConfig] = useState(prototype?.widget_config ?? "");
    const [lastestWidgetConfig, setLastestWidgetConfig] = useState(prototype?.widget_config ?? "");
    const [savingWidgetConfig, setSavingWidgetConfig] = useState(false);
    const prototypePermissions = useCurrentProtototypePermissions();
    const [deployingToEpam, setDeployingToEpam] = useState(false);
    const [ticker, setTicker] = useState(0);

    const [allAPIs, setAllApis] = useState<any[]>([]);
    const [useApis, setUseApis] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("All APIs");

    const popupState = useState(false);
    const [activeApi, setActiveApi] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const TABS = ["All APIs", "Dashboard Config"];

    const [isDeployPopupOpen, setIsDeployPopupOpen] = useState(false);

    const [linkOfEditors, setLinkOfEditors] = useState<any[]>([]);

    const [apiTags, setApiTags] = useState<any[]>([]);

    const handleFetchActiveApiTags = async (apiName) => {
        try {
            let fetchedTags = await fetchTagsInAPI(apiName, model.id);
            setApiTags(fetchedTags); // Update the state with the fetched tags
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    };
    const { hasAccessToFeature } = useGetUserFeatures();
    const canAccessGenAIPython = hasAccessToFeature("GEN_AI_PYTHON");

    useEffect(() => {
        let timer = setInterval(() => {
            setTicker((oldTick) => oldTick + 1);
        }, 5000);

        return () => {
            clearInterval(timer);
            saveWidgetCode();
        };
    }, []);

    useEffect(() => {
        saveWidgetCode();
    }, [ticker]);

    useEffect(() => {
        let tmpLinkOfEditors: any[] = [];
        try {
            if (widgetConfig) {
                let configs = JSON.parse(widgetConfig);
                tmpLinkOfEditors = configs
                    .filter((configs: any) => configs.widget == "Embedded-Widget")
                    .map((config: any) => {
                        if (config.options && config.options.url && config.options.url.startsWith(WEB_STUDIO_API)) {
                            return convertProjectPublicLinkToEditorLink(config.options.url);
                        }
                    });
                tmpLinkOfEditors = tmpLinkOfEditors.filter((u) => u && u.length > 0);
            }
        } catch (err) {}

        setLinkOfEditors(tmpLinkOfEditors);
    }, [widgetConfig]);

    useEffect(() => {
        if (!props.code || !allAPIs || allAPIs.length === 0) {
            setUseApis([]);
            return;
        }
        // console.log("code", props.code)
        let useList: any[] = [];
        allAPIs.forEach((item: any) => {
            if (props.code.includes(item.shortName)) {
                // console.log(item)
                useList.push(item);
            }
        });
        // console.log("useList", useList)
        setUseApis(useList);
    }, [props.code, allAPIs]);

    const onApiClick = async (api: any) => {
        setActiveApi(api);
        popupState[1](true);
        handleFetchActiveApiTags(api.name);
    };

    const updateAllAPIs = (apis: any[]) => {
        if (!apis) {
            setAllApis([]);
            return;
        }
        let retItems: any[] = [];
        apis.forEach((item: any) => {
            if (item.type == "branch") return;
            let arName = item.name.split(".");
            if (arName.length > 1) {
                item.shortName = "." + arName.slice(1).join(".");
                retItems.push(item);
            }
        });
        setAllApis(retItems);
    };

    const saveWidgetCode = async () => {
        if (permissions.PROTOTYPE(profile, model, prototype).canEdit() && lastestWidgetConfig != widgetConfig) {
            // console.log('save widgetConfig')
            if (prototype?.state != "released") {
                setSavingWidgetConfig(true);
                await saveWidgetConfig(prototype.id, widgetConfig);
                updatePrototype(prototype);
                setSavingWidgetConfig(false);
            }
            // window.location.reload()
            setLastestWidgetConfig(widgetConfig);
        }
    };

    // Preload all images that will be used in DeployPopup
    const preloadedImagesSrc: string[] = [
        "/imgs/cloud-server.png",
        "/imgs/DreamKit.png",
        "/imgs/TestVehicle.png",
        "/imgs/ProductionVehicle.png",
        "/imgs/code1.png",
    ];

    const preloadedImages: HTMLImageElement[] = [];

    const preloadImage = (src: string) => {
        const image = new Image();
        image.src = src;
        preloadedImages.push(image);
    };

    preloadedImagesSrc.forEach(preloadImage);

    return (
        <div className="flex h-full w-full">
            <div className="flex flex-col h-full w-3/6">
                {prototypePermissions.canRead() && (
                    <div className="flex w-full bg-slate-100 py-1">
                        <div className="items-center flex overflow-hidden">
                            <div
                                className={clsx(
                                    "px-2 pt-2 pb-2 ml-1 !w-fit select-none transition cursor-pointer grid place-items-center",
                                    deployingToEpam
                                        ? "text-gray-300 pointer-events-none"
                                        : "text-gray-500 hover:text-cyan-600"
                                )}
                                onClick={async () => {
                                    setDeployingToEpam(true);
                                    const json = await deployToEPAM(prototype.id, props.code);
                                    setDeployingToEpam(false);
                                    TriggerPopup(
                                        <pre
                                            className="bg-gray-200 p-5"
                                            style={{
                                                whiteSpace: "break-spaces",
                                                maxWidth: 700,
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            <code>{JSON.stringify(json, null, 4)}</code>
                                        </pre>,
                                        "!w-fit !min-w-fit"
                                    );
                                }}
                            >
                                <div
                                    style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                                    className="flex items-center text-[10px] md:text-sm"
                                >
                                    <IoRocket size="1.2em" className="mr-2" />
                                    Deploy as EPAM Service
                                </div>
                            </div>

                            <div
                                className={clsx(
                                    "px-2 pt-2 pb-2 !w-fit select-none transition cursor-pointer grid place-items-center",
                                    false ? "text-gray-300 pointer-events-none" : "text-gray-500 hover:text-purple-700"
                                )}
                                onClick={async () => {
                                    if (IsBrowser.Safari()) {
                                        triggerSnackbar("This feature is not available on Safari.");
                                        return;
                                    }
                                    TriggerPopup(<CreateRepo model={model} code={props.code} />, "!w-fit !min-w-max");
                                }}
                            >
                                <div
                                    style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                                    className="flex items-center text-[10px] md:text-sm"
                                >
                                    <VscGithubInverted size="1.2em" className="mr-2" />
                                    Create Eclipse Velocitas Project
                                </div>
                            </div>
                        </div>

                        <div className="grow"></div>

                        {/* <div className="items-center justify-center flex mr-2">
                            <button className="flex items-center px-2 py-1 text-sm bg-aiot-gradient-6 rounded text-white hover:bg-aiot-blue/90 select-none cursor-pointer" onClick={() => { setIsDeployPopupOpen(true) }}>
                                <IoRocketSharp className="w-4 h-auto mr-1" style={{ strokeWidth: 0 }} />
                                Deploy</button>
                        </div> */}
                        <div
                            className="items-center min-w-[100px] justify-center flex cursor-pointer hover:opacity-80"
                            onClick={() => {
                                setIsDeployPopupOpen(true);
                            }}
                        >
                            <img className="flex w-20 h-auto" src="/imgs/deploy.png" alt="deploy logo" />
                        </div>

                        <DeployPopup
                            onClose={() => setIsDeployPopupOpen(false)}
                            isOpen={isDeployPopupOpen}
                            onDeploy={() => {}}
                            onCloseButton={() => setIsDeployPopupOpen(false)}
                            code={props.code}
                            usedAPIs={useApis}
                        ></DeployPopup>
                    </div>
                )}
                <div className="flex flex-col h-full w-full overflow-hidden border-r border-slate-100">
                    <div>
                        {prototype?.state == "released" && canEdit && (
                            <div className="bg-slate-400 text-slate-50 pl-4 pr-2 py-1 text-sm italic flex items-center">
                                <span>
                                    <IoIosWarning className="mr-2 h-5 w-auto" />
                                </span>
                                Your prototype is released! Any code changes will run but won't be saved to the database
                                <Popup
                                    trigger={<span className="underline cursor-pointer ml-2">More detail</span>}
                                    className=""
                                    width="680px"
                                >
                                    <div className="p-4">
                                        <div className="text-xl font-bold mb-4">What is released?</div>
                                        <div className="text-md whitespace-pre-line w-full">
                                            <p>
                                                “Released” state means that the prototype is completely done, and it's
                                                working.
                                                <br />
                                                User can ONLY temporarily change the code and run the test on Dashboard,
                                                but the changed code shall not be saved to DB.
                                                <br />
                                                <br />
                                                To continue the development and save the code to DB, you need to change
                                                prototype state to “Development”.
                                                <br />
                                            </p>
                                        </div>
                                    </div>
                                </Popup>
                            </div>
                        )}
                    </div>

                    {canAccessGenAIPython && (
                        <CodeAssistant
                            onCodeGen={(newCode: any) => {
                                props.setCode(newCode);
                            }}
                            code={props.code}
                        />
                    )}

                    <CodeEditor {...props} />
                </div>
            </div>
            <div className="flex flex-col h-full w-3/6 pt-1">
                <div className="flex text-slate-400 py-1">
                    {permissions.PROTOTYPE(profile, model, prototype).canEdit() && activeTab == "Dashboard Config" && (
                        <div className="flex ml-4 items-center text-gray-600 text-sm select-none">
                            {savingWidgetConfig ? (
                                <div className="flex items-center">
                                    <CircularProgress size="0.8rem" style={{ color: "#005072" }} />
                                    <div className="ml-2">Saving...</div>
                                </div>
                            ) : (
                                <div className="flex">
                                    {widgetConfig == lastestWidgetConfig ? (
                                        <div className="flex items-center">
                                            <TbCloudCheck className="w-4 h-4 mr-1 text-aiot-blue" />
                                            Saved
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <TbCloudX className="w-4 h-4 mr-1  text-orange-500" />
                                            Unsaved
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grow"></div>
                    {TABS.map((tab) => (
                        <div
                            key={tab}
                            className={clsx(
                                "px-3 pt-1 pb-0 text-[14px] font-semi-bold select-none cursor-pointer hover:bg-gray-100",
                                activeTab === tab && "border-b-2 border-aiot-blue text-aiot-blue"
                            )}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </div>
                    ))}
                    <div className="flex px-3 items-center hover:bg-gray-100">
                        <a
                            className="flex text-[14px] font-semi-bold select-none "
                            href="https://studio.digitalauto.tech"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Widget Studio
                        </a>
                        <TbArrowUpRight className="w-5 h-5" />
                    </div>
                    <div className="flex px-3 items-center hover:bg-gray-100">
                        <a
                            className="flex text-[14px] font-semi-bold select-none "
                            href="https://marketplace.digitalauto.tech/packagetype/widget"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Widget Marketplace
                        </a>
                        <TbArrowUpRight className="w-5 h-5" />
                    </div>
                </div>

                <Popup state={popupState} width={"680px"} trigger={<span></span>}>
                    <APIDetails activeApi={activeApi} apiTags={apiTags} popupState={popupState} />
                </Popup>

                {activeTab == "All APIs" && (
                    <>
                        {useApis && useApis.length > 0 && (
                            <div className="mb-2">
                                <div className="px-8 mt-1 text-lg font-semibold text-slate-500 bg-slate-100">
                                    Used APIs({useApis.length})
                                </div>
                                <div className="px-6">
                                    {useApis.map((api: any, index: any) => (
                                        <ApiListItem key={index} onClickApi={onApiClick} item={api} activeApi="" />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="px-8 mt-1 text-lg font-semibold text-slate-500 bg-slate-100">All APIs</div>
                        <ListHalfMemoized
                            node_name=""
                            model={model}
                            listApiFetched={updateAllAPIs}
                            onClickApi={onApiClick}
                        />
                    </>
                )}

                {activeTab == "Used APIs" && (
                    <div className="px-6">
                        {(!useApis || useApis.length <= 0) && (
                            <div className="mx-4 mt-4 rounded text-center bg-slate-100 text-slate-400 text-sm py-4">
                                {" "}
                                No API used!
                            </div>
                        )}
                        {useApis.map((api: any, index: any) => (
                            <ApiListItem key={index} onClickApi={onApiClick} item={api} activeApi="" />
                        ))}
                    </div>
                )}

                {activeTab == "Dashboard Config" && (
                    <div className="flex flex-col h-full w-full overflow-hidden">
                        {permissions.PROTOTYPE(profile, model, prototype).canEdit() &&
                            linkOfEditors &&
                            linkOfEditors.length > 0 && (
                                <div className="flex items-center py-1 px-2 bg-orange-50">
                                    <div className="mr-2 text-sm">Edit your widgets on web studio</div>
                                    {linkOfEditors.map((link, lIndex) => (
                                        <div key={lIndex}>
                                            <a
                                                href={link}
                                                target="_blank"
                                                className="mx-1 py-1 px-2 cursro-pointer hover:bg-slate-100 text-aiot-blue text-md"
                                                rel="noreferrer"
                                            >
                                                Open
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        <div className="flex w-full">
                            <DashboardEditor
                                widgetConfigString={widgetConfig}
                                editable={props.editable}
                                usedAPIs={useApis}
                                onDashboardConfigChanged={(config: any) => {
                                    setWidgetConfig(config);
                                    setTimeout(() => {
                                        saveWidgetCode();
                                    }, 100);
                                }}
                            />
                        </div>
                        <div className="flex flex-col h-full w-full items-center px-2 py-1 text-xs text-gray-600rounded cursor-pointer">
                            <div className="flex w-full">
                                <Button variant="white" className="flex" onClick={() => setIsExpanded((old) => !old)}>
                                    <div>Show all raw config text</div>
                                    {isExpanded ? (
                                        <TbChevronDown className="ml-1" />
                                    ) : (
                                        <TbChevronRight className="ml-1" />
                                    )}
                                </Button>
                            </div>
                            <div className={`flex w-full h-full ${isExpanded ? "visible" : "invisible"}`}>
                                <CodeEditor
                                    code={widgetConfig}
                                    setCode={setWidgetConfig}
                                    editable={props.editable}
                                    language="json"
                                    onBlur={() => setTicker((oldTick) => oldTick + 1)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeViewer;
