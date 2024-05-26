type Tag = {
    tag: string
    tagCategoryId?: string
    tagCategoryName?: string
}

export type ModelLite = {
    name: string
    visibility: string
    model_home_image_file: string
    id: string
    created_at: Date
    created_by: string
    tags?: Tag[]
}

export type Model = {
    id: string
    cvi: string
    custom_apis?: Record<string, unknown>
    main_api: string
    model_home_image_file?: string
    model_files?: Record<string, unknown>
    name: string
    visibility: 'public' | 'private'
    tenant_id: string
    vehicle_category: string
    property?: string
    created_by: string
    created_at?: Date,
    skeleton?: string
    tags?: Tag[]
}
