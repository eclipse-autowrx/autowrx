import { Model } from "../../../../../../apis/models"
import { Branch, AnyNode } from "../Spec"

const getNodeFromFullName = (model: Model, fullName: string): {
    node: AnyNode | null
    isCustom: boolean
} => {
    const cvi = JSON.parse(model.cvi) as {
        [key: string]: Branch
    }

    const parts = fullName.split(".")
    if (parts[0] !== model.main_api) {
        return {
            node: null,
            isCustom: false
        }
    }

    const prefix = parts.slice(0, -1).join(".")
    const name = parts[parts.length-1]
    
    const node = model?.custom_apis?.[prefix]?.[name]

    if (typeof node !== "undefined") {
        return {
            node,
            isCustom: true
        }
    }

    let final: AnyNode = cvi[model.main_api]
    for (const part of parts.slice(1)) {
        if (final.type !== "branch") {
            return {
                node: null,
                isCustom: false
            }
        }
        if (!(part in final.children)) {
            return {
                node: null,
                isCustom: false
            }
        }
        final = final.children[part]
    }

    return {
        node: final ?? null,
        isCustom: false
    }
}


export default getNodeFromFullName