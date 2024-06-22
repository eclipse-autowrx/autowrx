import { forwardRef, useState, useEffect, useImperativeHandle } from 'react'
import { socketio } from '@/services/socketio.service'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
// import useModelStore from '@/stores/modelStore'

interface KitConnectProps {
    // code: string;
    usedAPIs: string[];
    // allKit: any[];
    onActiveRtChanged?: (newActiveKitId: string | undefined) => void;
    onNewLog?: (log: string) => void;
    onAppExit?: (code: any) => void;
}

const DaRuntimeConnector = forwardRef<any, KitConnectProps>(({ usedAPIs, onActiveRtChanged, onNewLog, onAppExit }, ref) => {
    const [activeRtId, setActiveRtId] = useState<string | undefined>("");
    const [allRuntimes, setAllRuntimes] = useState<any>([]);
    const [ticker, setTicker] = useState(0)

    useImperativeHandle(ref, () => { return { runApp, stopApp } });

    const [apisValue, setActiveApis] = useRuntimeStore(
        (state) => [
            state.apisValue,
            state.setActiveApis
        ],
        shallow,
    )

    useEffect(() => {
        if (!usedAPIs) return
        console.log("usedAPIs", usedAPIs)
        if (activeRtId) {
            console.log("subscribe_apis usedAPIs", usedAPIs)
            socketio.emit("messageToKit", {
                cmd: "subscribe_apis",
                to_kit_id: activeRtId,
                apis: usedAPIs
            })
        }
    }, [usedAPIs])

    useEffect(() => {
        let timer = setInterval(() => {
          setTicker((oldTicker) => oldTicker + 1)
        }, 30000)
        return () => {
          if (timer) clearInterval(timer)
        }
      }, [])

      useEffect(() => {
        if (activeRtId) {
            console.log("subscribe_apis usedAPIs", usedAPIs)
            socketio.emit("messageToKit", {
                cmd: "subscribe_apis",
                to_kit_id: activeRtId,
                apis: usedAPIs
            })
        }
      }, [ticker])

    const runApp = (code: string) => {
        console.log("runCode", code)
        if (onNewLog) {
            onNewLog(`Run app\r\n`)
        }
        socketio.emit("messageToKit", {
            cmd: "run_python_app",
            to_kit_id: activeRtId,
            data: {
                code: code
            }
        });
    }

    const stopApp = () => {
        socketio.emit("messageToKit", {
            cmd: "stop_python_app",
            to_kit_id: activeRtId,
            data: {}
        });
    }

    useEffect(() => {
        if (onActiveRtChanged) {
            onActiveRtChanged(activeRtId)
        }

        if (activeRtId) {
            socketio.emit("messageToKit", {
                cmd: "subscribe_apis",
                to_kit_id: activeRtId,
                apis: ["Vehicle.AverageSpeed"]
            })
        }
    }, [activeRtId])

    useEffect(() => {
        if (!socketio.connected) {
            socketio.connect();
        } else {
            registerClient();
        }

        socketio.on("connect", onConnected);
        socketio.on("disconnect", onDisconnect);
        socketio.on("list-all-kits-result", onGetAllKitData);
        socketio.on("messageToKit-kitReply", onKitReply);
        socketio.on("broadcastToClient", onBroadCastToClient);

        return () => {
            if (activeRtId) {
                socketio.emit("messageToKit", {
                    cmd: "unsubscribe_apis",
                    to_kit_id: activeRtId
                })
            }

            socketio.off("connect", onConnected);
            socketio.off("disconnect", onDisconnect);
            socketio.off("list-all-kits-result", onGetAllKitData);
            socketio.off("messageToKit-kitReply", onKitReply);
            socketio.off("broadcastToClient", onBroadCastToClient);
            socketio.emit("unregister_client", {});
            unregisterClient();
            socketio.disconnect();
        };
    }, []);

    useEffect(() => {
        if (allRuntimes && allRuntimes.length > 0) {
            if (activeRtId) return
            let activeRt = allRuntimes.find((rt: any) => rt.is_online)
            if (activeRt) {
                setActiveRtId(activeRt.kit_id)
            }
        } else {
            setActiveRtId(undefined)
        }
    }, [allRuntimes])

    const onConnected = () => {
        registerClient()
        if(usedAPIs) {
            setTimeout(() => {
                if (activeRtId) {
                    socketio.emit("messageToKit", {
                        cmd: "subscribe_apis",
                        to_kit_id: activeRtId,
                        apis: usedAPIs
                    })
                }
            }, 1000)
        }
    }

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

    const onDisconnect = () => {
        console.log("socket disconnected")
    };

    const onGetAllKitData = (data: any) => {
        console.log("list-all-kits-result", data)
        let sortedKits = [...data].sort((a, b) => b.is_online - a.is_online);
        sortedKits = sortedKits.filter(rt => rt.kit_id.toLowerCase().startsWith('runtime-'))
        setAllRuntimes(sortedKits);
    };

    const onBroadCastToClient = (payload: any) => {
        if (!payload) return
        console.log(`onBroadCastToClient`)
        console.log(payload)
    }

    const onKitReply = (payload: any) => {
        if (!payload) return
        // console.log(payload)
        if (payload.cmd == "run_python_app") {
            if (payload.isDone) {
                if (onNewLog) {
                    onNewLog(`Exit code ${payload.code}\r\n`)
                }
                if (onAppExit) {
                    onAppExit(payload.code)
                }
            } else {
                if (onNewLog) {
                    onNewLog(payload.result || '')
                }
            }
        }

        if (payload.cmd == "apis-value") {
            if (payload.result) {
                // console.log(payload.result)
                setActiveApis(payload.result)
            }
        }
    };


    return <div>
        <div className="flex items-center">
            <label className="mr-2 da-label-small">Runtime:</label>
            <select className={`border rounded da-label-small px-2 py-1 min-w-[240px] text-da-white bg-da-gray-medium`}
                value={activeRtId as any}
                onChange={(e) => {
                    console.log(`in option, active RT`, e.target.value)
                    setActiveRtId(e.target.value);
                }}>
                {allRuntimes && allRuntimes.map((rt: any) => {
                    return <option value={rt.kit_id} key={rt.kit_id} disabled={!rt.is_online}>
                        <div className="text-[20px] flex items-center">
                            {rt.is_online ? "🟢" : "🟡"} {rt.name}
                        </div>
                    </option>
                })}
            </select>
        </div>
    </div>
})

export default DaRuntimeConnector