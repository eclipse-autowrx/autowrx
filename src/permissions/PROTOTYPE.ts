import { Model, Prototype, User } from "../apis/models";
import { MODEL } from "./MODEL";

export const PROTOTYPE = (profile: User | null, model: Model, prototype: Prototype) => {
    return {
        canRead() {
            return MODEL(profile, model).canRead();
        },
        canEdit() {
            return MODEL(profile, model).canEdit();
        },
    };
};
