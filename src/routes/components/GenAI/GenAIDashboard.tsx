import React, { useEffect, useCallback, useState, useRef } from "react";
import CustomInput from "../../../reusable/Input/CustomInput";
import Button from "../../../reusable/Button";
import { AddOn } from "../../../apis/models";
import { TbLayoutGridAdd } from "react-icons/tb";
import { BsStars } from "react-icons/bs";
import DashboardEditor from "../Widget/DashboardEditor";
import LoadingLineAnimation from "./LoadingLineAnimation";
import GeneratorSelector from "./GeneratorDropdown";
import LLMServices from "./LLMService";
import ResponseDisplay from "./ResponseDisplay";

type GenAIDashboardProps = {
    marketplaceAddOns: AddOn[];
    onDashboardConfigChanged?: (config: any) => void;
    pythonCode: string;
};

const GenAIDashboard = ({ marketplaceAddOns, onDashboardConfigChanged, pythonCode }: GenAIDashboardProps) => {
    const [inputPrompt, setInputPrompt] = useState<string>("");
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [genCode, setGenCode] = useState<string>("");
    const [showResponse, setShowResponse] = useState<boolean>(true);
    const [isFinished, setIsFinished] = useState<boolean>(false);

    const genDashboard = async () => {
        if (!selectedAddOn) {
            alert("Please select an generator");
            return;
        }
        try {
            if (selectedAddOn.endpointUrl.startsWith("https://bedrock-")) {
                let keys = (selectedAddOn.apiKey || "-@-").split("@");
                let accessKey = keys.length >= 1 ? keys[0] : "";
                let secretKey = keys.length >= 2 ? keys[1] : "";
                let promptWithCode = inputPrompt + "This is prototype's SDV Python code: " + pythonCode;
                LLMServices.BedrockGenCode({
                    endpointURL: selectedAddOn.endpointUrl,
                    publicKey: accessKey,
                    secretKey: secretKey,
                    inputPrompt: promptWithCode,
                    systemMessage: selectedAddOn.samples ? selectedAddOn.samples : "",
                    setGenCode: setGenCode,
                    setLoading: setLoading,
                    setIsFinished: setIsFinished,
                });
            } else {
                LLMServices.OpenAIGenCode({
                    endpointUrl: selectedAddOn.endpointUrl,
                    apiKey: selectedAddOn.apiKey,
                    inputPrompt: inputPrompt,
                    systemMessage: selectedAddOn.samples ? selectedAddOn.samples : "",
                    setGenCode: setGenCode,
                    setLoading: setLoading,
                    setIsFinished: setIsFinished,
                });
            }
        } catch (error) {
            // Handle by LLMServices
        }
    };

    const handleDashboardConfigChanged = () => {
        if (onDashboardConfigChanged) {
            onDashboardConfigChanged(genCode);
        }
    };

    return (
        <div className="flex w-full h-full rounded">
            <div className="flex flex-col w-[50%] h-full pr-2 pt-3 border-r border-gray-100">
                <div>
                    <div className="flex select-none">
                        <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                            1
                        </div>
                        <div className="flex ml-1 text-gray-600 font-bold">Prompting</div>
                    </div>
                    <div className="flex mt-3 mb-4 w-full h-fit">
                        <CustomInput
                            state={[inputPrompt, setInputPrompt]}
                            form={"textarea"}
                            className="text-sm"
                            containerClassName="!shadow-sm !bg-white"
                            defaultRows={4}
                            disabled={loading}
                            placeholder="Ask AI to generate a dashboard based on this prompt..."
                        ></CustomInput>
                    </div>
                </div>
                <div className="flex mt-2 select-none">
                    <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                        2
                    </div>
                    <div className="flex ml-1 text-gray-600 font-bold">Select Generator</div>
                </div>

                <GeneratorSelector generatorList={marketplaceAddOns} onSelectedGeneratorChange={setSelectedAddOn} />

                {!inputPrompt && (
                    <div className="flex w-full mt-auto justify-center text-gray-400 select-none">
                        You need to enter prompt and select generator
                    </div>
                )}
                <Button
                    variant="blue"
                    disabled={!inputPrompt}
                    className={`!h-8 w-full mt-auto ${!inputPrompt ? "!mt-2" : "mt-auto"}`}
                    onClick={genDashboard}
                >
                    <BsStars className={`inline-block mr-1 mb-0.5 ${loading ? "animate-pulse" : ""}`} />
                    {!loading && <div>Generate</div>}
                </Button>
            </div>
            <div className="flex flex-col w-1/2 h-full pt-3 pl-2">
                <div className="flex justify-between items-center pb-2">
                    <div className="flex w-full h-full select-none">
                        <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                            3
                        </div>
                        <div className="flex ml-1 text-gray-600 font-bold">Preview Config</div>
                    </div>
                    {genCode && (
                        <Button
                            variant="white"
                            className="!h-6 text-xs cursor-pointer shrink-0"
                            onClick={() => setShowResponse(!showResponse)}
                        >
                            {showResponse ? "View Dashboard" : "View JSON Config"}
                        </Button>
                    )}
                </div>
                <div className="flex w-full h-full overflow-y-auto overflow-x-hidden scroll-gray max-h-[350px]">
                    {genCode ? (
                        showResponse ? (
                            <div className="flex w-full rounded border bg-gray-50 border-gray-200 overflow-y-auto scroll-gray">
                                <ResponseDisplay code={genCode} language="json" />
                            </div>
                        ) : (
                            <div className="flex flex-col w-full h-full">
                                <DashboardEditor
                                    entireWidgetConfig={genCode}
                                    onDashboardConfigChanged={handleDashboardConfigChanged}
                                    editable={false}
                                />
                            </div>
                        )
                    ) : (
                        <LoadingLineAnimation loading={loading} content={"There's no code here"} />
                    )}
                </div>
                <div className="flex flex-col w-full mt-auto select-none">
                    <Button
                        variant="white"
                        className="!h-8 w-full"
                        onClick={handleDashboardConfigChanged}
                        disabled={!(genCode && genCode.length > 0) || !isFinished}
                        icon={TbLayoutGridAdd}
                        iconClassName="w-4 h-4"
                    >
                        Add new generated config
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GenAIDashboard;
