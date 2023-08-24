import { Model, User } from "../apis/models";
import { TENANT_ID } from "../constants";
import { hasRole } from "./general";

export const MODEL = (profile: User | null, model: Model) => {
    return {
        canRead () {
            if ((model.visibility ?? "public") === "public") {
                return true
            } else if (profile === null) {
                console.log("profile",profile, null)
                return false
            } else {
                return (
                    hasRole(profile, "model_member", model.id) ||
                    hasRole(profile, "model_contributor", model.id) ||
                    hasRole(profile, "tenant_admin", TENANT_ID)
                )
            }
        },
        canEdit () {
            if (profile === null) {
                return false
            } else {
                // Tenant Admins need to add themselves as model contributer before they're allowed to edit.
                return hasRole(profile, "model_contributor", model.id)
            }
        }
    }
}