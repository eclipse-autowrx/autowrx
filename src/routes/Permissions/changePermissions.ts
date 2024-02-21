import { doc, FieldPath } from "@firebase/firestore";
import { arrayRemove, arrayUnion, updateDoc } from "firebase/firestore";
import { REFS } from "../../apis/firebase";
import { Model } from "../../apis/models";

export const addNewRole = async (model: Model, user_id: string, role: "model_member" | "model_contributor") => {
    await updateDoc(doc(REFS.user, user_id), new FieldPath("roles", role), arrayUnion(model.id));
};

export const removeRole = async (model: Model, user_id: string, role: "model_member" | "model_contributor") => {
    await updateDoc(doc(REFS.user, user_id), new FieldPath("roles", role), arrayRemove(model.id));
};

export const changeVisibility = async (model: Model, visibility: "public" | "private") => {
    await updateDoc(doc(REFS.model, model.id), {
        visibility,
    });
};
