import clsx from "clsx";
import { useEffect, useState } from "react";
import { Model } from "../../../../apis/models";
import useCurrentPrototype from "../../../../hooks/useCurrentPrototype";
import useCviApiMonitor from "../../../../hooks/useCviApiMonitor";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import { Line } from "../../CodeViewer/models";
import runCode, { loadModelLibrary } from "../../CodeViewer/runCode";
import Terminal from "../../CodeViewer/Terminal";
import ControlActionButtons from "../ControlActionButtons";
import CVIApiMonitor from "../CVIApiMonitor";
import { addLog } from "../../../../apis";
import useLoadCurrentUser from "../../../../reusable/hooks/useLoadCurrentUser";
import TwinSyncer from "./TwinSyncer";

interface ExecutionCenterShadowProps {
    open: boolean;
}

const ExecutionCenterShadow = ({ open }: ExecutionCenterShadowProps) => {
    return (
        <div
            className={clsx(
                "absolute top-0 left-0 w-full h-full bg-gray-800 z-10 text-white flex items-center justify-center font-bold text-2xl transition",
                open ? "opacity-90" : "opacity-0 pointer-events-none"
            )}
        >
            Running
        </div>
    );
};

interface ExecutionCenterProps {
    code: string;
    startExecution?: () => void;
    executeExceptFirst?: () => void;
    endExecution?: () => void;
}

const ExecutionCenter = ({ code, startExecution, executeExceptFirst, endExecution }: ExecutionCenterProps) => {
    const [terminalOutput, setTerminalOutput] = useState<Line[]>([]);
    const [playingLine, setPlayingLine] = useState<null | number>(null);
    const [monitor, clearMonitor] = useCviApiMonitor();

    const [importingShadowOpen, setImportingShadowOpen] = useState(false);

    const prototype = useCurrentPrototype();
    const model = useCurrentModel() as Model;
    const [userLoading, currentUser] = useLoadCurrentUser();

    const Actions = {
        Start: () => {
            setImportingShadowOpen(true);
            clearMonitor();
            addLog(
                `Run prototype ${prototype?.name}`,
                `User ${
                    currentUser?.profile?.name || currentUser?.user?.email || "Anonymous"
                } run prototype ${prototype?.name}`,
                "run-prototype",
                currentUser?.user?.uid || "anonymous",
                null,
                prototype?.id || null,
                "prototype",
                model.id
            );
            setTimeout(async () => {
                startExecution && startExecution();
                const [outputParts, lastLine, finished] = await runCode(prototype?.name ?? "", code, null);
                setPlayingLine(null);
                endExecution && endExecution();
                setTerminalOutput([
                    {
                        parts: outputParts,
                    },
                ]);
                setImportingShadowOpen(false);
            }, 0);
        },
        Next: () => {
            setImportingShadowOpen(true);
            clearMonitor();
            setTimeout(async () => {
                if (playingLine === null) {
                    startExecution && startExecution();
                }
                const [outputParts, lastLine, finished] = await runCode(
                    prototype?.name ?? "",
                    code,
                    playingLine === null ? 0 : playingLine + 1
                );
                if (playingLine !== null) {
                    executeExceptFirst && executeExceptFirst();
                }
                if (finished) {
                    setPlayingLine(null);
                    endExecution && endExecution();
                } else {
                    setPlayingLine(lastLine);
                }
                setTerminalOutput([
                    {
                        parts: outputParts,
                    },
                ]);
                setImportingShadowOpen(false);
            }, 0);
        },
        Stop: () => {
            setPlayingLine(null);
            endExecution && endExecution();
        },
    };

    return (
        <div className="flex h-full w-full bg-gray-800">
            <div className="flex flex-col relative w-full">
                {/* <ExecutionCenterShadow open={importingShadowOpen} /> */}

                <ControlActionButtons playingLine={playingLine} Actions={Actions} isRunning={importingShadowOpen} />

                {playingLine !== null && (
                    <div className="flex px-3 py-2 border-b border-gray-700">
                        <div className="flex w-full font-mono text-sm">
                            <div className="flex text-gray-500 pr-3 ">{playingLine + 1}</div>
                            <div className="flex text-gray-200 whitespace-nowrap flex-1 w-0 overflow-x-auto items-center tracking-tight scroll-gray">
                                {code.split("\n")[playingLine]}
                            </div>
                        </div>
                    </div>
                )}

                <Terminal
                    hideMinimize
                    lines={terminalOutput}
                    openClassName={clsx("h-48 scroll-gray")}
                    codeClassName="text-xs"
                    open={true}
                    setOpen={() => null}
                />

                <CVIApiMonitor monitor={monitor} />

                {/* <div className="min-h-[160px]">
                    <TwinSyncer/>
                </div> */}
            </div>
        </div>
    );
};

export default ExecutionCenter;
