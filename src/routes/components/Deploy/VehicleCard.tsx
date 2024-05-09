import { VehicleData } from "./VehicleSelection"; // Assuming you have a VehicleData type
import { useState, useEffect } from "react";
import KitConnect from "../../../services/KitConnect";
import { useGetUserFeatures } from "../../../reusable/hooks/useGetUserFeatures";
import { TbCode, TbUserExclamation } from "react-icons/tb";

interface VehicleCardProps {
    vehicle: VehicleData;
    index: number;
    selected: boolean;
    handleVehicleClick: (index: any) => void;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    allKit?: any;
    code: string;
    usedAPIs: string[];
    onActiveKitChange: (kit: any) => void;
}

const VehicleCard = ({
    vehicle,
    index,
    selected,
    handleVehicleClick,
    children,
    icon,
    allKit,
    code,
    usedAPIs,
    onActiveKitChange,
}: VehicleCardProps) => {
    // Styling the vehicle.type that the word after the last capital letter have gradient color
    const splitName = vehicle.type === "dreamKIT" ? ["dream", "KIT"] : vehicle.type.split(/(?=[A-Z])/);
    const nameWithoutLastWord = splitName.slice(0, -1).join("");
    const lastWord = splitName[splitName.length - 1];
    const gradientClass =
        vehicle.type === "dreamKIT" ? "text-aiot-gradient-80 font-bold" : "text-aiot-gradient-280 font-bold";

    const [correctTypeKits, setCorrectTypeKits] = useState<any[]>([]);

    const { hasAccessToFeature } = useGetUserFeatures();
    const hasPermissionDeployToDreamKit = hasAccessToFeature("DEPLOY_TO_DREAMKIT");
    const hasPermissionDeployToVM = hasAccessToFeature("DEPLOY_TO_VM"); // The rule is VM but the name is Cloud
    const hasPermissionDeployToPilot = hasAccessToFeature("DEPLOY_TO_PILOT");

    // This useEffect will filter the correct type of kits based on the vehicle type
    useEffect(() => {
        // console.log("allKit", allKit);
        if (!allKit) {
            setCorrectTypeKits([]);
            return;
        }
        // console.log("allKit", allKit);
        let dks = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("dreamkit-"));
        let vms = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("vm-")); // Now renamed to Cloud
        let pilots = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("pilotcar-"));
        let autoverses = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("autoverse"));
        // Extract the correct type of kits
        const typeToKitsMap = {
            dreamKIT: dks,
            Cloud: vms,
            TestFleet: pilots,
            Autoverse: autoverses,
        };
        const kits = typeToKitsMap[vehicle.type] || [];
        setCorrectTypeKits(kits);
    }, [allKit, vehicle.type]);

    return (
        <div
            className={`flex flex-col w-full h-full items-center pt-4 select-none${
                selected ? "opacity-100" : "opacity-50"
            }`}
            onClick={() => handleVehicleClick(index)}
        >
            <div className="flex flex-col items-center">
                <div className="flex flex-col w-full h-full items-center">
                    <div className="flex min-w-[80px] max-w-[80px] min-h-[80px]">
                        <img className="object-contain" src={vehicle.imgSrc} alt={vehicle.type} />
                    </div>
                </div>
                <div className="flex justify-center items-center select-none text-">
                    <div className="flex">{nameWithoutLastWord}</div>
                    <div className={gradientClass}>{lastWord}</div>
                    {selected && icon}
                </div>
                {selected && <div className="flex w-full items-center">{children}</div>}
                {selected && (
                    <div className="flex w-full justify-center min-h-[60px] ">
                        {vehicle.isInDevelopment ? (
                            <div className="flex text-sm justify-center mt-2 text-gray-600 w-max pointer-events-none relative">
                                <div className="flex w-full justify-center items-center h-fit">
                                    <TbCode className="w-4 h-4 mr-1 text-aiot-blue-md" />
                                    In development
                                </div>
                            </div>
                        ) : (
                            <div className="absolute">
                                {((vehicle.type === "dreamKIT" && hasPermissionDeployToDreamKit) ||
                                    (vehicle.type === "Autoverse" && hasPermissionDeployToVM) ||
                                    (vehicle.type === "Cloud" && hasPermissionDeployToVM) ||
                                    (vehicle.type === "TestFleet" && hasPermissionDeployToPilot)) && (
                                    <div className={`flex mt-2 ${selected ? "visible" : "invisible"} relative`}>
                                        <KitConnect
                                            code={code}
                                            usedAPIs={usedAPIs}
                                            allKit={correctTypeKits}
                                            onActiveKitChange={onActiveKitChange}
                                            onDeploy={(isDeploying) => {
                                                isDeploying ? handleVehicleClick(index) : handleVehicleClick(null);
                                            }}
                                        />
                                    </div>
                                )}
                                {!(
                                    hasPermissionDeployToDreamKit ||
                                    hasPermissionDeployToVM ||
                                    hasPermissionDeployToPilot
                                ) && (
                                    <div className="flex mt-2 text-sm justify-center text-gray-600 w-max pointer-events-none">
                                        <div className="flex w-full justify-center items-center h-fit">
                                            <TbUserExclamation className="w-4 h-4 mr-1 text-aiot-blue-md" />
                                            You don't have permission to deploy
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleCard;
