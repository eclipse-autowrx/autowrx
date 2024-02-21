import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { VscDebugStart } from "react-icons/vsc";
import { Model, Prototype } from "../../../../apis/models";
import useCurrentPrototype from "../../../../hooks/useCurrentPrototype";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import runCode, { loadModelLibrary } from "../../CodeViewer/runCode";
import ControlButton from "../ControlButton";
import ControlCenter from "./ControlCenter";
import useLoadCurrentUser from "../../../../reusable/hooks/useLoadCurrentUser";
import { addLog } from "../../../../apis";

const SlidingControlCenter: FC<{
    code: string;
    auto_run?: boolean;
}> = ({ code, auto_run }) => {
    const [open, setOpen] = useState(false);
    const prototype = useCurrentPrototype() as Prototype;
    const model = useCurrentModel() as Model;
    const [miniRunningCode, setMiniRunningCode] = useState(false);

    const [width, left] = open
        ? // 0.5rem 20% of 2.5rem
          ["calc(40% + 1.5rem)", "calc(60% - 1.5rem)"]
        : ["2.5rem", "calc(100% - 2.5rem)"];

    const [userLoading, currentUser] = useLoadCurrentUser();

    useEffect(() => {
        loadModelLibrary(model.cvi, JSON.stringify(model.custom_apis ?? {}));
    }, [model.cvi, JSON.stringify(model.custom_apis ?? {})]);

    useEffect(() => {
        if (auto_run) {
            setTimeout(() => {
                executeCodeFn();
            }, 3000);
        }
    }, []);

    const executeCodeFn = async () => {
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
        setMiniRunningCode(true);
        console.log("Before code run 001");
        try {
            const lmnop = await runCode(prototype.name, code, null);
            console.log(">>>>>>>> /r/n run code result, lmnop: ", lmnop);
        } catch (e) {
            console.log("Run code error");
            console.log(e);
        }
        setMiniRunningCode(false);
    };

    return (
        <div className="flex absolute h-full top-0" style={{ width, left }}>
            <div className="flex relative h-full">
                {!open && (
                    <div className="w-full absolute top-0 z-10 py-2 text-lg text-gray-400">
                        <div
                            className={clsx(
                                "flex flex-col cursor-pointer items-center hover:text-gray-500 transition px-5",
                                miniRunningCode && "text-gray-700 pointer-events-none"
                            )}
                            onClick={() => {
                                executeCodeFn();
                            }}
                        >
                            <VscDebugStart />
                            <div className="text-sm mt-1">Run</div>
                        </div>
                    </div>
                )}
                <div
                    onClick={() => {
                        setOpen(!open);
                    }}
                    className={clsx(
                        "cursor-pointer flex w-10 h-full uppercase text-xs leading-none px-4 items-center justify-center bg-gray-700 text-gray-400 select-none",
                        miniRunningCode && "pointer-events-none"
                    )}
                    style={{ writingMode: "vertical-rl", transform: "rotate(-180deg)" }}
                >
                    Control Center
                </div>
            </div>
            {open && <ControlCenter code={code} />}
        </div>
    );
};

export default SlidingControlCenter;
