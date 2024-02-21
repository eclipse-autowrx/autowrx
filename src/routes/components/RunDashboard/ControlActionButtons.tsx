import ControlButton from "./ControlButton";
import { VscDebugAltSmall, VscDebugStart, VscDebugStepOver, VscDebugStop, VscRunAll } from "react-icons/vsc";

interface ControlActionButtonsProps {
    playingLine: number | null;
    Actions: {
        [key in "Start" | "Next" | "Stop"]: () => void;
    };
    isRunning?: boolean;
}

const ControlActionButtons = ({ playingLine, Actions, isRunning }: ControlActionButtonsProps) => {
    return (
        <div className="flex flex-col pt-3 pb-3 border-b border-gray-700 bg-gray-800">
            <div className="flex text-2xl text-gray-500 mx-auto">
                {playingLine === null ? (
                    <>
                        <ControlButton disabled={isRunning} Icon={VscDebugStart} text="Run" onClick={Actions.Start} />
                        <ControlButton
                            disabled={isRunning}
                            Icon={VscDebugAltSmall}
                            text="Debug"
                            onClick={Actions.Next}
                        />
                    </>
                ) : (
                    <>
                        <ControlButton Icon={VscDebugStop} text="Stop" onClick={Actions.Stop} />
                        <ControlButton
                            disabled={isRunning}
                            Icon={VscDebugStepOver}
                            text="Next"
                            onClick={Actions.Next}
                        />
                        <ControlButton disabled={isRunning} Icon={VscRunAll} text="Skip" onClick={Actions.Start} />
                    </>
                )}
            </div>
        </div>
    );
};

export default ControlActionButtons;
