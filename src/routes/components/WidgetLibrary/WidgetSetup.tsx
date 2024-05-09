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
        <div className={clsx("flex w-full h-full flex-col pt-1", (!isCreateMyOwnWidget || !isWidgetGenAI) && "hidden")}>
            <div className="flex items-center text-base text-md"></div>
            <div className="flex w-full h-full">
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
