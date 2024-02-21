import { Model } from "../../../apis/models";
import { Branch, AnyNode } from "../core/Model/VehicleInterface/Spec";

const iterateOverCvi = (
    cvi: {
        [key: string]: AnyNode;
    },
    callback: (path: string, branch: AnyNode) => void,
    path: string = ""
) => {
    Object.keys(cvi).forEach((key) => {
        const node = cvi[key];
        const newPath = path === "" ? key : path + "." + key;
        callback(newPath, node);
        if (node.type === "branch") {
            iterateOverCvi(node.children, callback, newPath);
        }
    });
};

export const buildAllModelAPIs = (model: Model) => {
    const vss = JSON.parse(model.cvi) as {
        [key: string]: Branch;
    };
    const customAPIs = model.custom_apis ?? {};
    iterateOverCvi(vss, (path, node) => {
        if (node.type !== "branch") {
            return;
        }
        for (const [key, child] of Object.entries(customAPIs[path] ?? {})) {
            node.children[key] = child;
        }
    });

    return vss;
};
