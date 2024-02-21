import { useEffect, useState } from "react";
import { Model } from "../../apis/models";
import { useCurrentModel } from "../hooks/useCurrentModel";
import useCurrentUser from "../hooks/useCurrentUser";
import { addLog, saveModelSkeleton } from "../../apis";
import { ImageAreaEdit, ImageAreaPreview, IShape } from "image-area-lib";
// import { ImageAreaEdit, ImageAreaPreview, IShape } from "./image-area/esm/index";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaRegEdit } from "react-icons/fa";

const MASTER_ITEM = "master";

const ModelSkeletonPage = () => {
    const [searchParams] = useSearchParams();
    const { profile } = useCurrentUser();
    const model = useCurrentModel() as Model;
    const [skeleton, setSkeleton] = useState<any>(null);
    const [activeNodeId, setActiveNodeId] = useState<any>(null);
    const [activeNode, setActiveNode] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [isEditName, setIsEditName] = useState<boolean>(false);
    const [tmpNodeName, setTmpNodeName] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!model) return;
        // console.log("ModelSkeletonPage model", model)
        let skele = { nodes: [] };
        if (model.skeleton) {
            try {
                skele = JSON.parse(model.skeleton);
            } catch (err) {}
        }
        setSkeleton(skele);
    }, [model.id]);

    useEffect(() => {
        let id = searchParams.get("id");
        setActiveNodeId(id || null);
    }, [searchParams]);

    useEffect(() => {
        setIsEditName(false);
        let activeNode = null;
        if (skeleton && skeleton.nodes && skeleton.nodes.length > 0) {
            if (!activeNodeId) {
                navigate(`${window.location.pathname}?id=${skeleton.nodes[0].id}`);
                return;
            }
            activeNode = skeleton.nodes.find((n: any) => n.id == activeNodeId);
        }

        setActiveNode(activeNode);
    }, [activeNodeId, skeleton]);

    useEffect(() => {
        if (activeNode) {
            setIsEditMode(false);
        }
    }, [activeNode]);

    useEffect(() => {
        setIsEditName(false);
    }, [isEditMode]);

    const callSave = async (skele: any) => {
        if (!model) return;
        try {
            await saveModelSkeleton(model.id, JSON.stringify(skele));
        } catch (err) {
            console.log("error on save skeleton", err);
        }
    };

    const createNewNode = async () => {
        let tmpSkele = JSON.parse(JSON.stringify(skeleton));
        if (!tmpSkele.nodes) tmpSkele.nodes = [];
        let nodes = tmpSkele.nodes;
        let id = new Date().getTime();
        nodes.push({
            id: id,
            name: "Node " + (nodes.length + 1),
            type: "node",
            parent_id: tmpSkele.nodes.length <= 0 ? MASTER_ITEM : "NAN",
            content: {
                bgImage: "",
                shapes: [],
            },
        });
        setSkeleton(tmpSkele);
        setActiveNodeId(id);
        await callSave(tmpSkele);

        if (profile) {
            const username = profile.name || profile.name || "Anonymous";

            addLog(
                `User '${username}' create new node with id '${id}' in architecture`,
                `User '${username}' create new node with id '${id}' in architecture of model '${model.name}' with id '${model.id}'`,
                "create",
                profile.uid,
                null,
                String(id),
                "architecture_node",
                null
            );
        }
    };

    const onSaveRequested = async (data: any) => {
        // console.log("onSave", data);
        if (!data) return;

        let tmpSkele = JSON.parse(JSON.stringify(skeleton));
        if (!tmpSkele.nodes) tmpSkele.nodes = [];
        let nodes = tmpSkele.nodes;
        let node = nodes.find((n: any) => n.id == activeNodeId);
        if (node) {
            node.shapes = data.shapes;
            node.bgImage = data.bgImage;
            setSkeleton(tmpSkele);
            await callSave(tmpSkele);
        }
    };

    const handleNavigate = (url: string) => {
        url.toLowerCase().startsWith("http") ? window.open(url, "_blank") : navigate(url);
    };

    const copyTextToClipboard = async (text) => {
        if ("clipboard" in navigator) {
            return await navigator.clipboard.writeText(text);
        } else {
            return document.execCommand("copy", true, text);
        }
    };

    const handleUploadImage = async (file: File) => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append("path", `/${file.name}`);
        formData.append("uploaded_file", file);
        try {
            let data = (await axios.post(
                "https://bewebstudio.digitalauto.tech/project/TxV9WvrPjKrg/upload-file?excludeRoot=false&&force=true",
                formData,
                { headers: { "Content-Type": "form-data/multipart" } }
            )) as any;
            // console.log(`data`, data)
            // console.log(`fileLink`, data.data.fileLink)
            if (!data || !data.data || !data.data.fileLink) return;
            let tmpSkele = JSON.parse(JSON.stringify(skeleton));
            if (!tmpSkele.nodes) tmpSkele.nodes = [];
            let nodes = tmpSkele.nodes;
            let node = nodes.find((n: any) => n.id == activeNodeId);
            // console.log(`data.fileLink`, data.data.fileLink)
            if (node) {
                node.bgImage = data.data.fileLink;
                setSkeleton(tmpSkele);
                await callSave(tmpSkele);
            } else {
                console.log("Node not found");
            }
        } catch (err) {
            console.log(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="w-full h-full flex bg-slate-200 text-slate-700">
            <div className="w-[260px] min-w-[240px] h-full px-0 py-0 bg-slate-100 text-slate-700 flex flex-col">
                <div className="py-1 px-2 flex items-center border-b border-slate-300 bg-slate-500">
                    <div className="font-bold text-[13px] py-0.5 grow text-white">Architecture Mapping</div>
                    <div
                        className="text-emerald-200 px-2 text-[15px] rounded font-bold 
                                cursor-pointer hover:bg-slate-400"
                        onClick={createNewNode}
                    >
                        New Node
                    </div>
                </div>
                <div className="w-full grow overflow-auto select-none">
                    {skeleton &&
                        skeleton.nodes &&
                        skeleton.nodes.map((node: any) => (
                            <div
                                key={node.id}
                                onClick={
                                    () => navigate(`${window.location.pathname}?id=${node.id}`)
                                    //setActiveNodeId(node.id)
                                }
                                className={`px-3 py-2 border-b border-slate-300 cursor-pointer hover:bg-sky-100
                        ${node.id == activeNodeId && "bg-sky-200"}`}
                            >
                                <div className="text-[15px] leading-tight font-semibold text-slate-600">
                                    {" "}
                                    {node.name}{" "}
                                </div>
                                <div className="text-[11px] italic font-light leading-tight text-slate-600">
                                    {" "}
                                    ID: {node.id}{" "}
                                </div>
                                <div className="flex text-xs select-none font-bold">
                                    <div className="grow"></div>
                                    <div
                                        className="text-aiot-blue rounded ml-2 px-1 py-0.5 cursor-pointer hover:bg-slate-100"
                                        onClick={(event) => {
                                            copyTextToClipboard(`${window.location.pathname}?id=${node.id}`);
                                            if (event.stopPropagation) {
                                                event.stopPropagation(); // W3C model
                                            }
                                        }}
                                    >
                                        Copy Link
                                    </div>
                                    <div
                                        className="text-red-500 rounded ml-2 px-1 py-0.5 cursor-pointer hover:bg-slate-100"
                                        onClick={() => {
                                            if (confirm(`Do you confirm to delete node '${node.name}'?`)) {
                                                let tmpSkele = JSON.parse(JSON.stringify(skeleton));
                                                if (!tmpSkele.nodes) tmpSkele.nodes = [];
                                                tmpSkele.nodes = tmpSkele.nodes.filter((n: any) => n.id != node.id);
                                                setSkeleton(tmpSkele);
                                                if (activeNodeId == node.id) {
                                                    setActiveNodeId(null);
                                                }
                                                callSave(tmpSkele);

                                                // Add delete node log
                                                if (profile) {
                                                    const username = profile.name || profile.name || "Anonymous";

                                                    addLog(
                                                        `User '${username}' delete node with id '${node.id}' in architecture`,
                                                        `User '${username}' delete node with id '${node.id}' in architecture of model '${model.name}' with id '${model.id}'`,
                                                        "delete",
                                                        profile.uid,
                                                        null,
                                                        String(node.id),
                                                        "architecture_node",
                                                        null
                                                    );
                                                }
                                            }
                                        }}
                                    >
                                        Delete
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            {activeNode && (
                <div className="px-1 rounded bg-white grow">
                    <div className="flex items-center text-xl font-bold pl-4 pr-2 py-1 mb-1 text-slate-700 bg-slate-200">
                        <div className="flex items-center">
                            {!isEditName && (
                                <>
                                    {activeNode.name}
                                    <FaRegEdit
                                        onClick={() => {
                                            setTmpNodeName(activeNode.name);
                                            setIsEditName(true);
                                        }}
                                        className="ml-4 text-slate-600 cursor-pointer hover:opacity-70"
                                    />
                                </>
                            )}
                            {isEditName && (
                                <>
                                    <input
                                        className="w-[600px] px-2 py-0.5 bg-white text-slate-700 text-[14px] rounded"
                                        onChange={(e) => setTmpNodeName(e.target.value)}
                                        value={tmpNodeName}
                                    />
                                    <div
                                        onClick={async () => {
                                            if (tmpNodeName.length <= 0) return;
                                            let tmpSkele = JSON.parse(JSON.stringify(skeleton));
                                            if (!tmpSkele.nodes) tmpSkele.nodes = [];
                                            let nodes = tmpSkele.nodes;
                                            let node = nodes.find((n: any) => n.id == activeNodeId);
                                            if (node) {
                                                node.name = tmpNodeName;
                                                setSkeleton(tmpSkele);
                                                await callSave(tmpSkele);
                                            }
                                            setIsEditName(false);
                                        }}
                                        className={`ml-2 cursor-pointer bg-aiot-blue hover:opacity-80 rounded px-3 py-0.5 text-md text-white font-normal text-[16px]
                                ${tmpNodeName.length <= 0 && "bg-slate-400"}
                                `}
                                    >
                                        Save
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="grow"></div>
                        <div className="flex rounded text-[13px] font-semibold leading-tight">
                            <div
                                className={`w-[84px] text-center px-2 pt-1 pb-1 mr-2 cursor-pointer ${
                                    !isEditMode ? "border-b-2 border-aiot-blue text-aiot-blue" : "text-slate-400"
                                }`}
                                onClick={() => {
                                    setIsEditMode(false);
                                }}
                            >
                                View Mode
                            </div>
                            <div
                                className={`w-[84px] text-center px-2 pt-1 pb-1 cursor-pointer ${
                                    isEditMode ? "border-b-2 border-aiot-blue text-aiot-blue" : "text-slate-400"
                                }`}
                                onClick={() => {
                                    setIsEditMode(true);
                                }}
                            >
                                Edit Mode
                            </div>
                        </div>
                    </div>

                    <div className="grow border-2 border-slate-100">
                        {!isEditMode && (
                            <ImageAreaPreview
                                shapes={activeNode?.shapes}
                                bgImage={activeNode?.bgImage}
                                navigate={handleNavigate}
                            />
                        )}
                        {isEditMode && (
                            <ImageAreaEdit
                                shapes={activeNode?.shapes}
                                bgImage={activeNode?.bgImage}
                                onSave={onSaveRequested}
                                handleUploadImage={handleUploadImage}
                            />
                        )}
                    </div>
                </div>
            )}
            {!activeNode && (
                <div className="grow flex items-center justify-center h-full text-slate-300 text-2xl min-h-[400px]">
                    No Node Selected!
                </div>
            )}
        </div>
    );
};

export default ModelSkeletonPage;
