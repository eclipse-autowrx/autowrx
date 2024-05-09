import React, { useEffect, useRef, useState } from "react";
import CustomModal from "../../../reusable/Popup/CustomModal";
import Button from "../../../reusable/Button";
import { TbAppWindow, TbTerminal2, TbX } from "react-icons/tb";
import GenAICode from "./GenAICode";
import GenAIDashboard from "./GenAIDashboard";
import { AddOn } from "../../../apis/models";
import { fetchMarketAddOns } from "../Widget/WidgetServices";

type GenAI_WidgetProps = {
    isOpen: boolean;
    onClose: () => void;
    widgetConfig?: any;
    onDashboardConfigChanged?: (config: any) => void;
    onCodeChanged?: (code: string) => void;
    type: AddOn["type"];
    pythonCode: string;
};

const GenAI_ProtoPilot = ({
    isOpen,
    onClose,
    widgetConfig,
    onDashboardConfigChanged,
    onCodeChanged,
    type,
    pythonCode,
}: GenAI_WidgetProps) => {
    const [marketplaceAddOns, setMarketplaceAddOns] = useState<AddOn[]>([]);

    useEffect(() => {
        fetchMarketAddOns(type).then((res) => {
            if (res) {
                setMarketplaceAddOns(res);
            }
        });
    }, [type]);

    return (
        <CustomModal isOpen={isOpen} className="flex w-[1000px] h-[500px]" onClose={() => {}}>
            <div className="flex flex-col w-full h-full bg-white rounded-lg p-4 text-gray-600 text-sm">
                {/* Conditionally render based on the type prop */}
                {type === "GenAI_Python" && (
                    <>
                        <div className="text-aiot-gradient-800 font-bold text-2xl">SDV ProtoPilot</div>
                        <div className="flex w-full h-full max-h-[440px]">
                            <GenAICode onCodeChanged={onCodeChanged} marketplaceAddOns={marketplaceAddOns} />
                        </div>
                    </>
                )}
                {type === "GenAI_Dashboard" && (
                    <>
                        <div className="text-aiot-gradient-800 font-bold text-2xl">Dashboard ProtoPilot</div>
                        <div className="flex w-full h-full max-h-[440px]">
                            <GenAIDashboard
                                onDashboardConfigChanged={onDashboardConfigChanged}
                                marketplaceAddOns={marketplaceAddOns}
                                pythonCode={pythonCode}
                            />
                        </div>
                    </>
                )}
            </div>
            <Button
                className="absolute top-4 right-2 hover:bg-gray-100 mr-2 !p-1"
                onClick={() => {
                    onClose();
                }}
                icon={TbX}
                iconClassName="w-6 h-6 !mr-0 hover:text-gray-600"
            />
        </CustomModal>
    );
};

export default GenAI_ProtoPilot;
