import { useEffect, useState } from "react";
import { socketio } from "./socketio";
import { GoDotFill } from "react-icons/go";
import DeploySelect from "../routes/components/Deploy/DeploySelect";
import ProgressBar from "../routes/components/Deploy/ProgressBar";
import { TbCheck, TbLoader2 } from "react-icons/tb";
import { useCurrentPrototypeGetSet } from "../hooks/useCurrentPrototype";
import { PrototypeGetSet } from "../apis/models";

interface KitConnectProps {
    code: string;
    usedAPIs: string[];
    allKit: any[];
    onActiveKitChange?: (newActiveKitId: string | undefined) => void;
    onDeploy?: (isDeploying: boolean) => void;
}

const KitConnect: React.FC<KitConnectProps> = ({ code, usedAPIs, allKit, onActiveKitChange, onDeploy }) => {
    const [activeKitId, setActiveKitId] = useState<string | undefined>("");
    const [KitsToRender, setKitsToRender] = useState<any[]>([]);

    const { prototype, updatePrototype } = useCurrentPrototypeGetSet() as PrototypeGetSet;

    const [progress, setProgress] = useState(0);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isMockDeployComplete, setIsMockDeployComplete] = useState(false);

    // Checks if the given kit provide enough compatible APIs with the prototype APIs
    const isKitCompatible = (kit: any, usedAPIs: any[]): boolean => {
        // If it's not defined or an empty string or an empty array
        if (
            !kit.support_apis ||
            (typeof kit.support_apis === "string" && kit.support_apis.trim() === "") ||
            (Array.isArray(kit.support_apis) && kit.support_apis.length === 0)
        ) {
            // console.warn(`Kit ${kit.kit_id} has no support_apis defined or is empty.`);
            return false;
        }

        let supportedAPIs: string[] = [];

        // If it's a string, try to parse. If it's an array, assign directly.
        if (typeof kit.support_apis === "string") {
            try {
                supportedAPIs = JSON.parse(kit.support_apis);
            } catch (error: any) {
                // console.warn(`Failed to parse support_apis for kit ${kit.kit_id}.`, error.message);
                return false;
            }
        } else if (Array.isArray(kit.support_apis)) {
            supportedAPIs = kit.support_apis;
        }

        return usedAPIs.every((api) => supportedAPIs.includes(api.name));
    };

    // Sorting online and compatible kits first
    const sortKits = (kits) => {
        return kits.sort((a, b) => {
            const aIsCompatible = isKitCompatible(a, usedAPIs);
            const bIsCompatible = isKitCompatible(b, usedAPIs);
            // First, sort by online status
            if (aIsCompatible && bIsCompatible) {
                if (a.is_online && !b.is_online) return -1;
                if (!a.is_online && b.is_online) return 1;
            }
            // If both are equally online, sort by compatibility
            if (aIsCompatible && !bIsCompatible) return -1;
            if (!aIsCompatible && bIsCompatible) return 1;

            if (a.is_online && !b.is_online) return -1;
            if (!a.is_online && b.is_online) return 1;

            return 0;
        });
    };

    // This useEffect is used to sort the kits and update the activeKitId if necessary (preventing unnecessary state updates)
    useEffect(() => {
        if (!allKit || allKit.length <= 0) {
            setActiveKitId("");
            setKitsToRender([]);
            return;
        }
        // Sort the kits based on the updated allKit array
        const newSortedKits = sortKits([...allKit]);

        // Check if newSortedKits are different from KitsToRender to avoid unnecessary state update
        const isDifferent = newSortedKits.some(
            (kit, index) => !KitsToRender[index] || kit.kit_id !== KitsToRender[index].kit_id
        );
        if (isDifferent) {
            setKitsToRender(newSortedKits);
            // Update activeKitId if necessary
            if (!activeKitId || !newSortedKits.some((kit) => kit.kit_id === activeKitId)) {
                setActiveKitId(newSortedKits[0]?.kit_id);
            }
        }
    }, [allKit]);

    // Map all kits to dropdown options with some additional attributes
    const kitOptions = KitsToRender.map((kit) => {
        const isOnlineIcon = kit.is_online ? (
            <GoDotFill className="text-green-500/80 w-3 h-auto" />
        ) : (
            <GoDotFill className="text-yellow-500/80 w-3 h-auto" />
        );

        let isCompatible = isKitCompatible(kit, usedAPIs);

        let toolTipContent = "";
        // Device anem + Online status tooltip
        if (kit.is_online) {
            toolTipContent += `${kit.kit_id} is online. `;
        } else {
            toolTipContent += `${kit.kit_id} is offline. `;
        }

        // Compatibility tooltip
        if (isCompatible) {
            toolTipContent += "All APIs are supported.";
        } else {
            toolTipContent += "Some APIs are not supported.";
        }
        // tooltip and isCompatible are added by backend
        return {
            value: kit.kit_id,
            is_online: kit.is_online,
            label: (
                <div className="flex items-center space-x-1 w-full">
                    <span className="block truncate whitespace-nowrap">{kit.kit_id}</span>
                </div>
            ),
            icon: <div className="flex items-center space-x-1">{isOnlineIcon}</div>,
            tooltip: toolTipContent,
            isCompatible: isCompatible,
        };
    });
    // Mock deployment progress
    const mockDeploymentProgress = () => {
        // Init mock deployment states
        setProgress(0);
        setIsMockDeployComplete(false);
        setIsDeploying(true);
        let interval = setInterval(() => {
            setProgress((prev) => {
                if (prev < 100) {
                    return prev + 1;
                } else {
                    setIsMockDeployComplete(true);
                    // Keep the "Deployed" status for 2 seconds then reset the states
                    setTimeout(() => {
                        setIsDeploying(false);
                        setProgress(0);
                        clearInterval(interval);
                    }, 2000);
                    return 100;
                }
            });
        }, 80);
    };

    // Mock display of deployment status
    const getDeploymentStatus = (progress: number) => {
        if (progress <= 10) {
            return { message: "Connecting" };
        }
        if (progress <= 30) {
            return { message: "Validating" };
        }
        if (progress <= 85) {
            return { message: "Deploying" };
        }
        if (progress < 100) {
            return { message: "Finalizing" };
        }
        if (progress === 100) {
            return { message: "Complete" };
        }
        return { icon: null, message: "" }; // default
    };

    // Map all kits to dropdown options with some additional attributes
    useEffect(() => {
        if (!KitsToRender.length || !activeKitId || !isMockDeployComplete) {
            return;
        }

        if (isMockDeployComplete) {
            // Trigger the deploy logic here
            // console.log("Complete Animation")
            // console.log("allKit are" + allKit)
            console.log("Deployment to: " + activeKitId + " initiated.");

            let matchKit = KitsToRender.find((kit: any) => kit.kit_id == activeKitId);
            if (!matchKit) {
                alert("Something wrong, kit now found!");
                return;
            }

            let deployPayload = {
                cmd: "deploy_request",
                to_kit_id: activeKitId,
                code: code || "",
                prototype: {
                    name: prototype?.name || "no-name",
                    id: prototype?.id || "no-id",
                },
            };
            // console.log("deployPayload", deployPayload);
            socketio.emit("messageToKit", deployPayload);
            console.log("Deployment to: " + activeKitId + " successfully.");
            // alert("Deploy sent!");
            // alert("Deploy success!");
        }
    }, [isMockDeployComplete, activeKitId, KitsToRender]);

    // Notify the parent component when the active kit changes
    useEffect(() => {
        if (onActiveKitChange) {
            onActiveKitChange(activeKitId);
        }
    }, [activeKitId]);
    // Notify the parent component when the deployment status changes
    useEffect(() => {
        if (onDeploy) {
            onDeploy(isDeploying);
        }
    }, [isDeploying]);

    // Find the active kit's compatibility status
    const activeKit = kitOptions.find((kit) => kit.value === activeKitId);
    const isActiveKitCompatible = Boolean(activeKit && activeKit.isCompatible && activeKit.is_online);

    return (
        <div className="flex flex-col text-sm text-gray-500 items-start outline-none ring-0">
            {!isDeploying && (
                <div className="flex w-full items-center">
                    <DeploySelect
                        options={kitOptions}
                        selectedValue={activeKitId}
                        onValueChange={(value) => {
                            if (typeof value === "string") {
                                setActiveKitId(value);
                            } else {
                                // Handle the undefined or unexpected value here.
                            }
                        }}
                    />

                    {socketio && socketio.connected && kitOptions && activeKitId && (
                        <div
                            className={`flex ml-1 px-2 h-7 text-xs rounded items-center justify-center bg-aiot-gradient-6 text-white shadow-aiot-blue/40 shadow select-none cursor-pointer ${
                                isActiveKitCompatible ? "opacity-100 hover:opacity-90" : "opacity-50"
                            }`}
                            onClick={() => {
                                if (!isActiveKitCompatible) return;
                                mockDeploymentProgress();
                            }}
                        >
                            Deploy
                        </div>
                    )}
                </div>
            )}

            {isDeploying && (
                <div
                    className={`flex flex-col px-4 py-2 border border-gray-200 shadow-sm rounded w-full text-sm text-gray-600 items-center justify-center`}
                >
                    <div className="flex w-full items-center justify-center pb-2">
                        {getDeploymentStatus(progress).icon}
                        {/* {progress === 100 ? (
                            <TbCheck className="flex w-4 h-auto mr-1 text-aiot-blue" />
                        ) : (
                            <TbLoader2 className="flex w-3.5 h-auto mr-1 text-aiot-blue animate-spin" />
                        )} */}
                        {progress === 100 && <TbCheck className="flex w-3.5 h-auto mr-1 text-aiot-blue" />}
                        {getDeploymentStatus(progress).message}
                    </div>
                    <ProgressBar progress={progress} indicatorPosition="end" indicator={false} />
                </div>
            )}
        </div>
    );
};

export default KitConnect;
