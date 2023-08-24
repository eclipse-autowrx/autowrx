import { AnyNode, Branch } from "../Spec"
import Tree from 'react-d3-tree';
import buildTreeNode from "./buildTreeView";
import styles from "./TreeView.module.scss"
import RenderRectSvgNode from "./RenderRectSvgNode";
import { PathFunction } from "react-d3-tree/lib/types/types/common";
import { useNavigate } from "react-router-dom";
import { Model } from "../../../../../../apis/models";
import useCurrentPrototype from "../../../../../../hooks/useCurrentPrototype";

const getDynamicPathClass: PathFunction = ({ source, target }, orientation) => {

    const targetData: any = target.data;

    if (!target.data.__rd3t.collapsed) {
        switch (targetData.type) {
            case "branch":
                return `${styles.Node} ${styles.branch}`;

            case "sensor":
                return `${styles.Node} ${styles.sensor}`;

            case "actuator":
                return `${styles.Node} ${styles.actuator}`;

            case "attribute":
                return `${styles.Node} ${styles.attribute}`;

            case "aggregator":
                switch (targetData.aggregatorType) {
                    case "branch":
                        return `${styles.Node} ${styles.branch}`;

                    case "sensor":
                        return `${styles.Node} ${styles.sensor}`;

                    case "actuator":
                        return `${styles.Node} ${styles.actuator}`;

                    case "attribute":
                        return `${styles.Node} ${styles.attribute}`;

                    default:
                        return `${styles.Node} ${styles.selected}`;
                }

            default:
                return `${styles.Node} ${styles.selected}`;
        }
    }

    return styles.Node;
}


interface TreeViewProps {
    model: Model
    node_name: string
    activeNode: AnyNode | null
    onlyShow?: string[]
}

const TreeView = ({ node_name, activeNode, model }: TreeViewProps) => {
    const navigate = useNavigate()
    const prototype = useCurrentPrototype()

    const cvi = JSON.parse(model.cvi) as {
        [key: string]: Branch
    }

    const orgChart = buildTreeNode(model.main_api, "", cvi[model.main_api])

    return (
        <div className="h-full w-full">
            <Tree
                data={orgChart}
                renderCustomNodeElement={(...args) => RenderRectSvgNode(...args, navigate, prototype?.id ?? "", model)}
                nodeSize={{ x: 500, y: 70 }}
                collapsible={true}
                initialDepth={1}
                translate={{ x: 500, y: 500 }}
                pathClassFunc={getDynamicPathClass}
            />
        </div>
    );
}

export default TreeView
