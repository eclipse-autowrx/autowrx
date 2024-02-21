import { FC, useEffect, useState } from "react";
import { Model, Prototype } from "../../../apis/models";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import Button from "../../../reusable/Button";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import Input from "../../../reusable/Input/Input";
import Select from "../../../reusable/Select";
import TriggerPopup from "../../../reusable/triggerPopup/triggerPopup";
import { createApi, divideNodeName } from "./customApiFuncs";
import getFlattenedApis from "./getFlattenedApis";
import { DataType, LeafTypes, AnyNode } from "../core/Model/VehicleInterface/Spec";

const dataTypes = [
    "uint8",
    "uint16",
    "uint32",
    "int8",
    "int16",
    "int32",
    "float",
    "double",
    "string",
    "boolean",
    "string[]",
    "uint8[]",
];

interface CreateApiFormProps {
    editingNode: [string, AnyNode] | null;
}

const CreateApiForm: FC<CreateApiFormProps> = ({ editingNode }) => {
    const States = {
        Name: useState(""),
        Description: useState(""),
        Type: useState(""),
        DataType: useState(""),
    };

    const prototype = useCurrentPrototype();

    // if (typeof prototype === "undefined") {
    //     throw new Error("Component <CreateApiForm /> can only be inside mounted inside a prototype")
    // }

    const model = useCurrentModel() as Model;
    const branchApis = getFlattenedApis(model, (node) => node.type === "branch");
    const allApis = getFlattenedApis(model);

    useEffect(() => {
        if (editingNode === null) {
            States.Name[1]("");
            States.Description[1]("");
            States.Type[1]("branch");
            States.DataType[1](dataTypes[0]);
        } else {
            const [full_name, node] = editingNode;

            States.Name[1](full_name);
            States.Description[1](node.description);
            States.Type[1](node.type);
            States.DataType[1](node.type === "branch" ? "" : node.datatype);
        }
    }, [editingNode?.[0]]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex text-lg font-bold mb-4 select-none">{editingNode ? "Save" : "New"} Wishlist API</div>
            <div className="flex flex-col mb-3">
                <div className="mb-2 text-sm text-gray-400 select-none">Name</div>
                <Input state={States.Name} disabled={!!editingNode} />
            </div>
            <div className="flex flex-col mb-3">
                <div className="mb-2 text-sm text-gray-400 select-none">Description</div>
                <Input form="textarea" state={States.Description} />
            </div>
            <div className="flex flex-col mb-3">
                <div className="mb-2 text-sm text-gray-400 select-none">Type</div>
                <Select
                    options={[
                        {
                            name: "Branch",
                            value: "branch",
                        },
                        {
                            name: "Sensor",
                            value: "sensor",
                        },
                        {
                            name: "Actuator",
                            value: "actuator",
                        },
                        {
                            name: "Attribute",
                            value: "attribute",
                        },
                    ]}
                    state={States.Type}
                />
            </div>
            {States.Type[0] !== "branch" && (
                <div className="flex flex-col mb-3">
                    <div className="mb-2 text-sm text-gray-400 select-none">DataType</div>
                    <Select
                        options={dataTypes.map((dataType) => ({
                            name: dataType,
                            value: dataType,
                        }))}
                        state={States.DataType}
                    />
                </div>
            )}
            <div className="flex mt-auto">
                <Button
                    className="py-1 ml-auto"
                    variant="success"
                    onClick={async () => {
                        if (editingNode === null) {
                            const full_name = States.Name[0];
                            if (allApis.includes(full_name)) {
                                TriggerPopup(
                                    <span className="text-xl">
                                        <strong>{full_name}</strong> already exists.
                                    </span>,
                                    "!w-fit !min-w-fit"
                                );
                                return;
                            }
                            const [nesting, name] = divideNodeName(full_name);
                            if (!branchApis.includes(nesting)) {
                                TriggerPopup(
                                    <span className="text-xl">
                                        <strong>{nesting}</strong> is not a valid branch.
                                    </span>,
                                    "!w-fit !min-w-fit"
                                );
                                return;
                            }
                        }

                        try {
                            await createApi({
                                model_id: model.id,
                                name: States.Name[0],
                                description: States.Description[0],
                                type: States.Type[0] as LeafTypes,
                                datatype: States.Type[0] === "branch" ? undefined : (States.DataType[0] as DataType),
                                prototype_id: prototype?.id ?? "",
                            });
                        } catch (error) {
                            TriggerPopup(
                                <span className="text-xl">{(error as Error).toString()}</span>,
                                "!w-fit !min-w-fit"
                            );
                            return;
                        }
                    }}
                >
                    {editingNode ? "Save" : "Create"}
                </Button>
            </div>
        </div>
    );
};

export default CreateApiForm;
