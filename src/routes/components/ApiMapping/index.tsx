import { useState, useEffect } from "react";
import { Model } from "../../../apis/models";
import ListHalfMemoized from "../core/Model/VehicleInterface/ListView/ListHalf";
import DetailsHalf from "../core/Model/VehicleInterface/ListView/DetailsHalf";
import { AnyNode } from "../core/Model/VehicleInterface/Spec";
import APIDashboard from "./APIDashboard";

interface APIMappingProps {
    model: Model;
    node_name: string;
    activeNode: AnyNode | null;
    isActiveNodeCustom: boolean;
    onlyShow?: string[];
}

const APIMapping = ({ node_name, activeNode, onlyShow, model, isActiveNodeCustom }: APIMappingProps) => {
    return (
        <div className="flex w-full h-full">
            {/* Half left */}
            <div className="flex flex-col w-1/2 h-full">
                <div className="flex w-full h-1/2">
                    <ListHalfMemoized node_name={node_name} model={model} onlyShow={onlyShow} />
                </div>
                <div className="flex flex-col w-full h-1/2 px-6">
                    <DetailsHalf
                        node_name={node_name}
                        activeNode={activeNode}
                        model={model}
                        isActiveNodeCustom={isActiveNodeCustom}
                    />
                </div>
            </div>
            {/* Half right */}
            <div className="flex w-1/2 h-full">
                <APIDashboard model={model} />
            </div>
        </div>
    );
};

export default APIMapping;
