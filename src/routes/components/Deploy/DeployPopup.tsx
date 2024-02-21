import { useEffect, useState } from "react";
import CustomModal from "../../../reusable/Popup/CustomModal";
import { VscClose } from "react-icons/vsc";
import DeployAnimate from "./DeployAnimate";
import RenderDeployVehicle, { VehicleType } from "./RenderDeployVehicle";
import { socketio } from "./socketio";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { addLog } from "../../../apis";
import { useParams } from "react-router-dom";

interface DeployPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onDeploy: () => void;
    onCloseButton: () => void;
    code: string;
    usedAPIs: string[];
}
// Define data structure for each vehicle
export interface VehicleData {
    type: VehicleType;
    imgSrc: string;
    state: VehicleState;
}
// Define state of each vehicle
export interface VehicleState {
    isAuthenticated: boolean; // Require before deploying
    isDeploying: boolean;
    progress: number;
    isComplete: boolean;
    isJustComplete: boolean; // Just trigger some UI animation of changes
    interval?: any;
}

// URLs for vehicle images

const DeployPopup = ({ isOpen, onClose, onDeploy, onCloseButton, code, usedAPIs }: DeployPopupProps) => {
    const { profile } = useCurrentUser();
    const { prototype_id } = useParams();
    const [selectedVehicle, setSelectedVehicle] = useState<null | VehicleType>("VirtualMachine"); // Local state to track the currently selected vehicle
    const [isDeploying, setIsDeploying] = useState<boolean>(false); // Local state to track if any vehicle is deploying
    // Default state for a vehicle
    const initialVehicleState: VehicleState = {
        isAuthenticated: false,
        isDeploying: false,
        progress: 0,
        isComplete: false,
        isJustComplete: false,
    };

    const [allKit, setAllKit] = useState<any>([]);
    // Initial vehicle data
    const initialVehicles: VehicleData[] = [
        { type: "VirtualMachine", imgSrc: "/imgs/cloud-server.png", state: { ...initialVehicleState } },
        { type: "dreamKIT", imgSrc: "/imgs/DreamKit.png", state: { ...initialVehicleState } },
        { type: "XSPACE", imgSrc: "/imgs/TestVehicle.png", state: { ...initialVehicleState } },
        { type: "PilotFleet", imgSrc: "/imgs/ProductionVehicle.png ", state: { ...initialVehicleState } },
    ];
    // State to hold the list of vehicles and their respective states (array hold all the vehicles start with their defined initial state)
    const [vehicles, setVehicles] = useState<VehicleData[]>(initialVehicles);
    // Function to update a specific property of a vehicle's state
    const setVehicleProperty = (vehicleName: VehicleType, property: keyof VehicleState, value: any) => {
        setVehicles((vehicles) =>
            vehicles.map((vehicle) => {
                if (vehicle.type === vehicleName) {
                    return {
                        ...vehicle,
                        state: { ...vehicle.state, [property]: value },
                    };
                }
                return vehicle;
            })
        );
    };
    // Function to retrieve a specific property from the currently selected vehicle's state
    const getSelectedVehicleState = (property: keyof VehicleState) => {
        const vehicle = vehicles.find((vehicle) => vehicle.type === selectedVehicle);
        return vehicle ? vehicle.state[property] : null;
    };
    // Check if the current vehicle is deploying
    const isCurrentVehicleDeploying = () => {
        return getSelectedVehicleState("isDeploying");
    };

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

        return () => {
            socketio.off("connect", onConnect);
            socketio.off("disconnect", onDisconnect);
            socketio.off("list-all-kits-result", onGetAllKitData);
            unregisterClient();
            socketio.disconnect();
        };
    }, []);

    const onConnect = () => {
        // console.log("socket connected")
        registerClient();
    };

    const onDisconnect = () => {
        // console.log("socket disconnected")
    };

    const onGetAllKitData = (data) => {
        // console.log("list-all-kits-result", data)
        // Add mockup data to the original data
        const combinedData = [...data];

        setAllKit(combinedData);
    };

    // Mockup deployment for demonstration purposes
    const startVehicleDeployment = (vehicleName: VehicleType) => {
        let interval: any;
        interval = setInterval(() => {
            setVehicles((prevVehicles) => {
                return prevVehicles.map((vehicle) => {
                    if (vehicle.type !== vehicleName) return vehicle;

                    if (vehicle.state.progress < 100) {
                        setVehicleProperty(vehicle.type, "progress", vehicle.state.progress + 1);
                        setVehicleProperty(vehicle.type, "isDeploying", true);
                        setVehicleProperty(vehicle.type, "isComplete", false);
                        setIsDeploying(true); // to manipulate the DeployAnimate (since unmount will cause problem)
                    } else {
                        setVehicleProperty(vehicle.type, "progress", 100); // This ensures the progress remains at 100 until reset
                        setVehicleProperty(vehicle.type, "isComplete", true);
                        setIsDeploying(false);
                        clearInterval(interval);

                        // Reset properties after holding for 3 seconds
                        setTimeout(() => {
                            setVehicleProperty(vehicle.type, "isDeploying", false);
                            setVehicleProperty(vehicle.type, "progress", 0);
                            setVehicleProperty(vehicle.type, "isComplete", false);
                        }, 3000);
                    }
                    return vehicle;
                });
            });
        }, 60);
        setVehicleProperty(vehicleName, "interval", interval); // Store the interval for each vehicle

        if (profile && prototype_id) {
            const username = profile.name || profile.name || "Anonymous";

            addLog(
                `User '${username}' deploy code of prototype '${prototype_id}'`,
                `User '${username}' deploy code of prototype '${prototype_id}' to vehicle '${vehicleName}'`,
                "deploy",
                profile.uid,
                null,
                prototype_id,
                "prototype",
                null
            );
        }
    };

    // Clear intervals on component unmount
    useEffect(() => {
        return () => {
            // Clean up all intervals
            const intervals = vehicles.map((vehicle) => vehicle.state.interval);
            intervals.forEach((interval) => clearInterval(interval));
        };
    }, []);

    // log current state of selectedVehicle
    // useEffect(() => {
    //     console.log("selectedVehicle", selectedVehicle);
    //     console.log("isDeploying", isCurrentVehicleDeploying());
    //     console.log("isAuthenticated", isCurrentVehicleAuthenticated());
    // }, [selectedVehicle]);

    // Handle when user click on vehicle
    const handleVehicleClick = (vehicle: VehicleType) => {
        setSelectedVehicle(vehicle);
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={() => {
                onClose();
            }}
        >
            <div className="w-[880px] h-[420px] flex flex-col bg-white rounded-lg shadow p-4 text-sm">
                <div className="flex flex-col w-full pt-3 pb-0">
                    <div className="flex w-full pb-2">
                        <div className="w-full text-aiot-blue text-xl font-bold text-aiot-gradient-500">Deployment</div>
                        <div className="flex align-top w-full justify-end" onClick={onCloseButton}>
                            <VscClose className="w-8 h-auto text-gray-400 hover:text-aiot-blue text-xs flex justify-end"></VscClose>
                        </div>
                    </div>
                    <div className="text-justify text-gray-600 leading-normal pr-10">
                        <span className="">Initiate the deployment of your prototype either to the </span>
                        <span className="font-bold">dreamKIT </span>
                        <span className="">platform or to the designated PoC or Pilot vehicles.</span>
                        <span className=" text-gray-600"> To deploy you need to select desired target.</span>
                    </div>
                    <div className="w-full flex flex-col justify-center items-center">
                        <div className="w-[84px] h-auto">
                            <img className="w-full h-full pb-1" src="/imgs/code1.png" />
                        </div>
                        <div className="text-base font-bold text-aiot-gradient-500 bg-red-300">
                            playground.digital.auto
                        </div>
                    </div>
                </div>
                <div className="w-full h-full text-gray-600 text-[0.6rem] object-contain">
                    <div className="w-full flex justify-center">
                        <DeployAnimate
                            selectedVehicle={selectedVehicle}
                            isDeploying={isDeploying}
                            isAuthenticated={true}
                        />
                    </div>
                    <div className="w-full flex justify-center">
                        <div className={`flex ${isCurrentVehicleDeploying() ? "pointer-events-none" : ""}`}>
                            {vehicles.map((vehicle) => (
                                <RenderDeployVehicle
                                    key={vehicle.type}
                                    imgSrc={vehicle.imgSrc}
                                    vehicleType={vehicle.type}
                                    selectedVehicle={selectedVehicle}
                                    onVehicleClick={handleVehicleClick} // Set selected vehicle
                                    isDeploying={vehicle.state.isDeploying}
                                    // isDeploying={true}

                                    progress={vehicle.state.progress}
                                    // progress={100}

                                    onDeploy={() => {
                                        startVehicleDeployment(vehicle.type);
                                    }}
                                    isComplete={vehicle.state.isComplete}
                                    // isComplete={true}

                                    code={code}
                                    onCloseSuccess={() => {
                                        setVehicleProperty(vehicle.type, "isComplete", false);
                                    }}
                                    usedAPIs={usedAPIs}
                                    allKit={allKit}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CustomModal>
    );
};

export default DeployPopup;
