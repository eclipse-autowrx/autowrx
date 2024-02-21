import { useEffect, useState } from "react";
import { socketio } from "../Deploy/socketio";
import { GoDotFill } from "react-icons/go";
import DeploySelect from "../Deploy/DeploySelect";
import { TbRotateClockwise2, TbRocket, TbCheck, TbExclamationMark } from "react-icons/tb";
import Button from "../../../reusable/Button";
import CustomCheckBox from "../../../reusable/CustomCheckBox";
import { set } from "js-cookie";

interface APIMappingKitProps {
    onDeploy: (value: boolean) => void;
    uploadedFile: File | null;
    jsonConfig: string;
    triggerDeploy: boolean;
    valid: boolean;
    onReloadOriginalConfig: (value: boolean) => void;
}

const APIMappingKit = ({
    onDeploy,
    uploadedFile,
    jsonConfig,
    triggerDeploy,
    valid,
    onReloadOriginalConfig,
}: APIMappingKitProps) => {
    const [activeKitId, setActiveKitId] = useState<string | undefined>("");
    const [allKit, setAllKit] = useState<any>([]);
    const [isReloadOriginalConfig, setIsReloadOriginalConfig] = useState<boolean>(false);
    const [isDeploying, setIsDeploying] = useState<boolean>(false); // Use for both deploy and reload
    const [returnPayload, setReturnPayload] = useState<any>(null);
    const [isDeployFailed, setIsDeployFailed] = useState<boolean>(false); // Use for both deploy and reload
    const [returnLog, setReturnLog] = useState<any>(null); // Use for both deploy and reload
    const [isJustDeployed, setIsJustDeployed] = useState<boolean>(false); // Use for both deploy and reload
    const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);

    const registerClient = () => {
        socketio.emit("register_client", {
            username: "test",
            user_id: "test",
            domain: "domain",
        });
    };
    const unregisterClient = () => {
        socketio.emit("unregister_client", {});
    };

    useEffect(() => {
        if (!socketio.connected) {
            socketio.connect();
        } else {
            registerClient();
        }

        socketio.on("connect", onConnect);
        socketio.on("disconnect", onDisconnect);
        socketio.on("list-all-kits-result", onGetAllKitData);
        socketio.on("messageToKit-kitReply", onKitReply);

        return () => {
            socketio.off("connect", onConnect);
            socketio.off("disconnect", onDisconnect);
            socketio.off("list-all-kits-result", onGetAllKitData);
            unregisterClient();
            socketio.disconnect();
        };
    }, []);

    const onKitReply = (payload) => {
        if (!payload) return;
        setReturnPayload(payload);
    };

    // Handle State when receive message from Kit
    useEffect(() => {
        if (!returnPayload) return;
        console.log("returnPayload", returnPayload.cmd);
        if (
            returnPayload.result &&
            (returnPayload.cmd === "vss_mapping_factory_reset_result" || returnPayload.cmd === "vss_mapping_result")
        ) {
            console.log("Deploy/Reload Success");
            setIsDeploying(false);
            setIsDeployFailed(false);
            setIsJustDeployed(true);
        } else {
            console.log("Deploy/Reload Fail");
            setReturnLog(returnPayload.log);
            setIsDeploying(false);
            setIsDeployFailed(true);
            setIsJustDeployed(false);
        }
    }, [returnPayload]);

    // Timeout for deploying
    useEffect(() => {
        console.log("isDeploying", isDeploying);
        if (!isDeploying) return;

        const timeoutDuration = 15000; // 15 seconds, can be dynamic or configurable
        const timeout = setTimeout(() => {
            console.log("Deploy/Reload Timeout");
            setIsDeploying(false);
            setShowTimeoutWarning(true);
        }, timeoutDuration);

        // Cleanup function
        return () => clearTimeout(timeout);
    }, [isDeploying]);


    // Timeout for showTimeoutWarning
    useEffect(() => {
        (async () => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            setShowTimeoutWarning(false);
        })()
    }, [showTimeoutWarning]);

    // Timeout for justDeployed
    useEffect(() => {
        (async () => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            setIsJustDeployed(false);
        })()
    }, [isJustDeployed]);

    const onConnect = () => {
        registerClient();
    };

    const onDisconnect = () => { };

    const onGetAllKitData = (data) => {
        // console.log("list-all-kits-result", data)
        // Add mockup data to the original data
        const combinedData = [...data];
        setAllKit(combinedData);
    };

    // Sort all kits based on online status
    useEffect(() => {
        if (!allKit || allKit.length <= 0) {
            setActiveKitId("");
            return;
        }

        // Sort the kits: online kits first, then offline
        const sortedKits = [...allKit].sort((a, b) => b.is_online - a.is_online);

        // Check if sortedKits are different from allKit to avoid unnecessary state update
        const isDifferent = sortedKits.some((kit, index) => kit !== allKit[index]);
        if (isDifferent) {
            setAllKit(sortedKits);
        }

        // Only update activeKitId if it's not set or no longer valid
        if (!activeKitId || !sortedKits.some((kit) => kit.kit_id === activeKitId)) {
            setActiveKitId(sortedKits[0]?.kit_id);
        }
    }, [allKit]);

    // Map all kits to dropdown options with some additional attributes
    const kitOptions = allKit.map((kit) => {
        const isOnlineIcon = kit.is_online ? (
            <GoDotFill className="text-green-500/80 w-4 h-auto" />
        ) : (
            <GoDotFill className="text-yellow-500/80 w-4 h-auto" />
        );

        let toolTipContent = "";
        // Device anem + Online status tooltip
        if (kit.is_online) {
            toolTipContent += `${kit.kit_id} is online. `;
        } else {
            toolTipContent += `${kit.kit_id} is offline. `;
        }
        // tooltip and isCompatible are added by backend
        return {
            value: kit.kit_id,
            is_online: kit.is_online,
            isCompatible: kit.is_online,
            label: (
                <div className="flex items-center space-x-1 w-full">
                    <span className="block truncate whitespace-nowrap">{kit.kit_id}</span>
                </div>
            ),
            icon: <div className="flex items-center space-x-1">{isOnlineIcon}</div>,
            tooltip: toolTipContent,
        };
    });

    // Map all kits to dropdown options with some additional attributes
    const handleDeploy = () => {
        if (!activeKitId || !allKit.length || !uploadedFile || !jsonConfig) {
            return;
        }

        setIsDeploying(true); // Start render logic and time-out

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result;
            if (content) {
                let sendPayload = {
                    cmd: "vss_mapping",
                    to_kit_id: activeKitId,
                    data: {
                        cmd: jsonConfig,
                        payload: content.toString(),
                    },
                };
                console.log("Emit Deploy", sendPayload);
                socketio.emit("messageToKit", sendPayload);
            } else {
                setIsDeploying(false);
                console.error("Failed to read .dbc file content");
            }
        };
        reader.readAsText(uploadedFile);
    };

    const handleReloadOriginal = () => {
        try {
            setIsDeploying(true); // Start render logic and time-out
            let sendTriggerReload = {
                cmd: "vss_mapping_factory_reset",
                to_kit_id: activeKitId,
            };
            console.log("Emit Reload", sendTriggerReload);
            socketio.emit("messageToKit", sendTriggerReload);
        } catch (error) {
            setIsDeploying(false);
            console.error("Error in handleDeploy: ", error);
        }
    };

    // Update the onReload based on isReload
    useEffect(() => {
        onReloadOriginalConfig(isReloadOriginalConfig);
    }, [isReloadOriginalConfig]);

    // Find the active kit's compatibility status
    const activeKit = kitOptions.find((kit) => kit.value === activeKitId);
    const isActiveKitCompatible = Boolean(activeKit && activeKit.is_online);

    return (
        <div
            className={`flex flex-col text-sm text-gray-500 items-center outline-none ring-0 relatvie ${isDeploying ? "opacity-80 pointer-events-none" : ""
                }`}
        >
            <div className="flex w-full">
                <DeploySelect
                    customStyle="h-7 w-40 text-xs rounded border bg-white text-gray-500 border-gray-200 shawdow-sm"
                    customDropdownContainerStyle="text-xs"
                    customDropdownItemStyle="hover:bg-gray-100 h-7 border-slate-200 px-1 h-5 w-36"
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
                {isReloadOriginalConfig
                    ? socketio &&
                    socketio.connected &&
                    kitOptions &&
                    activeKitId && (
                        <Button
                            className="h-7 w-[6rem] ml-1"
                            variant="red"
                            onClick={handleReloadOriginal}
                            showProgress={isDeploying}
                            icon={TbRotateClockwise2}
                            iconClassName="w-4 h-4 mr-1"
                            progressText="Reload"
                        >
                            {!isDeploying && "Reload"}
                        </Button>
                    )
                    : socketio &&
                    socketio.connected &&
                    kitOptions &&
                    activeKitId && (
                        <Button
                            className={`h-7 w-[6rem] ml-1 bg-aiot-gradient-6 shadow-aiot-blue/40 shadow select-none  ${isActiveKitCompatible ? "opacity-100" : "opacity-40"
                                } ${valid
                                    ? "opacity-100 cursor-pointer hover:opacity-90"
                                    : "opacity-40 pointer-events-none"
                                }`}
                            variant="blue"
                            onClick={handleDeploy}
                            showProgress={isDeploying}
                            icon={TbRocket}
                            iconClassName="w-5 h-5 mr-1"
                            progressText="Deploy"
                        >
                            {!isDeploying && "Deploy"}
                        </Button>
                    )}
            </div>
            <div className="flex mt-2">
                {!isJustDeployed && !showTimeoutWarning && !isDeploying ? (
                    <CustomCheckBox
                        isChecked={isReloadOriginalConfig}
                        onToggle={setIsReloadOriginalConfig}
                        label="Reload original configuration"
                        iconClassName="!w-4 !h-4"
                        colorVariant="red"
                    />
                ) : (
                    showTimeoutWarning ?
                        (<div className="flex w-full items-center text-gray-600">
                            <TbExclamationMark className="h-5 w-5 text-orange-500"></TbExclamationMark>The deployment is timed out
                        </div>)
                        :
                        !isDeploying ?
                            (isDeployFailed ?
                                <div className="flex w-full items-center text-gray-600">
                                    <TbExclamationMark className="h-5 w-5 mr-1 text-red-500"></TbExclamationMark>Failed
                                </div>
                                :
                                <div className="flex w-full items-center text-gray-600">
                                    <TbCheck className="h-5 w-5 mr-1 text-green-500"></TbCheck>Successful
                                </div>
                            )
                            : null
                )}
            </div>
        </div>
    );
};

export default APIMappingKit;
