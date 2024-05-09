import { useEffect, useState, useRef } from "react";
import CustomModal from "../../../reusable/Popup/CustomModal";
import { socketio } from "./socketio";
import Button from "../../../reusable/Button";
import { TbX } from "react-icons/tb";
import VehicleSelection from "./VehicleSelection";

interface DeployPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onDeploy: () => void;
    onCloseButton: () => void;
    code: string;
    usedAPIs: string[];
}

const DeployPopup = ({ isOpen, onClose, onDeploy, onCloseButton, code, usedAPIs }: DeployPopupProps) => {
    const [allKit, setAllKit] = useState<any>([]);

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
        const combinedData = [...data];
        setAllKit(combinedData);
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={() => {
                onClose();
            }}
            className="flex"
        >
            <div className="flex flex-col max-w-[95vw] max-h-[95vh] bg-white rounded-lg shadow px-6 pt-6 pb-4">
                <div className="flex flex-col w-full pb-0">
                    <div className="w-full text-aiot-blue text-2xl font-bold text-aiot-gradient-500">Deployment</div>
                    <Button
                        className="absolute top-4 right-2 hover:bg-gray-100 mr-2 !p-1"
                        onClick={onCloseButton}
                        icon={TbX}
                        iconClassName="w-6 h-6 !mr-0 hover:text-gray-600"
                    />
                    <div className="text-justify text-gray-600 leading-normal pr-10 pt-3">
                        <span className="">Initiate the deployment of your prototype either to </span>
                        <span className="font-bold">Cloud </span>
                        <span className="">environments, </span>
                        <span className="font-bold">Autoverse </span>
                        <span className="">platform, </span>
                        <span className="font-bold">dreamKIT </span>
                        <span className=""> or</span>
                        <span className="font-bold"> Test</span>
                        <span className=""> vehicles.</span>
                        <span className=" text-gray-600"> To deploy you need to select desired target.</span>
                    </div>
                </div>
                <div className="flex flex-col w-full h-full text-gray-600">
                    <VehicleSelection allKit={allKit} code={code} usedAPIs={usedAPIs}></VehicleSelection>
                </div>
            </div>
        </CustomModal>
    );
};

export default DeployPopup;
