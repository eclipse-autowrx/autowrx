import {
    deleteField,
    doc,
    DocumentData,
    FieldPath,
    getDocs,
    query,
    Query,
    runTransaction,
    updateDoc,
    where,
} from "firebase/firestore";
import { getModel } from "../../../../../../apis";
import { db, REFS } from "../../../../../../apis/firebase";
import { DataType, LeafTypes } from "../Spec";

export const divideNodeName = (node_name: string) => {
    const parts = node_name.split(".");
    const [nesting, name] = [parts.slice(0, -1).join("."), parts.slice(-1)[0]];

    return [nesting, name] as const;
};

type createApiFuncType = (props: {
    model_id: string;
    name: string;
    description: string;
    type: LeafTypes;
    datatype?: DataType;
    prototype_id: string;
}) => Promise<void>;

export const createApi: createApiFuncType = async (props) => {
    const updateFields: any = {
        type: props.type,
        description: props.description,
        uuid: "",
        children: {},
        prototype_id: props.prototype_id,
    };
    if (typeof props.datatype !== "undefined") {
        updateFields.datatype = props.datatype;
    }

    if (props.name.includes(" ")) {
        throw new Error(`API name can't contain a space.`);
    }

    if (props.name.includes("..") || props.name.slice(0, 1) === "." || props.name.slice(-1) === ".") {
        throw new Error(`${props.name} is not a valid API name`);
    }

    const [nesting, name] = divideNodeName(props.name);

    await updateDoc(doc(REFS.model, props.model_id), new FieldPath("custom_apis", nesting, name), updateFields);

    window.location.reload();
};

export const deleteApi = async (model_id: string, node_name: string) => {
    const model = await getModel(model_id);
    const custom_apis = model.custom_apis ?? {};

    const [nesting, name] = divideNodeName(node_name);

    const mainKeysToDelete = Object.keys(custom_apis).filter(
        (key) => key === node_name || key.startsWith(`${node_name}.`)
    );

    await runTransaction(db, async (tx) => {
        tx.update(doc(REFS.model, model_id), new FieldPath("custom_apis", nesting, name), deleteField());

        for (const key of mainKeysToDelete) {
            tx.update(doc(REFS.model, model_id), new FieldPath("custom_apis", key), deleteField());
        }
    });

    window.location.reload();
};
