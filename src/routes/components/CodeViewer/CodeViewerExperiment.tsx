import clsx from "clsx";
import { VscGithubInverted, VscSave } from "react-icons/vsc";
import { Model, Prototype, PrototypeGetSet } from "../../../apis/models";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import CodeEditor, { CodeEditorProps } from "./CodeEditor";
import TriggerPopup from "../../../reusable/triggerPopup/triggerPopup";
import CreateRepo from "./CreateRepo";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { useState, useEffect, useCallback } from "react";
import { saveWidgetConfig } from "../../../apis";
import useCurrentPrototype, { useCurrentPrototypeGetSet } from "../../../hooks/useCurrentPrototype";
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
import { IoIosWarning } from "react-icons/io";
import { fetchTagsInAPI } from "../../TagsFilter/ApiTagUtilities";
import { useGetUserFeatures } from "../../../reusable/hooks/useGetUserFeatures";
import DashboardEditor from "../Widget/DashboardEditor";
import {
    TbChevronDown,
    TbChevronRight,
    TbArrowUpRight,
    TbCloudCheck,
    TbCloudX,
    TbRocket,
    TbDotsVertical,
} from "react-icons/tb";
import Button from "../../../reusable/Button";
import { CircularProgress } from "@mui/material";
import { BsStars } from "react-icons/bs";
import { WEB_STUDIO_API, convertProjectPublicLinkToEditorLink } from "../../../services/webStudio";
import APIDetails from "./APIDetails";
import GenAI_ProtoPilot from "../GenAI/GenAIProtoPilot";
import axios from "axios";
import debounce from "lodash/debounce";

interface CodeViewerProps extends CodeEditorProps {
    saving: boolean;
    saveCode: () => Promise<void>;
}

const CodeViewerExperiment = ({ saving, saveCode, ...props }: CodeViewerProps) => {
    const model = useCurrentModel() as Model;
    // const prototype = useCurrentPrototype() as Prototype
    const { prototype, updatePrototype } = useCurrentPrototypeGetSet() as PrototypeGetSet;
    const { profile, isLoggedIn, user } = useCurrentUser();
    const canEdit = useCurrentProtototypePermissions().canEdit();
    const [widgetConfig, setWidgetConfig] = useState(prototype?.widget_config ?? "");
    const [lastestWidgetConfig, setLastestWidgetConfig] = useState(prototype?.widget_config ?? "");
    const [savingWidgetConfig, setSavingWidgetConfig] = useState(false);
    const prototypePermissions = useCurrentProtototypePermissions();
    const CAN_EDIT = permissions.PROTOTYPE(profile, model, prototype).canEdit();
    const [deployingToEpam, setDeployingToEpam] = useState(false);
    const [ticker, setTicker] = useState(0);

    const [allAPIs, setAllApis] = useState<any[]>([]);
    const [isAllAPIsUpdated, setIsAllAPIsUpdated] = useState(false);
    const [useApis, setUseApis] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("All APIs");

    const popupState = useState(false);
    const [activeApi, setActiveApi] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const [isExpandedAction, setIsExpandedAction] = useState(false);
    const [isOpenGenAIPython, setIsOpenGenAIPython] = useState(false);
    const [isOpenGenAIDashboard, setIsOpenGenAIDashboard] = useState(false);

    const TABS = ["All APIs", "Dashboard Config"];

    const [isDeployPopupOpen, setIsDeployPopupOpen] = useState(false);

    const [linkOfEditors, setLinkOfEditors] = useState<any[]>([]);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

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

    // Migrate old widget config format to new format
    const migrateWidgetConfig = (widgetConfigString: string): string => {
        try {
            const config = JSON.parse(widgetConfigString);
            // Check if the config is in the new format
            if (config.hasOwnProperty("widgets")) {
                // If 'widgets' key exists, check for 'auto_run' and keep its value
                return JSON.stringify(
                    {
                        auto_run: config.hasOwnProperty("auto_run") ? config.auto_run : false,
                        widgets: config.widgets,
                    },
                    null,
                    2
                );
            } else {
                // Migrate to new format with default 'auto_run' as false
                return JSON.stringify({ auto_run: false, widgets: config }, null, 2);
            }
        } catch (e) {
            console.error("Failed to parse widget configuration", e);
            return widgetConfigString; // Return original string if parsing fails
        }
    };

    // Debounce saving widget config on edit all raw config text
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (unsavedChanges) {
                saveWidgetCode(widgetConfig);
                setUnsavedChanges(false); // Reset the flag once saved
            }
        }, 1500); // Save after 1.5 seconds of inactivity

        return () => clearTimeout(timeout);
    }, [widgetConfig, ticker]);

    // When widgetConfig changes, mark as unsaved
    useEffect(() => {
        // console.log("widgetConfig", widgetConfig);
        // console.log("lastestWidgetConfig", lastestWidgetConfig);
        if (widgetConfig !== lastestWidgetConfig) {
            setUnsavedChanges(true);
        }
    }, [widgetConfig]);

    useEffect(() => {
        if (prototype?.widget_config) {
            const migratedConfig = migrateWidgetConfig(prototype.widget_config);
            setWidgetConfig(migratedConfig);
            setLastestWidgetConfig(migratedConfig);
        }
    }, [prototype?.widget_config]);

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
            return;
        }

        let newUsedAPIsList = [] as string[];
        allAPIs.forEach((item) => {
            if (props.code.includes(item.shortName)) {
                newUsedAPIsList.push(item); // Assuming item is the object you showed
            }
        });

        // Only update useApis if there's an actual change
        if (!arraysAreEqual(newUsedAPIsList, useApis)) {
            setUseApis(newUsedAPIsList);
        }
    }, [props.code, allAPIs]);

    // Prevent unnecessary updates when user typing code
    const arraysAreEqual = (array1, array2) => {
        if (array1.length !== array2.length) return false;
        const ids1 = array1.map((item) => item.uuid).sort();
        const ids2 = array2.map((item) => item.uuid).sort();
        return ids1.every((id, index) => id === ids2[index]);
    };

    useEffect(() => {
        // Debounce function to prevent multiple updates in quick succession
        const debounceUpdate = debounce(() => {
            // console.log("Update used APIs to backend", useApis);
            const source = axios.CancelToken.source();
            axios
                .post(
                    "/.netlify/functions/updatePrototypeUsedAPIs",
                    {
                        id: prototype.id,
                        usedAPIs: useApis,
                    },
                    {
                        cancelToken: source.token,
                    }
                )
                .catch((thrown) => {
                    if (axios.isCancel(thrown)) {
                        console.log("Request canceled", thrown.message);
                    } else {
                        console.error("Error updating used APIs", thrown);
                    }
                });

            return () => source.cancel("Component unmounted or request replaced");
        }, 500); // Adjust debounce time as needed

        debounceUpdate();

        return () => debounceUpdate.cancel();
    }, [useApis, prototype.id]);

    const onApiClick = async (api: any) => {
        setActiveApi(api);
        popupState[1](true);
        handleFetchActiveApiTags(api.name);
    };

    const updateAllAPIs = (apis: any[]) => {
        if (isAllAPIsUpdated) {
            return;
        }
        if (!apis) {
            setAllApis([]);
            setIsAllAPIsUpdated(true);
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
        setIsAllAPIsUpdated(true);
    };

    // DashboardEditor change immediately save the config to backend
    const onDashboardConfigChanged = (config) => {
        setWidgetConfig(config); // Update state immediately
        saveWidgetCode(config); // Save changes to backend
        setLastestWidgetConfig(config); // Update lastest config
        setIsOpenGenAIDashboard(false);
    };

    const saveWidgetCode = async (config) => {
        if (permissions.PROTOTYPE(profile, model, prototype).canEdit()) {
            setSavingWidgetConfig(true);
            await saveWidgetConfig(prototype.id, config); // Use the passed config
            updatePrototype({ ...prototype, widget_config: config }); // Update the prototype object
            setSavingWidgetConfig(false);
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

    const handleOnCodeChanged = useCallback(
        (code: string) => {
            props.setCode(code);
        },
        [props.setCode]
    ); // Only recreate the callback when props.setCode changes

    return (
        <div className="flex h-full w-full">
            <div className="flex flex-col h-full w-3/6">
                {prototypePermissions.canRead() && (
                    <div className="flex w-full bg-slate-100 py-1">
                        <div className="flex relative ml-2">
                            <Button
                                onClick={() => setIsExpandedAction((old) => !old)}
                                variant="white"
                                icon={TbDotsVertical}
                                iconClassName="text-aiot-blue"
                                className={`bg-white ${CAN_EDIT ? "" : "opacity-30 pointer-events-none"}`}
                            >
                                Actions
                            </Button>
                            {isExpandedAction && (
                                <div className="absolute flex flex-col top-8 left-0 p-1 bg-white border border-gray-200 shadow-sm rounded z-10">
                                    <div
                                        className={clsx(
                                            "flex px-2 pt-2 pb-2 !w-full select-none transition cursor-pointer place-items-center hover:bg-gray-100 rounded",
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
                                            "px-2 pt-2 pb-2 !w-fit select-none transition cursor-pointer grid place-items-center hover:bg-gray-100 rounded",
                                            false
                                                ? "text-gray-300 pointer-events-none"
                                                : "text-gray-500 hover:text-purple-700"
                                        )}
                                        onClick={async () => {
                                            if (IsBrowser.Safari()) {
                                                triggerSnackbar("This feature is not available on Safari.");
                                                return;
                                            }
                                            TriggerPopup(
                                                <CreateRepo model={model} code={props.code} />,
                                                "!w-fit !min-w-max"
                                            );
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
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpenGenAIPython(true)}
                            className={`bg-white ml-2 rounded px-3 py-1 flex items-center justify-center hover:bg-gray-100 border border-gray-200 shadow-sm text-sm text-gray-600 hover:text-gray-800 select-none ${
                                CAN_EDIT ? "" : "opacity-30 pointer-events-none"
                            }`}
                        >
                            <BsStars className="w-4 h-auto text-aiot-blue mr-1" />
                            SDV ProtoPilot
                        </button>
                        <div className="flex-grow"></div>
                        <Button
                            onClick={() => setIsDeployPopupOpen(true)}
                            variant="aiot-gradient"
                            icon={TbRocket}
                            iconClassName="w-5 h-auto mr-1"
                            iconStrokeWidth={1.7}
                            className="relative bg-white hover:bg-gray-200 mr-2"
                        >
                            Deploy
                        </Button>
                        <GenAI_ProtoPilot
                            type="GenAI_Python"
                            onClose={() => setIsOpenGenAIPython(false)}
                            isOpen={isOpenGenAIPython}
                            widgetConfig={widgetConfig}
                            onDashboardConfigChanged={onDashboardConfigChanged}
                            onCodeChanged={(e) => {
                                handleOnCodeChanged(e);
                                setIsOpenGenAIPython(false);
                            }}
                            pythonCode={props.code}
                        />
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
                                    {!unsavedChanges ? (
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
                                <div className="flex flex-col w-full px-6 scroll-gray">
                                    <div className="max-h-[150px] mt-2 overflow-y-auto scroll-gray">
                                        {useApis.map((api: any, index: any) => (
                                            <div key={api.name}>
                                                <ApiListItem
                                                    key={index}
                                                    onClickApi={onApiClick}
                                                    item={api}
                                                    activeApi=""
                                                />
                                            </div>
                                        ))}
                                    </div>
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
                        <div className="flex w-full">
                            <DashboardEditor
                                entireWidgetConfig={widgetConfig}
                                editable={props.editable}
                                usedAPIs={useApis}
                                onDashboardConfigChanged={onDashboardConfigChanged}
                            />
                        </div>
                        <div className="flex flex-col h-full w-full items-center px-2 py-1 text-xs text-gray-600rounded">
                            <div className="flex w-full">
                                <Button
                                    variant="white"
                                    className="flex bg-white pl-3"
                                    onClick={() => setIsExpanded((old) => !old)}
                                >
                                    <div>Show all raw config text</div>
                                    {isExpanded ? (
                                        <TbChevronDown className="ml-1" />
                                    ) : (
                                        <TbChevronRight className="ml-1" />
                                    )}
                                </Button>
                                <button
                                    onClick={() => setIsOpenGenAIDashboard(true)}
                                    className={`bg-white ml-2 rounded px-3 py-1 flex items-center justify-center hover:bg-gray-100 border border-gray-200 shadow-sm text-sm text-gray-600 hover:text-gray-800 select-none ${
                                        CAN_EDIT ? "" : "opacity-30 pointer-events-none"
                                    }`}
                                >
                                    <BsStars className="w-4 h-auto text-aiot-blue mr-1" />
                                    Dashboard ProtoPilot
                                </button>
                            </div>
                            <GenAI_ProtoPilot
                                type="GenAI_Dashboard"
                                onClose={() => setIsOpenGenAIDashboard(false)}
                                isOpen={isOpenGenAIDashboard}
                                widgetConfig={widgetConfig}
                                onDashboardConfigChanged={onDashboardConfigChanged}
                                pythonCode={props.code}
                            />
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

export default CodeViewerExperiment;
