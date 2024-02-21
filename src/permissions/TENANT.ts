import { User } from "../apis/models";
import { TENANT_ID } from "../constants";
import { hasRole } from "./general";

export const TENANT = (profile: User | null) => {
    return {
        canRead() {
            return true;
        },
        canEdit() {
            if (profile === null) {
                return false;
            } else {
                return hasRole(profile, "tenant_admin", TENANT_ID);
            }
        },
    };
};
