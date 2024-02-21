import { Branch } from "../Spec";

export interface TreeNode {
    name: string;
    type: "branch";
    path: string;
    children: TreeNode[];
}

const buildTreeNode = (name: string, path: string, node: Branch): TreeNode => {
    return {
        name,
        type: node.type,
        path,
        children: Object.entries(node.children)
            .filter(([sub_node_name, node]) => node.type === "branch")
            .map(([sub_node_name, node]) =>
                buildTreeNode(sub_node_name, path === "" ? name : `${path}.${name}`, node as Branch)
            ),
    };
};

export default buildTreeNode;
