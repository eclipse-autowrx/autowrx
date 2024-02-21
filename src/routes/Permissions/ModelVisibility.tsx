import { TbLock, TbWorld } from "react-icons/tb";
import { Model, User } from "../../apis/models";
import React, { FC, useState } from "react";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import { addNewRole, changeVisibility, removeRole } from "./changePermissions";
import GeneralTooltip from "../../reusable/ReportTools/GeneralTooltip";

const ToggleSwitch: React.FC<{
    model: any;
    changeVisibilityLocal: (visibility: "public" | "private") => Promise<void>;
    visibility: "public" | "private";
}> = ({ model, changeVisibilityLocal, visibility }) => {
    const handleToggle = async () => {
        if (
            !confirm(
                `Confirm change model '${model.name}' visibility to ${visibility === "private" ? "public" : "private"}?`
            )
        )
            return;
        await changeVisibilityLocal(visibility === "private" ? "public" : "private");
        window.location.reload();
    };

    return (
        <div className="flex w-full h-fit items-center pt-2">
            <div
                className="w-[14rem] h-[2rem] rounded bg-gray-100/80 border-gray-200 inline-flex items-center cursor-pointer text-sm justify-between text-gray-500"
                onClick={handleToggle}
            >
                <GeneralTooltip
                    content={
                        visibility === "private"
                            ? "Your model's visibility is Private"
                            : "Change model's visibility to Private"
                    }
                    delay={300}
                    className="w-full h-full flex"
                >
                    <div
                        className={`w-[7rem] h-full flex items-center justify-center rounded ${
                            visibility === "private" ? "bg-aiot-blue/10 text-aiot-blue" : ""
                        }`}
                    >
                        <TbLock className="w-4 h-4" style={{ strokeWidth: 1.6 }} />
                        <span className="ml-1">Private</span>
                    </div>
                </GeneralTooltip>
                <GeneralTooltip
                    content={
                        visibility === "public"
                            ? "Your model's visibility is Public"
                            : "Change model's visibility to Public"
                    }
                    delay={300}
                    className="w-full h-full flex"
                >
                    <div
                        className={`w-[7rem] h-full flex items-center justify-center rounded ${
                            visibility === "public" ? "bg-aiot-blue/10 text-aiot-blue" : ""
                        }`}
                    >
                        <TbWorld className="w-4 h-4" style={{ strokeWidth: 1.6 }} />
                        <span className="ml-1">Public</span>
                    </div>
                </GeneralTooltip>
            </div>
        </div>
    );
};

const ModelVisibility = () => {
    const model = useCurrentModel() as Model; // Assuming you have a hook to get the current model

    const changeVisibilityLocal = async (visibility: "public" | "private") => {
        await changeVisibility(model, visibility); // You might need to import or define this function.
    };

    const visibility: "public" | "private" = model.visibility ?? "public";

    return <ToggleSwitch model={model} changeVisibilityLocal={changeVisibilityLocal} visibility={visibility} />;
};

export default ModelVisibility;
