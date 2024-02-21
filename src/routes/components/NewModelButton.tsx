import { useState } from "react";
import { HiPlus } from "react-icons/hi";
import { newModel, addLog } from "../../apis";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Button from "../../reusable/Button";
import Input from "../../reusable/Input/Input";
import InputContainer from "../../reusable/Input/InputContainer";
import SideNav from "../../reusable/SideNav/SideNav";
import permissions from "../../permissions";
import Select from "../../reusable/Select";
import CustomSelect from "../../reusable/ReportTools/CustomSelect";
import { TbExternalLink } from "react-icons/tb";
import VehicleCategory from "./VehicleCategory";
import { Property } from "./VehicleCategory/VehicleProperty";
import CustomVehicleProperties from "./VehicleCategory/CustomVehicleProperties";
import { isNumeric } from "../../utils/isNumeric";
import {
    checkInvalidCategory,
    checkInvalidCustomProperties,
    convertPropertyToJSON,
} from "../../utils/vehiclePropertyUtils";

interface NewModelButtonProps {
    onModelCreated: (id: string | null) => void;
}

const NewModelButton = ({ onModelCreated }: NewModelButtonProps) => {
    const newModelSidenavState = useState(false);
    const [loading, setLoading] = useState(false);
    const [displayError, setDisplayError] = useState<null | string>(null);

    const States = {
        Name: useState(""),
        StartFrom: useState<"vss_api" | "system_api" | "scratch">("vss_api"),
        Visibility: useState<"public" | "private">("private"),
        RootNode: useState(""),
        VehicleCategory: useState(""),
        CustomCategory: useState(""),
        CustomProperties: useState<Property[]>([]),
    };

    const options = [
        { value: "vss_api", label: "Start with the COVESA VSS API" },
        { value: "vss_api_v4.0", label: "Start with the COVESA VSS API v4.0" },
        { value: "vss_api_v4.1", label: "Start with the COVESA VSS API v4.1" },
        { value: "system_api", label: "Start with V2C ans S2S(COVESA) API" },
        { value: "scratch", label: "Start from scratch" },
    ];

    const visibility_options = [
        { value: "private", label: "Private" },
        { value: "public", label: "Public" },
    ];

    const { user, profile } = useCurrentUser();

    // if (!user || !permissions.TENANT(profile).canEdit()) {
    //   return null;
    // }

    if (!user) {
        return null;
    }

    return (
        <SideNav
            state={newModelSidenavState}
            trigger={
                <div
                    className={`flex rounded-lg border-4 border-dashed items-center justify-center text-gray-300 hover:border-gray-400 hover:text-gray-400 cursor-pointer transition min`}
                    style={{ minHeight: 180 }}
                >
                    <div className="text-center flex flex-col items-center justify-center">
                        <HiPlus className="text-5xl" />
                        <div className="text-gray-500">Create new model</div>
                    </div>
                </div>
            }
            width="600px"
            className="p-4 h-full overflow-y-auto scroll-gray"
        >
            <div className="flex flex-col w-full min-h-full">
                <div className="text-xl mb-4 font-bold text-aiot-blue">Create New Model</div>

                <InputContainer label="Name" input={<Input placeholder="Enter model name" state={States.Name} />} />

                <div className="flex justify-center">
                    <div className="flex mt-2 text-sm text-gray-600 shirnk-0 w-20">VSS API</div>
                    <InputContainer
                        label=""
                        input={
                            <CustomSelect
                                options={options}
                                selectedValue={States.StartFrom[0]}
                                onValueChange={(value) =>
                                    States.StartFrom[1](value as "vss_api" | "system_api" | "scratch")
                                }
                                customStyle="px-1 py-1 rounded border border-gray-200  bg-white text-gray-500 shadow-none hover:border-gray-300 text-sm"
                                customDropdownContainerStyle="w-max"
                                customDropdownItemStyle="px-5 text-sm"
                            />
                        }
                    />
                </div>

                <div className="flex justify-center">
                    <div className="flex mt-2 text-sm w-20 text-gray-600">Visibility</div>
                    <InputContainer
                        label=""
                        input={
                            <CustomSelect
                                options={visibility_options}
                                selectedValue={States.Visibility[0]}
                                onValueChange={(value) => States.Visibility[1](value as "private" | "public")}
                                customStyle="px-1 py-1 rounded border border-gray-200 bg-white text-gray-500 shadow-none hover:border-gray-300 text-sm"
                                customDropdownContainerStyle="w-max"
                                customDropdownItemStyle="px-5 text-sm"
                            />
                        }
                    />
                </div>

                {States.StartFrom[0] === "scratch" && (
                    <InputContainer label="Root Node" input={<Input state={States.RootNode} />} />
                )}

                <div className="border-t border-t-gray-200 -mx-4 mb-4" />

                {/* Category */}
                <VehicleCategory
                    customProperties={States.CustomProperties[0]}
                    setCustomProperties={States.CustomProperties[1]}
                    setVehicleCategory={States.VehicleCategory[1]}
                />

                {displayError !== null && <div className="text-red-500 text-sm mt-6 mb-3 pl-1">{displayError}</div>}

                <Button
                    disabled={loading}
                    className="ml-auto mt-auto flex bg-aiot-blue text-white py-1.5 px-5 rounded items-center justify-center hover:opacity-90"
                    variant="custom"
                    onClick={async () => {
                        if (!States.Name[0]) {
                            setDisplayError("Error: please enter a name!");
                            return;
                        }

                        let err = checkInvalidCategory(States.VehicleCategory[0]);
                        if (err) {
                            return setDisplayError(err);
                        }
                        err = checkInvalidCustomProperties(States.CustomProperties[0]);
                        if (err) {
                            return setDisplayError(err);
                        }

                        setDisplayError("");
                        setLoading(true);
                        let newModelId = await newModel(
                            States.Name[0],
                            States.Visibility[0],
                            user,
                            States.StartFrom[0] === "vss_api" ? null : States.RootNode[0],
                            States.StartFrom[0],
                            States.VehicleCategory[0],
                            convertPropertyToJSON(States.CustomProperties[0])
                        );
                        newModelSidenavState[1](false);
                        setLoading(false);
                        // Await this promise before onModelCreated, because when onModelCreated is called, the page refreshes and the log will not be added
                        await addLog(
                            `New model '${States.Name[0]}' with visibility: ${States.Visibility[0]}`,
                            `New model '${States.Name[0]}' was created by ${
                                user.email || user.displayName || user.uid
                            }with vehicle class: ${States.VehicleCategory[0]}`,
                            "new-model",
                            user.uid,
                            null,
                            null,
                            null,
                            null
                        );
                        onModelCreated(newModelId);
                    }}
                >
                    Save
                </Button>
            </div>
        </SideNav>
    );
};

export default NewModelButton;
