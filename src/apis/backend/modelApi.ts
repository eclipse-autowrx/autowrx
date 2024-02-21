import { doc, updateDoc } from "firebase/firestore";
import { REFS } from "../firebase";
import { ImagePin, timestamp } from "./common";
import { AnyNode } from "../../routes/components/core/Model/VehicleInterface/Spec";

export interface ModelView<PinType extends ImagePin> {
    image_file: string;
    glb_file: string;
    pins?: {
        [api: string]: PinType;
    };
}

export interface Model {
    id: string;
    tenant_id: string;
    created: {
        user_uid: string;
        created_time: timestamp;
    };
    name: string;
    model_files: {
        // key is api name, e.g: "Vehicle.Acceleration"
        [key: string]: ModelView<ImagePin>;
    };
    main_api: string;
    cvi: string;
    skeleton: string;
    custom_apis?: {
        [nesting: string]: {
            [name: string]: AnyNode;
        };
    };
    model_home_image_file: string;
    visibility?: "public" | "private";
    tags?: {
        tagCategoryId: string;
        tagCategoryName: string;
        tag: string;
    }[];
    vehicle_category?: string;
    property?: string;
}

export const updateModelService = async (model_id: string, data: Partial<Model>) =>
    updateDoc(doc(REFS.model, model_id), data);
