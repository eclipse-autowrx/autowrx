import { ImageAreaEdit, ImageAreaPreview } from "image-area-lib";
import axios from "axios";
import { doc, updateDoc, setDoc, getDocs, query, where } from "firebase/firestore";
import { REFS } from "../../../../../../../apis/firebase";
import Button from "../../../../../../../reusable/Button";
import { useEffect, useState } from "react";
import { TbArrowLeft, TbEdit } from "react-icons/tb";
import { CircularProgress } from "@mui/material";
import GeneralTooltip from "../../../../../../../reusable/ReportTools/GeneralTooltip";
import permissions from "../../../../../../../permissions";
import useCurrentUser from "../../../../../../../reusable/hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";

const MASTER_ITEM = "master";

const APISkeleton = ({ node_name, model }: { node_name: string; model: any }) => {
    const [skeleton, setSkeleton] = useState<any>(null);
    const [activeSkeleton, setActiveSkeleton] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string>("view");
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const { profile } = useCurrentUser();
    const navigate = useNavigate();

    const handleNavigate = (url: string) => {
        // window.open(url, '_blank')
        if (url.toLowerCase().startsWith("http")) {
            window.open(url, "_blank");
        } else {
            if (url.includes("/")) {
                navigate(url);
            } else {
                navigate(`/model/${model.id}/cvi/list/${url}`);
            }
        }
    };

    const createNodeWithImage = (imageFile) => {
        return {
            id: new Date().getTime(),
            name: "Node 1",
            type: "node",
            parent_id: MASTER_ITEM,
            bgImage: imageFile,
            shapes: [],
        };
    };

    // Fetch api skeleton when changing API
    useEffect(() => {
        if (!model) return;
        setActiveSkeleton(null);
        setSkeleton(null);
        setActiveTab("view");
        fetchAPISkeleton(model.id, node_name);
    }, [model.id, node_name]);

    // Set active skeleton when changing skeleton
    useEffect(() => {
        if (skeleton && skeleton.nodes) {
            setActiveSkeleton(skeleton.nodes[0]);
        }
    }, [skeleton]);

    // When switch tab set active skeleton
    useEffect(() => {
        if (skeleton && skeleton.nodes) {
            setActiveSkeleton(skeleton.nodes[0]);
        }
    }, [activeTab]);

    // Fetch the API skeleton from the database
    const fetchAPISkeleton = async (modelID, apiName) => {
        if (!modelID || !apiName) return;
        setIsFetching(true);

        const apiQuery = query(REFS.api, where("apiName", "==", apiName), where("modelID", "==", modelID));
        const querySnapshot = await getDocs(apiQuery);

        if (querySnapshot.empty) {
            // Skeleton associated with the apiName does not exist
            if (apiName === "Vehicle" && model.model_home_image_file) {
                // Create a new skeleton for the root "Vehicle" api
                // Create a new skeleton for the root "Vehicle" node
                let newNode = createNodeWithImage(model.model_home_image_file);
                let newSkeleton = { nodes: [newNode] };
                setSkeleton(newSkeleton);
                await saveAPISkeleton(newSkeleton, true);
            } else {
                // Fetch parent's skeleton for child nodes
                const parentSkeleton = await fetchParentAPISkeleton(apiName, modelID);
                if (parentSkeleton) {
                    setSkeleton(parentSkeleton);
                }
            }
        } else {
            // Skeleton exists, update if no image is present for the root node
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            let skeletonData = data && data.skeleton ? JSON.parse(data.skeleton) : null;
            if (!skeletonData) {
                // In case of empty skeleton data but the record exists (tag) create skeleton with model image
                let newNode = createNodeWithImage(model.model_home_image_file);
                let newSkeleton = { nodes: [newNode] };
                setSkeleton(newSkeleton);
                await saveAPISkeleton(newSkeleton);
            } else {
                setSkeleton(skeletonData);
            }
        }

        setIsFetching(false);
    };

    // Fetch the skeleton of the parent API if the current API's skeleton is not found
    const fetchParentAPISkeleton = async (nodeName, modelID, originalNodeName = nodeName) => {
        if (!nodeName || nodeName === "Vehicle" || !nodeName.includes(".")) return null;

        const parentName = nodeName.substring(0, nodeName.lastIndexOf("."));
        const apiQuery = query(REFS.api, where("apiName", "==", parentName), where("modelID", "==", modelID));
        const querySnapshot = await getDocs(apiQuery);

        if (querySnapshot.empty && parentName === "Vehicle") {
            if (model.model_home_image_file) {
                // Create a new "Vehicle" record if it doesn't exist
                let newNode = createNodeWithImage(model.model_home_image_file);
                let newSkeleton = { nodes: [newNode] };
                await saveAPISkeleton(newSkeleton, true, parentName, modelID);
                return newSkeleton;
            } else {
                return null; // No model image available, so can't create a new "Vehicle" record
            }
        } else if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            if (data && data.skeleton) {
                return JSON.parse(data.skeleton);
            }
        }

        // Continue recursive call for the parent's parent
        return fetchParentAPISkeleton(parentName, modelID, originalNodeName);
    };

    // Check empty image inside skeleton node
    useEffect(() => {
        const checkAndUpdateBgImage = async () => {
            if (!skeleton || skeleton.nodes[0].bgImage) return;

            let tmpSkele = JSON.parse(JSON.stringify(skeleton));
            if (!tmpSkele.nodes) tmpSkele.nodes = [];
            let node = tmpSkele.nodes[0];
            if (!node) return;
            // Traverse up the hierarchy until an image is found
            let parentSkeleton = await fetchParentAPISkeleton(node_name, model.id);
            while (parentSkeleton && !node.bgImage) {
                let parentNode = parentSkeleton.nodes[0];
                if (parentNode && parentNode.bgImage) {
                    node.bgImage = parentNode.bgImage;
                    node.shapes = parentNode.shapes;
                    break;
                }
                parentSkeleton = await fetchParentAPISkeleton(parentSkeleton.apiName, model.id);
            }
            if (JSON.stringify(tmpSkele) !== JSON.stringify(skeleton)) {
                setSkeleton(tmpSkele);
            }
        };
        checkAndUpdateBgImage();
    }, [skeleton, model.id, model.model_home_image_file, node_name]);

    const onSaveRequested = async (data: any) => {
        if (!data) return;
        let tmpSkele = JSON.parse(JSON.stringify(skeleton)) || { nodes: [] };
        let nodes = tmpSkele.nodes;
        let node = nodes[0];

        node.shapes = data.shapes;
        node.bgImage = data.bgImage;
        await saveAPISkeleton(tmpSkele, true);
        setSkeleton(tmpSkele);
        setActiveTab("view");
    };

    const handleUploadImage = async (file: File) => {
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
            // let node = nodes.find((n: any) => n.id == activeNodeId);
            let node = nodes[0];
            // console.log(`data.fileLink`, data.data.fileLink)
            if (node) {
                node.shapes = []; // Remove shape of old image
                node.bgImage = data.data.fileLink;
                setSkeleton(tmpSkele);
                await saveAPISkeleton(tmpSkele);
            } else {
                console.log("Node not found");
            }
        } catch (err) {
            console.log(err);
        }
    };

    const saveAPISkeleton = async (skele: any, createIfNotExist = false, apiName = node_name, modelID = model.id) => {
        if (!modelID) return;

        setIsFetching(true);
        const apiQuery = query(REFS.api, where("apiName", "==", apiName), where("modelID", "==", modelID));
        const querySnapshot = await getDocs(apiQuery);
        let docRef;

        if (!querySnapshot.empty) {
            docRef = doc(REFS.api, querySnapshot.docs[0].id);
        } else if (createIfNotExist) {
            docRef = doc(REFS.api);
        } else {
            setIsFetching(false);
            return; // If not creating a new record and none exists, just return
        }

        const apiObject = {
            id: docRef.id,
            apiName: apiName,
            modelID: modelID,
            skeleton: JSON.stringify(skele),
        };

        try {
            if (!querySnapshot.empty) {
                await updateDoc(docRef, apiObject);
            } else if (createIfNotExist) {
                await setDoc(docRef, apiObject);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className={`flex flex-col w-full h-fit items-center`}>
            <div className={`flex flex-col w-full h-fit items-center`}>
                {isFetching ? (
                    // Render this part when isFetching is true
                    <div className="flex w-full items-center justify-center py-2">
                        <CircularProgress size="1rem" style={{ color: "#4b5563" }} />
                        <div className="ml-2 text-gray-600 min-h-[400px]"></div>
                    </div>
                ) : (
                    <div
                        className={`flex w-full justify-end py-2 px-2 ${permissions.TENANT(profile).canEdit() ? "visible" : "hidden"
                            }`}
                    >
                        <GeneralTooltip content={`Switch to ${activeTab === "view" ? "Edit" : "View"} mode`} space={20}>
                            <Button
                                variant="white"
                                icon={activeTab === "view" ? TbEdit : TbArrowLeft}
                                onClick={() => setActiveTab(activeTab === "view" ? "edit" : "view")}
                                className="px-5"
                                iconClassName="w-4 h-4"
                            >
                                {activeTab === "view" ? "Edit" : "Exit edit mode"}
                            </Button>
                        </GeneralTooltip>
                    </div>
                )}
            </div>
            {!isFetching && activeSkeleton && (
                <div className="flex w-full h-auto">
                    {activeTab === "view" ? (
                        <ImageAreaPreview
                            shapes={activeSkeleton?.shapes}
                            bgImage={activeSkeleton?.bgImage}
                            navigate={handleNavigate}
                        />
                    ) : (
                        <ImageAreaEdit
                            shapes={activeSkeleton?.shapes}
                            bgImage={activeSkeleton?.bgImage}
                            onSave={onSaveRequested}
                            handleUploadImage={handleUploadImage}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default APISkeleton;
