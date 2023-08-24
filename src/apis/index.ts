import { User as FirebaseUser } from "firebase/auth";
import { getDoc, getDocs, query, where, doc, DocumentData, Query, DocumentReference, updateDoc, setDoc, Timestamp, QueryConstraint } from "firebase/firestore";
import { CVI, TENANT_ID } from "../constants";
import { REFS } from "./firebase";
import { Model, Prototype, Plugin, User, TagCategory } from "./models"

const getMany = async <T extends any>(q: Query<DocumentData>) => {
    const result: T[] = []
    ;(await getDocs(q)).forEach(doc => result.push(doc.data() as T))
    return result
}

const getSingle = async <T extends any>(ref: DocumentReference<DocumentData>) => {
    return (await getDoc(ref)).data() as T
}

export const getPrototypes = async (model_id: string) => {
    return await getMany<Prototype>(query(REFS.prototype, where("model_id", "==", model_id)))
}

export const getPlugins = async (model_id: string) => {
    return await getMany<Plugin>(query(REFS.plugin, where("model_id", "==", model_id)))
}

export const getLinkedPluginFromPrototype = async (model_id: string, prototype_id: string) => {
    const plugins = await getMany<Plugin>(query(
        REFS.plugin,
        where("model_id", "==", model_id),
        where("prototype_id", "==", prototype_id)
    ))

    return plugins[0] as Plugin | undefined
}

export const getUser = async (user_uid: string) => {
    return getSingle<User>(doc(REFS.user, user_uid))
}

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
    return getMany<TagCategory>(query(REFS.tags, where("tenant_id", "==", TENANT_ID)))
}

export const getModel = async (model_id: string) => {
    return getSingle<Model>(doc(REFS.model, model_id))
}

export const getModels = async () => {
    return await getMany<Model>(query(REFS.model, where("tenant_id", "==", TENANT_ID)))
}

export const getUsers = async (...queryConstraints: QueryConstraint[]) => {
    return await getMany<User>(query(REFS.user, where("tenant_id", "==", TENANT_ID), ...queryConstraints))
}

export const savePrototypeCode = async (prototype_id: string, code: string) => {
    await updateDoc(doc(REFS.prototype, prototype_id), {
        code
    })
}

export const saveModelName = async (model_id: string, name: string) => {
    await updateDoc(doc(REFS.model, model_id), {
        name
    })
}

export const saveWidgetConfig = async (prototype_id: string, widget_config: string) => {
    await updateDoc(doc(REFS.prototype, prototype_id), {
        widget_config
    })
}

export const getMedia = async () => {
    const result = await getDoc(doc(REFS.media, TENANT_ID))
    if (!result.exists()) {
        return []
    }
    
    const media = result.data().media as {[key: string]: {
        type: "image" | "model"
        imageUrl: string
        thumbnailUrl: string
        filename: string
    }}
    
    return Object.values(media).sort((a, b) => a.filename > b.filename ? 1 : -1)
}

export const newModel = async (name: string, user: FirebaseUser, root_node: string | null) => {
    const newModelRef = doc(REFS.model);
    await setDoc(
        newModelRef, 
        {
            id: newModelRef.id,
            custom_apis: {},
            created: {
                created_time: Timestamp.now(),
                user_uid: user.uid
            },
            cvi: root_node === null ? CVI : JSON.stringify({
                [root_node]: {
                    children: [],
                    description: "",
                    type: "branch",
                    uuid: "ccc825f94139544dbb5f4bfd033bece6",
                }
            }),
            main_api: root_node === null ? "Vehicle" : root_node,
            model_home_image_file: root_node !== null ? "" : "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fcar_full_ed.PNG?alt=media&token=ea75b8c1-a57a-44ea-9edb-9816131f9905",
            model_files: {
                [root_node === null ? "Vehicle" : root_node]: {
                    glb_file: "",
                    image_file: root_node !== null ? "" : "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fcar_full_ed.PNG?alt=media&token=ea75b8c1-a57a-44ea-9edb-9816131f9905"
                }
            },
            name,
            tenant_id: TENANT_ID
        }
    )
}