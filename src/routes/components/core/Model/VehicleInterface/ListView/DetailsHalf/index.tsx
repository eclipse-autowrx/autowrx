import { FC, useState, useEffect } from "react";
import NodeViewer from "../../../../../CVIViewer/NodeViewer";
import COVESALogo from "../../../../../../../assets/Logos/COVESA.png";
import { AnyNode } from "../../Spec";
import { deleteApi } from "../../utils/api";
import { Model } from "../../../../../../../apis/models";
import APISkeleton from "./APISkeleton";

interface ModelViewProps {
    node_name: string;
    activeNode: AnyNode | null;
    model: Model;
    isActiveNodeCustom: boolean;
}

const DetailsHalf: FC<ModelViewProps> = ({ node_name, activeNode, model, isActiveNodeCustom }) => {
    // const editingCustomNode = useState<null | [string, Node]>(null)
    // const customApiSidenav = useState(false)

    return (
        <div className={`flex flex-col w-full h-full overflow-x-hidden scroll-gray`}>
            <APISkeleton node_name={node_name || model.main_api || "Vehicle"} model={model} />
            <div className="flex w-full h-auto">
                {activeNode ? (
                    <NodeViewer
                        name={node_name}
                        node={activeNode}
                        isCustom={isActiveNodeCustom}
                        // editCustomNode={(name, node) => {
                        //     editingCustomNode[1]([name, node])
                        //     customApiSidenav[1](true)
                        // }}
                        deleteCustomNode={(name) => deleteApi(model.id, name)}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-screen select-none pointer-events-none !visible">
                        <img alt="COVESA Logo" src={COVESALogo} className="h-20  opacity-60" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailsHalf;
