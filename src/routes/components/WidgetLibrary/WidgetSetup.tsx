import React from "react";
import CodeEditor from "../CodeViewer/CodeEditor";
import GenAI_Widget from "../GenAI/GenAIWidgetDev";
import clsx from "clsx";
import { BsStars } from "react-icons/bs";

type WidgetConfigProps = {
    isWidgetGenAI?: boolean;
    isCreateMyOwnWidget?: boolean;
    optionsStr: string;
    setOptionStr: (value: string) => void;
    modalRef?: React.RefObject<HTMLDivElement>;
    setWidgetUrl: React.Dispatch<React.SetStateAction<string>>;
};

const WidgetSetup = ({
    isWidgetGenAI = false,
    isCreateMyOwnWidget = false,
    optionsStr,
    setOptionStr,
    modalRef,
    setWidgetUrl,
}: WidgetConfigProps) => {
    return (
        <div className={clsx("flex-1 flex flex-col pt-1", (!isCreateMyOwnWidget || !isWidgetGenAI) && "hidden")}>
            <div className="flex items-center text-base text-md">
                {/* <TbEdit className="text-gray-600 w-5 h-5 mr-1.5" style={{ strokeWidth: 1.8 }} /> */}
                {/* <div className="text-aiot-gradient-800 font-bold text-2xl">Widget ProtoPilot</div> */}
                <div className="text-slate-400 text-md italic">Using generative AI to create a widget for you</div>
                {/* <div className="rounded ml-auto bg-aiot-blue/5 px-2 py-1 text-aiot-blue text-sm font-semibold items-center">
                        <BsStars className="inline-block mr-1 mb-0.5" />
                        Facilitated by AI
                    </div> */}
            </div>
            <div className="block mt-2 grow min-h-[180px] h-[180px]">
                {/* <GenAIWidget outerSetWidgetUrl={setWidgetUrl} modalRef={modalRef} /> */}
                <GenAI_Widget
                    widgetConfig={optionsStr}
                    outerSetiWidgetUrl={setWidgetUrl}
                    onDashboardConfigChanged={() => {}}
                    onClose={() => {}}
                />
            </div>
        </div>
    );
};

export default WidgetSetup;
