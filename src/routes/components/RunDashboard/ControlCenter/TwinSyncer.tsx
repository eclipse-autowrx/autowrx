import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { clear } from "console";
const URL = "http://localhost:3090";

const socketio = io(URL);

const TwinSyncer = () => {
    const [activeKitId, setActiveKitId] = useState<string>("");
    const [allKit, setAllKit] = useState<any>([]);
    const [isSync, setIsSync] = useState<boolean>(true);
    const [ticker, setTicker] = useState<number>(0);

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
        sendDataToClient();
    }, [ticker]);

    const sendDataToClient = () => {
        console.log("sendDataToClient");
        // if(!socketio || !socketio.connected) return
        // if(!activeKitId || !isSync || !socketio || !socketio.connected) return
        try {
            if (window["runner"]) {
                let iframeWidnow = window["runner"].iframeWindow as any;
                if (!iframeWidnow || !iframeWidnow.PYTHON_BRIDGE.valueMap) return;
                let data = Object.fromEntries(iframeWidnow.PYTHON_BRIDGE.valueMap);
                let payload = {
                    cmd: "syncer_set",
                    to_kit_id: activeKitId,
                    vssData: data,
                };
                console.log("messageToSyncerHw", payload);
                socketio.emit("messageToSyncerHw", payload);
            } else {
                console.log("window.runner not found");
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (!socketio.connected) {
            socketio.connect();
        } else {
            registerClient();
        }

        socketio.on("connect", onConnect);
        socketio.on("disconnect", onDisconnect);
        socketio.on("list-all-hw-result", onGetAllKitData);

        let interval = setInterval(() => {
            setTicker((ticker: any) => ticker + 1);
        }, 500);

        return () => {
            socketio.off("connect", onConnect);
            socketio.off("disconnect", onDisconnect);
            socketio.off("list-all-hw-result", onGetAllKitData);
            unregisterClient();
            socketio.disconnect();

            if (interval) clearInterval(interval);
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
        setAllKit(data);
        if (!activeKitId && data.length > 0) {
            setActiveKitId(data[0].kit_id);
        }
    };

    useEffect(() => {
        if (!allKit || allKit.length <= 0) {
            setActiveKitId("");
            return;
        }
        if (!activeKitId) {
            setActiveKitId(allKit[0].kit_id);
        } else {
            let matchKit = allKit.find((kit: any) => kit.kit_id == activeKitId);
            if (!matchKit) {
                setActiveKitId("");
            }
        }
    }, [allKit, activeKitId]);

    return (
        <div className="flex">
            <select
                className="ml-1 w-[160px] text-center px-2 py-1 rounded"
                value={activeKitId as any}
                onChange={(e) => {
                    // console.log("on_kit_picked ", e.target.value)
                    setActiveKitId(e.target.value);
                }}
            >
                {allKit.map((kit: any, index: number) => (
                    <option key={index} value={kit.kit_id}>
                        {kit.is_online ? "🟢" : "🟡"} {kit.kit_id}
                    </option>
                ))}
            </select>

            <div className="text-white">{activeKitId}</div>
        </div>
    );
};
export default TwinSyncer;
