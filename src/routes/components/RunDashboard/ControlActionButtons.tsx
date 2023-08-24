import ControlButton from "./ControlButton"
import { VscDebugAltSmall, VscDebugStart, VscDebugStepOver, VscDebugStop, VscRunAll } from "react-icons/vsc"

interface ControlActionButtonsProps {
    playingLine: number | null
    Actions: {
        [key in ("Start" | "Next" | "Stop")]: () => void
    }

}

const ControlActionButtons = ({playingLine, Actions}: ControlActionButtonsProps) => {
    return (
        <div className="flex flex-col pt-3 pb-3 border-b border-gray-700 bg-gray-800">
            <div className="flex text-2xl text-gray-500 mx-auto">
                {playingLine === null ? (
                    <>
                        <ControlButton Icon={VscDebugStart} text="Run" onClick={Actions.Start} />
                        <ControlButton Icon={VscDebugAltSmall} text="Debug" onClick={Actions.Next} />
                    </>
                ) : (
                    <>
                        <ControlButton Icon={VscDebugStop} text="Stop" onClick={Actions.Stop} />  
                        <ControlButton Icon={VscDebugStepOver} text="Next" onClick={Actions.Next} />
                        <ControlButton Icon={VscRunAll} text="Skip" onClick={Actions.Start} />
                    </>
                )}
            </div>
        </div>
    )
}

export default ControlActionButtons