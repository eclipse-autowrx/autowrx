import { User as FirebaseUser } from "firebase/auth";
import {
    getDoc,
    getDocs,
    query,
    where,
    doc,
    DocumentData,
    Query,
    DocumentReference,
    updateDoc,
    setDoc,
    Timestamp,
    QueryConstraint,
} from "firebase/firestore";
import { CVI, CVI_system, CVI_v4_0, CVI_v4_1, TENANT_ID } from "../constants";
import { REFS } from "./firebase";
import { Model, Prototype, Plugin, User, TagCategory } from "./models";
import axios from "axios";
import { config } from "../configs/config";

const getMany = async <T extends any>(q: Query<DocumentData>) => {
    const result: T[] = [];
    (await getDocs(q)).forEach((doc) => result.push(doc.data() as T));
    return result;
};

const getSingle = async <T extends any>(ref: DocumentReference<DocumentData>) => {
    return (await getDoc(ref)).data() as T;
};

export const getPrototypesOfModels = async (model_ids: string[]) => {
    let ret: any[] = [];
    try {
        let numOfCall = Math.ceil(model_ids.length / 30);
        // console.log("NumOfModel", model_ids.length)
        // console.log("numOfCall", numOfCall)
        for (let i = 0; i < numOfCall; i++) {
            let subRet = await getMany<Prototype>(
                query(
                    REFS.prototype,
                    where("model_id", "in", model_ids.slice(i * 30, Math.min((i + 1) * 30, model_ids.length)))
                )
            );
            ret = ret.concat(subRet);
        }
    } catch (e) {
        console.log(e);
    }
    // console.log(ret)
    return ret;
};

export const getPrototypes = async (model_id: string) => {
    return await getMany<Prototype>(query(REFS.prototype, where("model_id", "==", model_id)));
};

export const getPluginsOfModels = async (model_ids: string[]) => {
    let ret: any[] = [];
    try {
        let numOfCall = Math.ceil(model_ids.length / 30);
        for (let i = 0; i < numOfCall; i++) {
            let subRet = await getMany<Plugin>(
                query(
                    REFS.plugin,
                    where("model_id", "in", model_ids.slice(i * 30, Math.min((i + 1) * 30, model_ids.length)))
                )
            );
            ret = ret.concat(subRet);
        }
    } catch (e) {
        console.log(e);
    }
    return ret;
    // return await getMany<Plugin>(query(REFS.plugin, where("model_id", "in", model_ids)))
};

export const getPlugins = async (model_id: string) => {
    console.log(`getPlugins ${model_id}`);
    return await getMany<Plugin>(query(REFS.plugin, where("model_id", "==", model_id)));
};

export const getLinkedPluginFromPrototype = async (model_id: string, prototype_id: string) => {
    const plugins = await getMany<Plugin>(
        query(REFS.plugin, where("model_id", "==", model_id), where("prototype_id", "==", prototype_id))
    );

    return plugins[0] as Plugin | undefined;
};

export const getUser = async (user_uid: string) => {
    return getSingle<User>(doc(REFS.user, user_uid));
};

export const getTagCategories = async () => {
    // return [
    //     {
    //         id: "partner",
    //         tenant_id: TENANT_ID,
    //         name: "Partner",
    //         color: "#F4A460",
    //         tags: {
    //             Bosch: {
    //                 name: "Bosch",
    //                 description: "",
    //                 tag_image_file: ""
    //             },
    //             RTI: {
    //                 name: "RTI",
    //                 description: "",
    //                 tag_image_file: ""
    //             },
    //             "AIoT LabNH": {
    //                 name: "AIoT LabNH",
    //                 description: "",
    //                 tag_image_file: ""
    //             },
    //             "AWS": {
    //                 name: "AWS",
    //                 description: "",
    //                 tag_image_file: ""
    //             },
    //         }
    //     },
    //     {
    //         id: "domain",
    //         tenant_id: TENANT_ID,
    //         name: "Domain",
    //         color: "#ffe4b5",
    //         tags: {}
    //     },
    //     {
    //         id: "status",
    //         tenant_id: TENANT_ID,
    //         name: "Status",
    //         color: "#66ddaa",
    //         tags: {}
    //     },
    //     {
    //         id: "sponsor",
    //         tenant_id: TENANT_ID,
    //         name: "Sponsor",
    //         color: "#C0C0C0",
    //         tags: {}
    //     }
    // ]
    return getMany<TagCategory>(query(REFS.tags, where("tenant_id", "==", TENANT_ID)));
};

export const getModel = async (model_id: string) => {
    return getSingle<Model>(doc(REFS.model, model_id));
};

export const getModels = async () => {
    let from = new Date().getTime();
    let res = await getMany<Model>(query(REFS.model, where("tenant_id", "==", TENANT_ID)));
    console.log(`Get Model take ${new Date().getTime() - from} ms`);
    return res;
};

export const getUsers = async (...queryConstraints: QueryConstraint[]) => {
    return await getMany<User>(query(REFS.user, where("tenant_id", "==", TENANT_ID), ...queryConstraints));
};

export const savePrototypeCode = async (prototype_id: string, code: string) => {
    await updateDoc(doc(REFS.prototype, prototype_id), {
        code,
    });
};

export const saveModelName = async (model_id: string, name: string) => {
    await updateDoc(doc(REFS.model, model_id), {
        name,
    });
};

export const saveModelSkeleton = async (model_id: string, skeleton: string) => {
    await updateDoc(doc(REFS.model, model_id), {
        skeleton,
    });
};

export const savePrototypeSkeleton = async (prototype_id: string, skeleton: string) => {
    await updateDoc(doc(REFS.prototype, prototype_id), {
        skeleton,
    });
};

export const saveWidgetConfig = async (prototype_id: string, widget_config: string) => {
    await updateDoc(doc(REFS.prototype, prototype_id), {
        widget_config,
    });
};

export const getMedia = async () => {
    const result = await getDoc(doc(REFS.media, TENANT_ID));
    if (!result.exists()) {
        return [];
    }

    const media = result.data().media as {
        [key: string]: {
            type: "image" | "model";
            imageUrl: string;
            thumbnailUrl: string;
            filename: string;
        };
    };

    return Object.values(media).sort((a, b) => (a.filename > b.filename ? 1 : -1));
};

export const newModel = async (
    name: string,
    visibility: string,
    user: FirebaseUser,
    root_node: string | null,
    api_type: string,
    vehicle_category: string,
    property: string
) => {
    const newModelRef = doc(REFS.model);

    const getAPITypes = (type: string, root_node: string | null) => {
        switch (type) {
            case "vss_api":
                return CVI;
            case "vss_api_v4.0":
                return CVI_v4_0;
            case "vss_api_v4.1":
                return CVI_v4_1;
            case "system_api":
                return CVI_system;
            default:
                return JSON.stringify({
                    [root_node || "Vehicle"]: {
                        children: {},
                        description: "",
                        type: "branch",
                        uuid: "ccc825f94139544dbb5f4bfd033bece6",
                    },
                });
        }
    };
    await setDoc(newModelRef, {
        id: newModelRef.id,
        custom_apis: {},
        created: {
            created_time: Timestamp.now(),
            user_uid: user.uid,
        },
        cvi: getAPITypes(api_type, root_node),
        main_api: root_node || "Vehicle",
        model_home_image_file:
            root_node !== null
                ? ""
                : "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fcar_full_ed.PNG?alt=media&token=ea75b8c1-a57a-44ea-9edb-9816131f9905",
        model_files: {
            [root_node || "Vehicle"]: {
                glb_file: "",
                image_file:
                    root_node !== null
                        ? ""
                        : "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fcar_full_ed.PNG?alt=media&token=ea75b8c1-a57a-44ea-9edb-9816131f9905",
            },
        },
        name,
        visibility,
        tenant_id: TENANT_ID,
        vehicle_category,
        property,
    });

    if (newModelRef) {
        return newModelRef.id;
    }

    return null;
};

export const addLog = async (
    name: string,
    description: string | null,
    type: string,
    create_by: string | null,
    image: string | null,
    ref_id: string | null,
    ref_type: string | null,
    parent_id?: string | null
) => {
    try {
        const data = {
            name,
            create_by,
            type,
            image,
            description,
            ref_id,
            ref_type,
            parent_id,
            project_id: TENANT_ID,
        };
        await axios.post(config.logBaseUrl, data);
    } catch (err) {
        console.log("addLog", err);
    }

    try {
        const newAcitivityRef = doc(REFS.activity_log);
        await setDoc(newAcitivityRef, {
            id: newAcitivityRef.id,
            created_time: Timestamp.now(),
            create_by: create_by,
            name,
            type,
            image,
            description,
            ref_id,
            ref_type,
            parent_id: parent_id ? parent_id : null,
            tenant_id: TENANT_ID,
        });
    } catch (err) {
        console.log("addLog", err);
    }
};
