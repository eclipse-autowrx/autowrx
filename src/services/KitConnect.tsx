import { useEffect, useState } from "react";
import { socketio } from "./socketio";
import { GoDotFill } from "react-icons/go";
import DeploySelect from "../routes/components/Deploy/DeploySelect";
import useCurrentPrototype, { useCurrentPrototypeGetSet } from "../hooks/useCurrentPrototype";
import { PrototypeGetSet } from "../apis/models";

import md5 from "md5";
import { on } from "events";

interface KitConnectProps {
    code: string;
    onDeploy: () => void;
    usedAPIs: string[];
    isComplete: boolean;
    allKit: any[];
    onKitIdChanged?: (id:any) => void;
}

const KitConnect: React.FC<KitConnectProps> = ({ code, onDeploy, usedAPIs, isComplete, allKit, onKitIdChanged }) => {
    const [activeKitId, setActiveKitId] = useState<string | undefined>("");
    const { prototype, updatePrototype } = useCurrentPrototypeGetSet() as PrototypeGetSet;

    useEffect(() => {
        if(onKitIdChanged) {
            onKitIdChanged(activeKitId);
        }
    }, [activeKitId]);

    const isKitCompatible = (kit: any, usedAPIs: any[]): boolean => {
        if (
            !kit.support_apis ||
            (typeof kit.support_apis === "string" && kit.support_apis.trim() === "") ||
            (Array.isArray(kit.support_apis) && kit.support_apis.length === 0)
        ) {
            return false;
        }

        let supportedAPIs: string[] = [];

        if (typeof kit.support_apis === "string") {
            try {
                supportedAPIs = JSON.parse(kit.support_apis);
            } catch (error: any) {
                return false;
            }
        } else if (Array.isArray(kit.support_apis)) {
            supportedAPIs = kit.support_apis;
        }

        return usedAPIs.every((api) => supportedAPIs.includes(api.name));
    };

    const sortedKits = [...allKit].sort((a, b) => {
        const aIsCompatible = isKitCompatible(a, usedAPIs);
        const bIsCompatible = isKitCompatible(b, usedAPIs);
        // First, sort by online status
        if (aIsCompatible && bIsCompatible) {
            if (a.is_online && !b.is_online) return -1;
            if (!a.is_online && b.is_online) return 1;
        }
        if (aIsCompatible && !bIsCompatible) return -1;
        if (!aIsCompatible && bIsCompatible) return 1;

        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;

        return 0;
    });

    useEffect(() => {
        if (!allKit || allKit.length <= 0) {
            setActiveKitId("");
            return;
        }
        if(!activeKitId || activeKitId === "") {
            setActiveKitId(sortedKits[0].kit_id);
            return;
        }
        let matchKit = sortedKits.find((kit: any) => kit.kit_id == activeKitId);
        if(!matchKit) {
            setActiveKitId(sortedKits[0].kit_id);
        }
    }, [allKit]);

    const kitOptions = sortedKits.map((kit) => {
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

    useEffect(() => {
        if (!allKit.length || !activeKitId || !isComplete) {
            return;
        }

        if (isComplete) {
            console.log("activeKit are" + activeKitId);

            let matchKit = allKit.find((kit: any) => kit.kit_id == activeKitId);
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
            socketio.emit("messageToKit", deployPayload);
        }
    }, [isComplete, activeKitId, allKit]);

    // Find the active kit's compatibility status
    const activeKit = kitOptions.find((kit) => kit.value === activeKitId);
    const isActiveKitCompatible = Boolean(activeKit && activeKit.isCompatible && activeKit.is_online);

    return (
        <div className="flex text-sm text-gray-500 items-start outline-none ring-0">
            <DeploySelect
                customStyle="h-5 min-w-[180px] text-[0.6rem] rounded border border-transparent bg-white text-gray-500 hover:border-gray-300"
                customDropdownContainerStyle="text-[0.6rem]"
                customDropdownItemStyle="hover:bg-gray-100 border-slate-200 px-1 h-5 w-36"
                options={kitOptions}
                selectedValue={activeKitId}
                onValueChange={(value) => {
                    // console.log(`onValueChange value ${value}`)
                    if (typeof value === "string") {
                        setActiveKitId(value);
                    } else {
                        // Handle the undefined or unexpected value here.
                    }
                }}
            />

            {socketio && socketio.connected && kitOptions && activeKitId && (
                <div
                    className={`ml-1 px-1.5 text-[0.6rem] rounded bg-aiot-gradient-6 text-white shadow-aiot-blue/40 shadow select-none cursor-pointer ${
                        isActiveKitCompatible ? "opacity-100 hover:opacity-90" : "opacity-50"
                    }`}
                    onClick={() => {
                        if (!isActiveKitCompatible) return;
                        onDeploy();
                    }}
                >
                    Deploy
                </div>
            )}
        </div>
    );
};

export default KitConnect;
