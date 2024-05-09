import { AnyNode } from "../../routes/components/core/Model/VehicleInterface/Spec";
import { timestamp } from "./general";
import { Timestamp } from "firebase/firestore";

export interface Tenant {
    id: string;
    name: string;
    logo_file: string;
}

export const USER_ROLES = ["tenant_admin", "model_contributor", "model_member"] as const;

export type USER_ROLE_TYPES = (typeof USER_ROLES)[number];

export interface User {
    // uuid connected to authentication
    uid: string;
    name: string;
    email: string;
    created_time: timestamp;
    image_file: string;

    roles: {
        [key: string]: string[];
    };
    // key will be roles, and the string array for which ids they belong to.
    // roles can be any of USER_ROLES
    // tenant_admin -> [tenant_id]
    // model_contributor -> [model_id]
    // model_member -> [model_id]
}

export interface ImagePin {
    x: number;
    y: number;
}

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

export interface Tag {
    name: string;
    tag_image_file: string;
    description: string;
}

export interface Feature {
    name: string;
    code: string;
    uids?: string[];
    tenant_id: string;
    created_time: timestamp;
}

export interface TagCategory {
    id: string;
    tenant_id: string;
    name: string;
    color: string;
    tags: {
        [name: string]: Tag;
    };
}

export interface ActivityLog {
    id: string;
    tenant_id: string;
    type: string;
    name: string;
    description?: string;
    ref_id?: string;
    ref_type?: string;
    parent_id?: string;
    image?: string;
    created_time: timestamp;
    created_by: string;
}

export interface Prototype {
    id: string;
    model_id: string;
    name: string;
    widget_config?: string;
    state?: string;
    skeleton?: string;
    created: {
        user_uid: string;
        created_time: timestamp;
    };
    description: {
        problem: string;
        says_who: string;
        solution: string;
        status: string;
    };
    image_file: string;
    rated_by: {
        // key is user uid
        [key: string]: {
            rating: number;
            rated_time: timestamp;
        };
    };
    code: string;
    autorun: boolean;
    // This will be dynamically inserted when creating project by the backend
    // (frontend would create security flaw) after analyzing the code.
    apis: {
        // key is VSS, VSC etc.
        [key: string]: string[];
    };
    portfolio?: {
        needs_addressed: number;
        relevance: number;
        effort_estimation: number;
    };
    complexity_level?: number;
    journey_image_file?: string;
    analysis_image_file?: string;
    flow?: {
        [key: string]: any;
    };
    related_ea_components?: string;
    customer_journey?: string;
    partner_logo?: string;
    tags?: {
        tagCategoryId: string;
        tagCategoryName: string;
        tag: string;
    }[];
}

export interface PrototypeGetSet {
    prototype: Prototype;
    updatePrototype: (prototype: Prototype) => void;
}

export interface Feedback {
    id: string;
    model_id: string;
    ref_id: string;
    ref_type: string;
    created: {
        interviewer_uid: string;
        user_uid: string;
        created_time: timestamp;
    };
    description: string;
    question: string;
    recommendation: string;
    avg_score: number;
    score: {
        [key: string]: number;
    };
}

export interface Discussion {
    id: string;
    ref_id: string;
    ref_type: string;
    parent_id?: string;
    content: string;
    title?: string;
    images: string[];
    tags: string[];
    mentions: string[];
    hashtags: string[];
    created: {
        user_fullname?: string;
        user_avatar?: string;
        user_uid: string;
        created_time: timestamp;
    };
}

export interface Plugin {
    id: string;
    model_id: string;
    name: string;
    created: {
        user_uid: string;
        created_time: timestamp;
    };
    description: string;
    image_file: string;
    js_code_url: string;
    prototype_id?: string;
}

export interface MediaFile {
    type: "image" | "model";
    imageUrl: string;
    thumbnailUrl: string;
    filename: string;
}

export interface Discussion {
    id: string;
    ref_id: string;
    ref_type: string;
    parent_id?: string;
    content: string;
    title?: string;
    images: string[];
    tags: string[];
    mentions: string[];
    hashtags: string[];
    created: {
        user_fullname?: string;
        user_avatar?: string;
        user_uid: string;
        created_time: timestamp;
    };
}

export interface Issue {
    id: string;
    filename: string;
    imageUrl: string;
    email?: string;
    priority?: string;
    status?: string;
    description: string;
    affectedCluster?: string;
    affectedPath?: string;
    affectedComponent?: string;
    os: string;
    browserName: string;
    browserVersion: string;
    canvas_size: string;
    orderNumber?: number;
    assignee?: string;
    timestamp: {
        created_time: Timestamp;
        lastUpdated_time: Timestamp;
        resolved_time?: Timestamp;
    };
}

export interface Survey {
    id: string;
    userThoughts?: string;
    feeling?: string;
    email?: string;
    lastSurveyTimestamp?: Timestamp; // timestamp when user last submitted survey (ex: will ask servay after a month)
    lastClosedTimestamp?: Timestamp; // timestamp when user manually closed the survey (ex: will ask servay after a week)
    orderNumber?: number;
}

// basically the media library filtered by tenant
export interface Media {
    tenant_id: string;
    media: {
        [key: string]: MediaFile;
    };
}

export interface AddOn {
    id: string;
    model_id?: string;
    createdBy?: string;
    createdAt?: Timestamp;
    type: "GenAI_Widget" | "GenAI_Python" | "GenAI_Dashboard";
    name: string;
    description: string;
    image_file?: string;
    apiKey: string;
    endpointUrl: string;
    version?: any;
    visibility?: "public" | "private";
    customPayload?: any;
    rating?: number;
    samples?: string;
    team?: any;
}

export interface API {
    description: string;
    name: string;
    parent: string;
    shortName: string;
    type: string;
    isWishlist: boolean;
    uuid: string;
}
