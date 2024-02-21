import React, { useState, useEffect, useRef } from "react";
import { ProgressBar } from "./ProgressBar";
import { VscClose } from "react-icons/vsc";
import { TbCloudDown, TbCloudSearch, TbCloudCog, TbDeviceDesktopCode, TbCloudUp, TbCloudCheck } from "react-icons/tb";
import KitConnect from "../../../services/KitConnect";
import CustomModal from "../../../reusable/Popup/CustomModal";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";

export type VehicleType = "dreamKIT" | "VirtualMachine" | "XSPACE" | "PilotFleet";

interface RenderDeployVehicleProps {
    imgSrc: string;
    vehicleType: VehicleType;
    selectedVehicle: VehicleType | null; // Current select vehicle control by parent
    isDeploying: boolean;
    progress: number;
    onVehicleClick: (vehicle: VehicleType) => void; // Callback to parent
    onDeploy: () => void;
    code: string;
    isComplete: boolean;
    onCloseSuccess: () => void;
    usedAPIs: string[];
    allKit: any[];
}
const mockupData = [
    {
        kit_id: "XSpace-001",
        is_online: false,
    },
    {
        kit_id: "XSpace-002",
        is_online: false,
    },
];

const RenderDeployVehicle: React.FC<RenderDeployVehicleProps> = ({
    imgSrc,
    vehicleType,
    selectedVehicle,
    isDeploying,
    progress,
    onVehicleClick,
    onDeploy,
    isComplete,
    code,
    onCloseSuccess,
    usedAPIs,
    allKit,
}) => {
    const splitName = vehicleType === "dreamKIT" ? ["dream", "KIT"] : vehicleType.split(/(?=[A-Z])/);
    const nameWithoutLastWord = splitName.slice(0, -1).join("");
    const lastWord = splitName[splitName.length - 1];
    const gradientClass =
        vehicleType === "dreamKIT" ? "text-aiot-gradient-70 font-bold mt-1" : "text-aiot-gradient-160 font-bold mt-1";
    // const gradientClass = (vehicleType === 'dreamKIT') ? 'text-[#18827e] font-bold mt-1' : 'text-aiot-gradient-160 font-bold mt-1';
    // const normalClass = (vehicleType === 'dreamKIT') ? 'text-[#bd0c78] font-bold mt-1' : 'mt-1';
    const normalClass = vehicleType === "dreamKIT" ? "mt-1" : "mt-1";

    const [dreamKits, setDreamKits] = useState<any[]>([]);
    const [vmKits, setVmKits] = useState<any[]>([]);
    const [pilotKits, setPilotKits] = useState<any[]>([]);
    const [selectKitId, setSelectedKitId] = useState<any>(null);

    useEffect(() => {
        // console.log("allKit", allKit);
        if (!allKit) {
            setDreamKits([]);
            setVmKits([]);
            return;
        }
        console.log("allKit", allKit);
        let dks = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("dreamkit-"));
        let vms = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("vm-"));
        let pilots = allKit.filter((kit) => kit.kit_id && kit.kit_id.toLowerCase().startsWith("pilotcar-"));
        setDreamKits(dks);
        setVmKits(vms);
        setPilotKits(pilots);
    }, [allKit]);

    const getDeploymentStatus = (progress: number) => {
        if (progress <= 10) {
            return { icon: <TbCloudUp className="mr-1 text-aiot-blue-md w-3 h-3" />, message: "Connecting" };
        }
        if (progress <= 30) {
            return { icon: <TbCloudCog className="mr-1 text-aiot-blue-md w-3 h-3" />, message: "Validating" };
        }
        if (progress <= 85) {
            return { icon: <TbCloudDown className="mr-1 text-aiot-blue-md w-3 h-3" />, message: "Deploying" };
        }
        if (progress <= 100) {
            return { icon: <TbCloudSearch className="mr-1 text-aiot-blue-md w-3 h-3" />, message: "Finalizing" };
        }
        return { icon: null, message: "" }; // default
    };

    return (
        <div className="">
            <div
                className={`w-[188px] flex justify-center ${
                    selectedVehicle === vehicleType ? "opacity-100" : "opacity-50"
                }`}
                onClick={() => onVehicleClick(vehicleType)}
            >
                <div className="flex flex-col items-center w-[85px] cursor-pointer">
                    <div className="flex items-center justify-center w-full h-[55px] mt-1">
                        <img className={`w-20 h-10 object-contain select-none`} src={imgSrc} />
                    </div>
                    <div
                        className={`flex w-full items-center justify-center text-sm select-none mt-1`}
                        onClick={() => {
                            if (vehicleType === "dreamKIT") {
                                window.open("https://digital-auto.github.io/playground/dreamkit/overview", "_blank");
                            }
                        }}
                    >
                        <span className={normalClass}>{nameWithoutLastWord}</span>
                        <span className={gradientClass}>{lastWord}</span>
                    </div>
                    {selectedVehicle === vehicleType && (
                        <>
                            <svg width="0" height="0" style={{ position: "absolute" }}>
                                <defs>
                                    <linearGradient id="aiot-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop stopColor="#005072" />
                                        <stop offset="1" stopColor="#6C944E" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            {/* {renderVehicleContent()} */}
                            <div className={`${isDeploying && "hidden"}`}>
                                {vehicleType === "dreamKIT" && (
                                    <div className={`flex mt-1`}>
                                        <KitConnect
                                            code={code}
                                            onDeploy={onDeploy}
                                            usedAPIs={usedAPIs}
                                            isComplete={isComplete}
                                            allKit={dreamKits}
                                        />
                                    </div>
                                )}
                                {vehicleType === "VirtualMachine" && (
                                    <>
                                        <div className={`flex mt-1`}>
                                            <KitConnect
                                                code={code}
                                                onDeploy={onDeploy}
                                                usedAPIs={usedAPIs}
                                                isComplete={isComplete}
                                                allKit={vmKits}
                                                onKitIdChanged={(kitId) => setSelectedKitId(kitId)}
                                            />
                                        </div>
                                        <div className="mt-1 mb-1">
                                            {selectKitId && (
                                                <div
                                                    onClick={() => {
                                                        let link = `/runtime-manager${
                                                            selectKitId && "?rtid=" + selectKitId
                                                        }`;
                                                        window.open(link, "_blank");
                                                    }}
                                                    className="hover:font-bold hover:underline font-semibold text-aiot-blue text-[12px]"
                                                >
                                                    Go to runtime manager
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {vehicleType === "PilotFleet" && (
                                    <div className={`flex mt-1`}>
                                        <KitConnect
                                            code={code}
                                            onDeploy={onDeploy}
                                            usedAPIs={usedAPIs}
                                            isComplete={isComplete}
                                            allKit={pilotKits}
                                        />
                                    </div>
                                )}
                                {!["dreamKIT", "VirtualMachine", "PilotFleet"].includes(vehicleType) && (
                                    <div className="flex mt-1 items-center text-[0.6rem] w-max select-none">
                                        <TbDeviceDesktopCode className="w-3 h-3 mr-1 text-aiot-blue-md" />
                                        In Development
                                    </div>
                                )}
                            </div>

                            {isDeploying && progress !== 100 && (
                                <ProgressBar progress={progress} indicatorPosition="end" indicator={false} />
                            )}
                            {isDeploying && !isComplete && (
                                <div className="mt-1 w-max text-[0.6rem] text-gray-600 flex items-center">
                                    {getDeploymentStatus(progress).icon}
                                    {getDeploymentStatus(progress).message}
                                </div>
                            )}

                            {vehicleType !== "XSPACE" && isComplete && (
                                <div className="flex w-max mt-2 items-center">
                                    <TbCloudCheck className="w-3 h-auto mr-1 text-aiot-blue-md" />
                                    Deploy Success
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenderDeployVehicle;
