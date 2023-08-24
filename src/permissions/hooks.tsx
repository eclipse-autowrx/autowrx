import permissions from "."
import { Model, Prototype } from "../apis/models"
import useCurrentPrototype from "../hooks/useCurrentPrototype"
import { useCurrentModel } from "../reusable/hooks/useCurrentModel"
import useCurrentUser from "../reusable/hooks/useCurrentUser"

export const useCurrentTenantPermissions = () => {
    const {profile} = useCurrentUser()

    return permissions.TENANT(profile)
}

export const useCurrentModelPermissions = () => {
    const {profile} = useCurrentUser()
    const model = useCurrentModel() as Model

    return permissions.MODEL(profile, model)
}

export const useCurrentProtototypePermissions = () => {
    const {profile} = useCurrentUser()
    const model = useCurrentModel() as Model
    const prototype = useCurrentPrototype() as Prototype
    
    if (typeof prototype === "undefined") {
        throw new Error("useCurrentProtototypePermissions needs to be called from within prototype")
    }

    return permissions.PROTOTYPE(profile, model, prototype)
}