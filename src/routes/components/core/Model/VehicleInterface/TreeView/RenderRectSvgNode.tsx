import { CustomNodeElementProps } from "react-d3-tree/lib/types/types/common";
import { TreeNode } from "./buildTreeView";
import { LeafTypes } from "../Spec";
import { NavigateFunction } from "react-router-dom";
import { Model } from "../../../../../../apis/models";

const RenderRectSvgNode = (
    { hierarchyPointNode, nodeDatum, toggleNode }: CustomNodeElementProps,
    navigate: NavigateFunction,
    prototype_id: string,
    model: Model
): JSX.Element => {
    const node = nodeDatum as unknown as TreeNode;
    const collapsed = nodeDatum.__rd3t.collapsed;

    const COLORS: {
        [key in LeafTypes | "aiot-blue" | "aiot-green"]: string;
    } = {
        sensor: "#10b981",
        branch: "#7c3aed",
        actuator: "#eab308",
        attribute: "#3b82f6",
        "aiot-blue": "#005072",
        "aiot-green": "#aebd38",
    };

    const nodeWidth = 8 * node.name.length + 45;

    return (
        <g>
            <g
                onClick={() => {
                    const cviLink = `/cvi/list/${(node as TreeNode).path}.${node.name}`;
                    const fullLink =
                        prototype_id === ""
                            ? `/model/${model.id}${cviLink}/`
                            : `/model/${model.id}/library/prototype/${prototype_id}/view${cviLink}/`;

                    if (["sensor", "actuator", "attribute"].includes(node.type)) {
                        navigate(fullLink);
                    }
                    toggleNode();
                }}
            >
                {
                    <>
                        <rect
                            width={nodeWidth}
                            height={40}
                            y={-20}
                            x={-50}
                            rx={10}
                            strokeWidth="0"
                            style={{ fill: collapsed ? "white" : COLORS[node.type] }}
                        />
                        <foreignObject width={nodeWidth} height={40} y={-20} x={-50}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    width: "100%",
                                    color: collapsed ? "rgb(131 148 154)" : "white",
                                }}
                            >
                                {node.name}
                            </div>
                        </foreignObject>
                    </>
                }
            </g>
            {node.type === "branch" && !collapsed && (
                <circle
                    cx={-50}
                    cy={20}
                    fill={COLORS["aiot-green"]}
                    r={12}
                    strokeWidth={3}
                    stroke={"white"}
                    onClick={() => {
                        const cviLink =
                            node.path === "" ? `/cvi/list/${node.name}` : `/cvi/list/${node.path}.${node.name}`;
                        const fullLink =
                            prototype_id === ""
                                ? `/model/${model.id}${cviLink}/`
                                : `/model/${model.id}/library/prototype/${prototype_id}/view${cviLink}/`;

                        navigate(fullLink);
                    }}
                />
            )}
        </g>
    );
};

export default RenderRectSvgNode;
