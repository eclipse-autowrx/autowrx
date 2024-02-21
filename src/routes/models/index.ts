export interface UserModel {
    id: string;
    name: string;
    thumbnail: string;
}

export interface ProjectModel {
    id: string;
    title: string;
    thumbnail: string;
    user: UserModel;
    description: string;
    problem?: string;
    says_who?: string;
    solution?: string;
    status?: string;
    apis: {
        [api_type: string]: string[];
    };
    rating: number;
    rating_count: number;
    code: string;
}

export interface CameraCoordinates {
    camera: {
        x: number;
        y: number;
        z: number;
    };
    controls: {
        x: number;
        y: number;
        z: number;
    };
}
