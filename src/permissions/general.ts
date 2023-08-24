import { User, USER_ROLE_TYPES } from "../apis/models";

export const hasRole = (profile: User, role: USER_ROLE_TYPES, object_id: string) => {
    return (profile.roles[role] as undefined | string[])?.includes(object_id) ?? false
}