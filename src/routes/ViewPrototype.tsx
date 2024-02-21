import Tab from "../reusable/Tabs/Tab";
import TabContainer from "../reusable/Tabs/TabContainer";
import CodeViewer from "./components/CodeViewer/CodeViewer";
import { VscCode, VscDashboard, VscDebugStart, VscFeedback, VscLaw } from "react-icons/vsc";
import { TbBinaryTree } from "react-icons/tb";
import { IoAnalytics } from "react-icons/io5";
import { IconType } from "react-icons";
import LinkWrap from "../reusable/LinkWrap";
import { useEffect, useState, useRef } from "react";
import RunDashboard from "./components/RunDashboard/RunDashboard";
import Homologation from "./components/Homologation";
import useCurrentPrototype, { CurrentPrototypeProvider, useCurrentPrototypeGetSet } from "../hooks/useCurrentPrototype";
import LoadingPage from "./components/LoadingPage";
import { Model, PrototypeGetSet } from "../apis/models";
import { getPrototypes, savePrototypeCode } from "../apis";
import { useCurrentModel } from "../reusable/hooks/useCurrentModel";
import { useParamsX } from "../reusable/hooks/useUpdateNavigate";
import Feedback from "./components/Feedback";
import { GiJourney } from "react-icons/gi";
import Journey, { JourneyRef } from "./components/Journey";
import Analysis from "./components/Analysis";
import { useCurrentProtototypePermissions } from "../permissions/hooks";
import { Prototype } from "../apis/models";
import { downloadPrototypeZip } from "../utils/zipUtils";
import PrototypeDiscussion from "./components/Discussion/PrototypeDiscussion";
import Dropdown from "../reusable/Dropdown";
import { MenuItem } from "@mui/material";
import { TbMessages } from "react-icons/tb";
import { FiDownload, FiShare2 } from "react-icons/fi";
import Flow from "./components/Flow/Flow";
import PrototypeSkeletonPage from "../reusable/Skeleton/PrototypeSkeletonPage";
import axios from "axios";
import CodeViewerExperiment from "./components/CodeViewer/CodeViewerExperiment";

import {
    FacebookShareButton,
    FacebookIcon,
    LinkedinShareButton,
    LinkedinIcon,
    TelegramShareButton,
    TelegramIcon,
    TwitterShareButton,
    TwitterIcon,
    WhatsappShareButton,
    WhatsappIcon,
} from "react-share";
import SideNav from "../reusable/SideNav/SideNav";
import PrototypeRunMode from "./Plugins/PrototypeRunMode";

interface IconTabProps {
    Icon: IconType;
    label: string;
    active?: boolean;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    size?: string;
}

const IconTab = ({ Icon, label, active = false, onClick, size = "1.2em" }: IconTabProps) => {
    return (
        <Tab
            onClick={onClick}
            label={
                <div className="flex items-center">
                    <Icon size={size} className="mr-2" />
                    {label}
                </div>
            }
            active={active}
            className="px-5"
        />
    );
};

interface ViewPrototypeProps {
    prototype_tab:
        | "cvi"
        | "flow"
        | "code"
        | "run"
        | "discussion"
        | "feedback"
        | "journey"
        | "architecture"
        | "homologation";
    display?: "tree" | "list";
}

const DEFAULT_PY_CODE = `from sdv_model import Vehicle
import plugins
from browser import aio

vehicle = Vehicle()

# write your code here

`;

const ShareItems = ({ shareUrl, name }) => {
    return (
        <>
            <MenuItem className="px-4 py-1" style={{ minHeight: 36 }}>
                <LinkedinShareButton url={shareUrl} className="flex items-center">
                    <LinkedinIcon size={32} round />
                    <div className="ml-4">Linkedin</div>
                </LinkedinShareButton>
            </MenuItem>

            <MenuItem className="px-4 py-1" style={{ minHeight: 36 }}>
                <FacebookShareButton url={shareUrl} quote={name} className="flex items-center">
                    <FacebookIcon size={32} round />
                    <div className="ml-4">Facebook</div>
                </FacebookShareButton>
            </MenuItem>

            <MenuItem className="px-4 py-1" style={{ minHeight: 36 }}>
                <TwitterShareButton url={shareUrl} className="flex items-center">
                    <TwitterIcon size={32} round />
                    <div className="ml-4">Twitter</div>
                </TwitterShareButton>
            </MenuItem>

            <MenuItem className="px-4 py-1" style={{ minHeight: 36 }}>
                <WhatsappShareButton url={shareUrl} className="flex items-center">
                    <WhatsappIcon size={32} round />
                    <div className="ml-4">Whatsapp</div>
                </WhatsappShareButton>
            </MenuItem>

            <MenuItem className="px-4 py-1" style={{ minHeight: 36 }}>
                <TelegramShareButton url={shareUrl} className="flex items-center">
                    <TelegramIcon size={32} round />
                    <div className="ml-4">Telegram</div>
                </TelegramShareButton>
            </MenuItem>
        </>
    );
};

const ViewPrototypeInner = ({ prototype_tab, display = "list" }: ViewPrototypeProps) => {
    const prototype = useCurrentPrototype();
    const { updatePrototype } = useCurrentPrototypeGetSet() as PrototypeGetSet;
    const prototype_id = typeof prototype === "undefined" ? "new" : prototype.id;

    const [code, setCode] = useState(prototype?.code ?? "");
    const [lastestSavedCode, setLastestSavedCode] = useState(prototype?.code ?? "");
    const [saving, setSaving] = useState(false);
    const [ticker, setTicker] = useState(0);
    const [editable,setEditable] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const canEdit = useCurrentProtototypePermissions().canEdit();
    const [isEditing, setEditing] = useState(false);
    const [isSave, setSave] = useState(false);
    const [discussionCount, setDiscussionCount] = useState<number>(0);
    const journeySaveRef = useRef<JourneyRef | null>(null);

    const saveCode = async () => {
        if (canEdit && lastestSavedCode != code) {
            if (prototype?.state !== "released") {
                setSaving(true);
                await savePrototypeCode(prototype_id, code);
                if (prototype) {
                    updatePrototype({ ...prototype, code });
                }
                setSaving(false);
            }
            setLastestSavedCode(code);
            streamToAutoverse(code);
        }
    };

    const streamToAutoverse = async (code: string) => {
        if (code && code.includes("## autoverse-f3g63a")) {
            try {
                // await axios.post("https://fitforfutureapi-dev.azurewebsites.net/api/Autoverse/AddEditorData", {
                await axios.post("https://prod-atvs-gwc-fastapi-appsrvc.azurewebsites.net/posteditordata", {
                    editorData: code,
                });
            } catch (err: any) {
                console.log(err ? err.message : err);
            }
        }
    };

    useEffect(() => {
        setShareUrl(window.location.href);

        setEditable(canEdit);
        if (canEdit && !code.trim()) {
            setCode(DEFAULT_PY_CODE);
        }
        let timer = setInterval(() => {
            setTicker((oldTick) => oldTick + 1);
        }, 5000);

        return () => {
            clearInterval(timer);
            saveCode();
        };
    }, []);

    useEffect(() => {
        saveCode();
    }, [ticker]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex w-full bg-aiot-blue px-4 py-2 text-white font-bold select-none items-center">
                {prototype?.name}
                <div className="grow"></div>
                {prototype && (
                    <>
                        <div style={{ display: "none" }}>
                            <PrototypeDiscussion setDiscussionCount={setDiscussionCount} />
                        </div>
                        <SideNav
                            trigger={
                                <div className="hover:opacity-70 cursor-pointer px-3 py-1 h-full font-medium text-white flex items-center text-[18px]">
                                    <TbMessages className="w-5 h-5" />
                                    <span className="ml-2">{`Discussion (${discussionCount})`}</span>

                                    {/* {discussionCount > 0 && (
                                        <span className="ml-1 inline-flex items-center justify-center h-4 w-6 rounded bg-white text-aiot-blue text-xs">
                                            {discussionCount}
                                        </span>
                                    )} */}
                                </div>
                            }
                            width="600px"
                            className="h-screen"
                        >
                            <PrototypeDiscussion setDiscussionCount={setDiscussionCount} />
                        </SideNav>

                        <Dropdown
                            trigger={
                                <div
                                    className="hover:opacity-70 cursor-pointer px-3 py-1 h-full font-medium 
                                                    text-white flex items-center text-[18px]"
                                >
                                    <FiShare2 />
                                    <span className="ml-2">Share</span>
                                </div>
                            }
                        >
                            <ShareItems shareUrl={shareUrl} name={prototype.name} />
                        </Dropdown>

                        <div
                            className="hover:opacity-70 cursor-pointer px-3 font-medium text-white flex items-center text-[18px]"
                            onClick={() => {
                                if (!prototype) return;
                                downloadPrototypeZip(prototype);
                            }}
                        >
                            <FiDownload />
                            <span className="ml-2">Export</span>
                        </div>
                    </>
                )}
            </div>
            <div className="flex w-full bg-gray-50">
                <div className="flex w-full">
                    <TabContainer>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/journey`}>
                            <IconTab Icon={GiJourney} label="Journey" active={prototype_tab === "journey"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/architecture`}>
                            <IconTab
                                Icon={TbBinaryTree}
                                label="Architecture"
                                active={prototype_tab === "architecture"}
                            />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/code`}>
                            <IconTab Icon={VscCode} label="Code" active={prototype_tab === "code"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/flow`}>
                            <IconTab Icon={IoAnalytics} label="Flow" active={prototype_tab === "flow"} size="1.4em" />
                        </LinkWrap>
                        {/* <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/discussion`}>
                            <IconTab Icon={IoAnalytics} label="Flow" active={prototype_tab === "discussion"} size="1.4em" />
                        </LinkWrap> */}
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/run`}>
                            <IconTab Icon={VscDashboard} label="Dashboard" active={prototype_tab === "run"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/homologation`}>
                            <IconTab Icon={VscLaw} label="Homologation" active={prototype_tab === "homologation"} />
                        </LinkWrap>
                        <LinkWrap to={`/model/:model_id/library/prototype/${prototype_id}/view/feedback`}>
                            <IconTab Icon={VscFeedback} label="Feedback" active={prototype_tab === "feedback"} />
                        </LinkWrap>
                    </TabContainer>
                    <div className="grow"></div>
                </div>
            </div>
            <div className="flex h-full w-full" style={{ height: "calc(100% - 86px)" }}>
                {prototype_tab === "code" ? (
                    <div className="block w-full">
                        <CodeViewerExperiment
                            saveCode={saveCode}
                            saving={saving}
                            code={code}
                            setCode={setCode}
                            onBlur={() => setTicker((oldTick) => oldTick + 1)}
                            editable={editable || false}
                            language="python"
                        />
                    </div>
                ) : prototype_tab === "discussion" ? (
                    <PrototypeDiscussion />
                ) : prototype_tab === "run" ? (
                    <RunDashboard code={code} />
                ) : prototype_tab === "flow" ? (
                    <Flow appCode={code} />
                ) : prototype_tab === "cvi" ? (
                    <Analysis />
                ) : prototype_tab === "feedback" ? (
                    <Feedback prototype_id={prototype_id} />
                ) : prototype_tab === "journey" ? (
                    <Journey
                        ref={journeySaveRef}
                        isEditing={isEditing}
                        isSave={isSave}
                        setEditing={(e) => {
                            setEditing(e);
                        }}
                    />
                ) : prototype_tab === "architecture" ? (
                    <PrototypeSkeletonPage />
                ) : prototype_tab === "homologation" ? (
                    <Homologation />
                ) : null}
            </div>
        </div>
    );
};

const ViewPrototype = ({ prototype_tab, display = "list" }: ViewPrototypeProps) => {
    const model = useCurrentModel() as Model;

    const { prototype_id = "" } = useParamsX();

    // const {value: proto, loading} = useAsyncRefresh(async () => {
    //     const prototypes = await getPrototypes(model.id)
    //     return prototypes.find(prototype => prototype.id === prototype_id)
    // }, [model.id])

    const [prototype, setPrototype] = useState<Prototype>();
    const [loading, setLoading] = useState(true);

    const downloadPrototype = () => {
        getPrototypes(model.id)
            .then((prototypes) => {
                let proto = prototypes.find((prototype) => prototype.id === prototype_id);
                if (proto) {
                    setPrototype(proto);
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        downloadPrototype();
    }, [model.id]);

    if (loading) {
        return <LoadingPage />;
    }

    if (typeof prototype === "undefined" && prototype_id !== "new") {
        return (
            <div className="text-gray-500 text-5xl flex w-full h-full pb-20 items-center justify-center">
                Prototype not found
            </div>
        );
    }

    const updatePrototype = (proto: Prototype) => {
        // setPrototype(proto)
        downloadPrototype();
    };

    return (
        <>
            {prototype && (
                <CurrentPrototypeProvider value={{ prototype, updatePrototype }}>
                    <ViewPrototypeInner prototype_tab={prototype_tab} display={display} />
                </CurrentPrototypeProvider>
            )}
        </>
    );
};

export default ViewPrototype;
