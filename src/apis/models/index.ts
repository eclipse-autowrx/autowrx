import { AnyNode } from "../../routes/components/core/Model/VehicleInterface/Spec"
import { timestamp } from "./general"

export interface Tenant {
    id: string
    name: string
    logo_file: string
}

export const USER_ROLES = ["tenant_admin", "model_contributor", "model_member"] as const

export type USER_ROLE_TYPES = typeof USER_ROLES[number]

export interface User {
    // uuid connected to authentication
    uid: string
    name: string
    email: string
    created_time: timestamp
    image_file: string
    
    roles: {
        [key: string]: string[]
    }
    // key will be roles, and the string array for which ids they belong to.
    // roles can be any of USER_ROLES
    // tenant_admin -> [tenant_id]
    // model_contributor -> [model_id]
    // model_member -> [model_id]
}

export interface ImagePin {
    x: number
    y: number
}

export interface ModelView<PinType extends ImagePin> {
    image_file: string
    glb_file: string
    pins?: {
        [api: string]: PinType
    }
}

export interface Model {
    id: string
    tenant_id: string
    created: {
        user_uid: string
        created_time: timestamp
    }
    name: string
    model_files: {
        // key is api name, e.g: "Vehicle.Acceleration"
        [key: string]: ModelView<ImagePin>
    }
    main_api: string
    cvi: string
    custom_apis?: {
        [nesting: string]: {
            [name: string]: AnyNode
        }
    }
    model_home_image_file: string
    visibility?: "public" | "private"
}

export interface Tag {
    name: string
    tag_image_file: string
    description: string
}

export interface TagCategory {
    id: string
    tenant_id: string
    name: string
    color: string
    tags: {
        [name: string]: Tag
    }
}

export interface Prototype {
    id: string
    model_id: string
    name: string
    widget_config?: string
    created: {
        user_uid: string
        created_time: timestamp
    }
    description: {
        problem: string
        says_who: string
        solution: string
        status: string
    }
    image_file: string
    rated_by: {
        // key is user uid
        [key: string]: {
            rating: number
            rated_time: timestamp
        }
    }
    code: string
    // This will be dynamically inserted when creating project by the backend
    // (frontend would create security flaw) after analyzing the code.
    apis: {
        // key is VSS, VSC etc.
        [key: string]: string[]
    }
    portfolio?: {
        needs_addressed: number
        relevance: number
        effort_estimation: number
    }
    journey_image_file?: string
    analysis_image_file?: string
    related_ea_components?: string
    customer_journey?: string
    partner_logo?: string
    tags?: {
        tagCategoryId: string
        tagCategoryName: string
        tag: string
    }[]
}

export interface Plugin {
    id: string
    model_id: string
    name: string
    created: {
        user_uid: string
        created_time: timestamp
    }
    description: string
    image_file: string
    js_code_url: string
    prototype_id?: string
}

export interface MediaFile {
    type: "image" | "model"
    imageUrl: string
    thumbnailUrl: string
    filename: string
}

// basically the media library filtered by tenant
export interface Media {
    tenant_id: string
    media: {
        [key: string]: MediaFile
    }
}

