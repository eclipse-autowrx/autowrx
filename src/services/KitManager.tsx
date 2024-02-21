import { useEffect, useState, useRef } from "react";
import { socketio } from "./socketio";
import { FaRegStar } from "react-icons/fa6";
import { useSearchParams } from "react-router-dom";
import Popup from "../reusable/Popup/Popup";
import CodeEditor from "../routes/components/CodeViewer/CodeEditor";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const AlwaysScrollToBottom = () => {
    const elementRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if(elementRef && elementRef.current) { 
        // @ts-ignore
        elementRef.current.scrollIntoView()
    }});
    
    return <div ref={elementRef} />;
  };

const KitManager = () => {
    const [searchParams] = useSearchParams();
    const [activeRtId, setActiveRtId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<string>("prototype")

    const [allKit, setAllKit] = useState<any[]>([]);
    const [activeKitId, setActiveKitId] = useState<string>("");
    const [activeKit, setActiveKit] = useState<any>(null);

    const [protos, setProtos] = useState<any[]>([]);
    const [activeProtoId, setActiveProtoId] = useState<string>("");
    const [log, setLog] = useState<string>("");
    const popupSupportApiState = useState(false);
    const [tmpSupportApiText, setTmpSupportApiText] = useState("");
    const popupProtoCode = useState(false);
    const [tmpActiveProtoCode, setTmpActiveProtoCode] = useState("");

    useEffect(() => {
        let id = searchParams.get("rtid");
        setActiveRtId(id || null);
    }, [searchParams]);

    useEffect(() => {
        if (!allKit || allKit.length <= 0) {
            setActiveKitId("");
            return;
        }
        if (activeKitId) {
            let matchKit = allKit.find((kit: any) => kit.kit_id == activeKitId);
            if (!matchKit) {
                setActiveKitId("");
                return
            }
        } else {
            if(activeRtId) {
                let matchKit = allKit.find((kit: any) => kit.kit_id == activeRtId);
                if(matchKit) {
                    setActiveKitId(activeRtId);
                    return
                }
            }
            setActiveKitId(allKit[0].kit_id);
        }
    }, [allKit])

    useEffect(() => {
        if (!activeKitId || !allKit) {
            setActiveKit(null)
            return
        }
        let matchKit = allKit.find((kit: any) => kit.kit_id == activeKitId);
        setActiveKit(matchKit)

        setProtos([])
        setActiveProtoId("")
        setLog("")
        socketio.emit("messageToKit", {
            cmd: "list_prototypes",
            to_kit_id: activeKitId,
            data: {}
        });
    }, [activeKitId])

    useEffect(() => {
        let timer = setInterval(() => {
            try {
                if(activeKitId && protos) {
                    let matchProto = protos.find((proto:any) => proto.id == activeProtoId)
                    if(matchProto && matchProto.is_run) {
                        requestActionOnPrototype(activeProtoId, "get-app-log", "")
                    }
                }
                // socketio.emit("messageToKit", {
                //     cmd: "list_prototypes",
                //     to_kit_id: activeKitId,
                //     data: {}
                // });
                // if(activeProtoId) {
                //     let matchProto = protos.find((proto:any) => proto.id == activeProtoId)
                //     if(matchProto && matchProto.is_run) {
                //         requestActionOnPrototype(activeProtoId, "get-log")
                //     } else {
                //         console.log("No macth proto")
                //     }
                // } else {
                //     console.log("No active proto")
                // }
            } catch(er) {}
        }, 1000)
        return () => {
            if(timer) clearInterval(timer)
        }
    })

    const registerClient = () => {
        socketio.emit("register_client", {
            username: "test",
            user_id: "test",
            domain: "domain",
        });
    };

    const onConnect = () => {
        console.log("socket connected")
        registerClient();
    };

    const onDisconnect = () => {
        console.log("socket disconnected")
    };

    const onKitReply = (payload) => {
        if (!payload) return
        if (payload.cmd == 'list_prototypes') {
            let prototypes = []
            try {
                prototypes = JSON.parse(payload.result) || []

            } catch (err) { }
            if (payload.dapr_status) {
                prototypes.forEach((proto: any) => {
                    proto.is_run = payload.dapr_status.includes(proto.id)
                })
            }
            // console.log(`prototypes`, prototypes)

            prototypes.forEach((proto: any) => {
                // console.log("------------------------------------------")
                // console.log('lastDeploy', proto.lastDeploy)
                let dateString = dayjs().from(dayjs(proto.lastDeploy))
                proto.lastDeployDate = new Date(proto.lastDeploy).getTime()
                proto.dateString = dateString
                // console.log(dateString)
            })

            prototypes.sort((a: any, b: any) => {
                return b.lastDeployDate - a.lastDeployDate
            })

            setProtos(prototypes)
        }
        if (payload.cmd == 'action_on_prototype') {
            if (['start', 'stop', 'delete'].includes(payload.action)) {
                socketio.emit("messageToKit", {
                    cmd: "list_prototypes",
                    to_kit_id: activeKitId,
                    data: {}
                });
            }
            if (payload.action == 'get-python-code') {
                setTmpActiveProtoCode(payload.result)
                popupProtoCode[1](true)
            }
            if (payload.action == 'get-app-log') {
                if (payload.result) {
                    let filteredLog = payload.result
                    filteredLog = payload.result.split("\n").filter((line: string) => !line.includes('Waiting for dapr sidecar...') && !line.includes('<urlopen error [Errno 111] Connection refused>')).join("\n")
                    setLog(filteredLog)
                }
            }
        }
        if (payload.cmd == 'get_support_apis') {
            if (payload.result) {
                // setLog(`[get_support_apis] result\n`)
                // appendLog(JSON.stringify(payload.result, null, 2))
                try {
                    let support_apis = JSON.parse(payload.result)
                    if (activeKit) {
                        setActiveKit((activeKit: any) => ({ ...activeKit, support_apis: support_apis }))
                    }
                } catch { }
            }
        }

        if (payload.cmd == 'set_support_apis') {
            console.log(`[set_support_apis] result: ${payload.result}`)
            if (payload.result == 'success') {
                popupSupportApiState[1](false)
                socketio.emit("messageToKit", {
                    cmd: "get_support_apis",
                    to_kit_id: activeKitId,
                    data: {}
                });
            }
        }
    };

    const requestActionOnPrototype = (protoId: string, action: string, content: string) => {
        if (!action || !protoId) return
        // console.log(`[requestActionOnPrototype] protoId: ${protoId}, action: ${action}`)
        socketio.emit("messageToKit", {
            cmd: "action_on_prototype",
            to_kit_id: activeKitId,
            prototype_id: protoId,
            action: action,
            code: content
        });

        if(['start', 'stop'].includes(action)) {
            setTimeout(() => {
                socketio.emit("messageToKit", {
                    cmd: "list_prototypes",
                    to_kit_id: activeKitId,
                    data: {}
                });
            }, 2000)
        }
    }

    const onGetAllKitData = (data: any) => {
        if (!data) {
            setAllKit([])
            return
        }
        let kits = [...data].sort((a, b) => b.is_online - a.is_online)
        kits.forEach(kit => {
            if (!kit.support_apis) {
                kit.support_apis = []
            } else {
                try {
                    kit.support_apis = JSON.parse(kit.support_apis)
                } catch (error) {
                    kit.support_apis = []
                }

            }
        })

        setAllKit(kits);
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
            socketio.off("messageToKit-kitReply", onKitReply);
            socketio.emit("unregister_client", {});
            socketio.disconnect();
        };
    }, []);

    const appendLog = (text: string) => {
        setLog((l) => l + text + "\n")
    }

    return <div className="w-full h-full flex justify-center px-2 py-2">
        <div className="w-full max-w-[840px]">
            <div className="py-1 text-slate-600 flex items-center">
                <div className="grow text-2xl font-semibold">Runtime management</div>

                <div className="flex items-center">
                    <label className="mr-2">Target</label>
                    <select className="border rounded text-[13px] px-2 py-1 bg-slate-50 min-w-[240px]"
                        value={activeKitId as any}
                        onChange={(e) => {
                            setActiveKitId(e.target.value);
                        }}>
                        {allKit && allKit.map((kit: any) => {
                            return <option value={kit.kit_id} key={kit.kit_id} disabled={!kit.is_online}>
                                <div className="text-[20px] flex items-center">
                                    {kit.is_online ? "🟢" : "🟡"} {kit.kit_id}
                                </div>
                            </option>
                        })}
                    </select>
                </div>
            </div>

            {activeKit &&
                <div className="mt-2 px-4 py-1 w-full min-h-[100px] bg-slate-100 rounded">
                    <div className="mb-2 font-bold text-[12px] text-slate-700 font-mono border-b border-slate-200 flex items-center">
                        <div className="grow text-lg">KIT: {activeKit.name}</div>
                        <div className={`w-[120px] flex justify-center items-center py-1 cursor-pointer hover:opacity-70 
                            ${activeTab == 'prototype' && 'border-b border-sky-400 text-sky-400'}`}
                            onClick={() => { setActiveTab('prototype') }}>
                            Prototypes</div>
                        <div className={`w-[120px] flex justify-center items-center py-1 cursor-pointer hover:opacity-70 
                            ${activeTab == 'support-apis' && 'border-b border-sky-400 text-sky-400'}`}
                            onClick={() => { setActiveTab('support-apis') }}>
                            Support APIs</div>
                    </div>

                    <Popup
                        state={popupSupportApiState}
                        trigger={<span></span>}
                        width={"600px"}
                        className=""
                    >
                        <div className="p-2">
                            <div className="flex items-center">
                                <div className="text-lg font-bold text-slate-700 grow">Edit Support APIs</div>
                                <div className="text-md px-2 font-semibold px-2 py-1 cursor-pointer hover:opacity-60 bg-slate-100 rounded"
                                    onClick={() => {
                                        popupSupportApiState[1](false)
                                    }}>Close</div>
                                <div className="text-md px-2 ml-2 font-semibold px-2 py-1 cursor-pointer hover:opacity-60 bg-sky-600 text-white rounded"
                                    onClick={() => {
                                        if (activeKitId) {
                                            let support_apis = tmpSupportApiText.split("\n").map((api: string) => api.trim())
                                            support_apis = [...new Set(support_apis)]
                                            socketio.emit("messageToKit", {
                                                cmd: "set_support_apis",
                                                to_kit_id: activeKitId,
                                                apis: JSON.stringify(support_apis)
                                            });
                                            popupSupportApiState[1](false)
                                        }
                                    }}>Send to target</div>
                            </div>
                            <div className="mt-2">
                                <textarea className="w-full h-[300px] overflow-auto border rounded text-[13px] px-2 py-1 bg-slate-50"
                                    value={tmpSupportApiText}
                                    onChange={(e) => {
                                        setTmpSupportApiText(e.target.value)
                                    }}></textarea>
                            </div>
                        </div>
                    </Popup>

                    <Popup
                        state={popupProtoCode}
                        trigger={<span></span>}
                        width={"800px"}
                        className=""
                    >
                        <div className="p-2">
                            <div className="flex items-center">
                                <div className="text-lg font-bold text-slate-700 grow">Prototype Code</div>
                                <div className="text-md px-2 font-semibold px-2 py-1 cursor-pointer hover:opacity-60 bg-slate-100 rounded"
                                    onClick={() => {
                                        popupProtoCode[1](false)
                                    }}>Close</div>
                                <div className="text-md px-2 ml-2 font-semibold px-2 py-1 cursor-pointer hover:opacity-60 bg-sky-600 text-white rounded"
                                    onClick={() => {
                                        if (activeKitId && activeProtoId) {
                                            requestActionOnPrototype(activeProtoId, "set-python-code", tmpActiveProtoCode)
                                            popupProtoCode[1](false)
                                        }
                                    }}>Send to target</div>
                            </div>
                            <div className="mt-2 h-[400px]">
                                {/* <textarea className="w-full h-[300px] overflow-auto border rounded text-[13px] px-2 py-1 bg-slate-50"
                                    value={tmpActiveProtoCode}
                                    onChange={(e) => {
                                        setTmpActiveProtoCode(e.target.value)
                                    }}></textarea> */}
                                <CodeEditor
                                    code={tmpActiveProtoCode}
                                    editable={true}
                                    setCode={setTmpActiveProtoCode}
                                    language="python"
                                    onBlur={() => { }}
                                />
                            </div>
                        </div>
                    </Popup>


                    {activeTab == 'support-apis' && <>
                        <div className="mt-4 font-bold text-sm text-slate-700 flex items-center">
                            Support APIs: {activeKit.support_apis.length}
                            <div className="ml-4 py-0 px-2 text-sky-500 rounded cursor-pointer hover:opacity-60"
                                onClick={() => {
                                    if (activeKitId) {
                                        socketio.emit("messageToKit", {
                                            cmd: "get_support_apis",
                                            to_kit_id: activeKitId,
                                            data: {}
                                        });
                                    }
                                }}>
                                Reload
                            </div>

                            <div className="ml-2 py-0 px-2 text-sky-500 rounded cursor-pointer hover:opacity-60"
                                onClick={() => {
                                    setTmpSupportApiText(activeKit.support_apis.join("\n"))
                                    popupSupportApiState[1](true)
                                }}>
                                Edit
                            </div>
                        </div>
                        <div className="px-4 py-0.5 overflow-auto max-h-[140px] text-[11px] text-slate-500">
                            {activeKit.support_apis && activeKit.support_apis.map((api: any) => <div key={api} className="border-b">{api}</div>)
                            }
                        </div>
                    </>}
                    {activeTab == 'prototype' && <>
                        <div className="mt-4 font-bold text-sm text-slate-700 flex items-center">Prototypes: {protos.length}
                            <div className="ml-4 py-0 px-2 text-sky-500 rounded cursor-pointer hover:opacity-60"
                                onClick={() => {
                                    if (activeKitId) {
                                        socketio.emit("messageToKit", {
                                            cmd: "list_prototypes",
                                            to_kit_id: activeKitId,
                                            data: {}
                                        });
                                    }
                                }}>
                                Reload
                            </div>
                        </div>
                        <div className="px-4 py-0.5 overflow-auto max-h-[200px] text-[11px] text-slate-500">
                            {protos && protos.map((proto: any) => <div key={proto.id}
                                className={`border-b flex items-center pl-2 pr-1 py-0.5 cursor-pointer ${proto.id==activeProtoId && 'bg-slate-200'}`}
                                onClick={() => {
                                    setActiveProtoId(proto.id)
                                }}>
                                <FaRegStar/>
                                <div className=" ml-2 grow font-semibold text-[13px] leading-tight">
                                    {proto.name || proto.id}
                                    {/* <div className="text-[9px] font-normal leading-none italic">{proto.dateString} ago</div> */}
                                </div>

                                <div className="w-[120px]">Status:
                                    {proto.is_run && <span className="ml-1 font-mono text-emerald-500">Running</span>}
                                    {!proto.is_run && <span className="ml-1 font-mono text-red-500">Stopped</span>}
                                </div>
                                {proto.is_run && <div className="w-[60px] px-1 py-1 flex items-center justify-center text-white
                                                bg-red-500 rounded font-bold cursor-pointer"
                                    onClick={() => {
                                        appendLog(`Request to stop prototype ${proto.name}`)
                                        requestActionOnPrototype(proto.id, "stop", "")
                                    }}>
                                    Stop
                                </div>
                                }
                                {!proto.is_run && <div className="w-[60px] px-1 py-1 flex items-center justify-center text-white
                                                bg-emerald-500 rounded font-bold cursor-pointer"
                                    onClick={() => {
                                        appendLog(`Request to start prototype '${proto.name}'`)
                                        requestActionOnPrototype(proto.id, "start", "")
                                    }}>
                                    Run
                                </div>
                                }
                                <div className="w-[60px] px-1 py-1 ml-2 flex items-center justify-center text-gray-500
                                                rounded font-bold cursor-pointer hover:opacity-70"
                                    onClick={() => {
                                        setLog(`Request load run logs for prototype '${proto.name}'`)
                                        requestActionOnPrototype(proto.id, "get-app-log", "")
                                    }}>
                                    Load logs
                                </div>
                                <div className="w-[90px] px-1 py-1 ml-2 flex items-center justify-center text-gray-500
                                                rounded font-bold cursor-pointer hover:opacity-70"
                                    onClick={() => {
                                        setLog(`Request load run logs for prototype '${proto.name}'`)
                                        requestActionOnPrototype(proto.id, "get-python-code", "")
                                    }}>
                                    View Code
                                </div>
                            </div>)
                            }
                        </div>
                    </>
                    }
                </div>
            }

            <div className="mt-4 font-bold text-md text-slate-700 flex items-center">
                Log
                <div className="text-sky-500 font-bold text-[12px] px-2 py-1 hover:undeline hover:bg-slate-100 rounded cursor-pointer ml-2"
                    onClick={() => { setLog("") }}
                >Clear logs</div>
            </div>
            <div className="mt-1 w-full min-h-[300px] max-h-[300px] overflow-auto bg-slate-700 text-white 
                            rounded text-[12px] px-2 py-1 whitespace-pre-line">
                {log}
                <AlwaysScrollToBottom/>
            </div>
        </div>
    </div>
}

export default KitManager;