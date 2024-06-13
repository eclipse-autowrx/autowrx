import React from "react";
import CodeEditor from "../CodeEditor";
// import GenAI_Widget from "../GenAI/GenAIWidgetDev";
import DaGenAIWidget from "../genAI/DaGenAI_Widget";
import { cn } from "@/lib/utils";

type DaWidgetConfigProps = {
    isWidgetGenAI?: boolean;
    isCreateMyOwnWidget?: boolean;
    optionsStr: string;
    setOptionStr: (value: string) => void;
    modalRef?: React.RefObject<HTMLDivElement>;
    setWidgetUrl: React.Dispatch<React.SetStateAction<string>>;
};

const DaWidgetSetup = ({
    isWidgetGenAI = false,
    isCreateMyOwnWidget = false,
    optionsStr,
    setOptionStr,
    modalRef,
    setWidgetUrl,
}: DaWidgetConfigProps) => {
    return (
        <div className={cn("flex w-full h-full flex-col pt-1", (!isCreateMyOwnWidget || !isWidgetGenAI) && "hidden")}>
            <div className="flex items-center text-base text-md"></div>
            <div className="flex w-full h-full">
                <DaGenAIWidget
                    widgetConfig={optionsStr}
                    outerSetiWidgetUrl={setWidgetUrl}
                    onDashboardConfigChanged={() => {}}
                    onClose={() => {}}
                />
            </div>
        </div>
    );
};

export default DaWidgetSetup;
