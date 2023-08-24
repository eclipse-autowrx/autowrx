import { Model } from "../../../apis/models"
import { Branch, AnyNode } from "../core/Model/VehicleInterface/Spec"

export const flattenApis = (cvi: {
    [key: string]: AnyNode
}, filter?: (node: AnyNode) => boolean) => {
    const list: string[] = []
    for (const [name, node] of Object.entries(cvi)) {
        if (typeof filter !== "undefined" && !filter(node)) {
            continue
        }
        list.push(name)
        if (node.type === "branch") {
            list.push(...flattenApis(node.children, filter).map(subname => (
                `${name}.${subname}`
            )))
        }
    }
    return list
}

export const getFlattenedApis = (model: Model, filter?: (node: AnyNode) => boolean) => {
    const builtInApis = flattenApis(JSON.parse(model.cvi) as {
        [key: string]: Branch
    }, filter)
    const customApis = Object.entries(model.custom_apis ?? {}).map(([nesting, children]) => {
        return Object.entries(children)
        .filter(typeof filter === "undefined" ? () => true : ([subapi, node]) => filter(node))
        .map(([subapi, node]) => `${nesting}.${subapi}`)
    }).flat()

    return customApis.concat(builtInApis)
}

export default getFlattenedApis