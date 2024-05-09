import { useState } from "react";
import CustomInput from "../../../reusable/Input/CustomInput";
import Button from "../../../reusable/Button";
import _ from "lodash";
import { AddOn } from "../../../apis/models";
import { TbCode } from "react-icons/tb";
import { BsStars } from "react-icons/bs";
import LoadingLineAnimation from "./LoadingLineAnimation";
import ResponseDisplay from "./ResponseDisplay";
import LLMServices from "./LLMService";
import GeneratorSelector from "./GeneratorDropdown";

type GenAICodeProps = {
    marketplaceAddOns: AddOn[];
    onCodeChanged?: (code: string) => void;
};

const GenAICode = ({ marketplaceAddOns, onCodeChanged }: GenAICodeProps) => {
    const [inputPrompt, setInputPrompt] = useState<string>("");
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [genCode, setGenCode] = useState<string>("");
    const [isFinished, setIsFinished] = useState<boolean>(false);

    const genPythonCode = async () => {
        if (!selectedAddOn) {
            alert("Please select an generator");
            return;
        }
        try {
            if (selectedAddOn.endpointUrl.startsWith("https://bedrock-")) {
                let keys = (selectedAddOn.apiKey || "-@-").split("@");
                let accessKey = keys.length >= 1 ? keys[0] : "";
                let secretKey = keys.length >= 2 ? keys[1] : "";
                LLMServices.BedrockGenCode({
                    endpointURL: selectedAddOn.endpointUrl,
                    publicKey: accessKey,
                    secretKey: secretKey,
                    inputPrompt: inputPrompt,
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
                    <div className="flex mt-2 mb-4 w-full h-fit">
                        <CustomInput
                            state={[inputPrompt, setInputPrompt]}
                            form={"textarea"}
                            className="text-sm"
                            containerClassName="!shadow-sm !bg-white"
                            defaultRows={4}
                            disabled={loading}
                            placeholder="Ask AI to generate code based on this prompt..."
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
                    onClick={genPythonCode}
                >
                    <BsStars className={`inline-block mr-1 mb-0.5 ${loading ? "animate-pulse" : ""}`} />
                    {!loading && <div>Generate</div>}
                </Button>
            </div>
            <div className="flex flex-col w-1/2 h-full pt-3 pl-2">
                <div className="flex mb-2 select-none">
                    <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
                        3
                    </div>
                    <div className="flex ml-1 text-gray-600 font-bold">Preview Code</div>
                </div>
                <div className="flex w-full h-full overflow-y-auto overflow-x-hidden scroll-gray max-h-[350px]">
                    {genCode ? (
                        <ResponseDisplay code={genCode} language={"python"} />
                    ) : (
                        <LoadingLineAnimation loading={loading} content={"There's no code here"} />
                    )}
                </div>
                <div className="flex flex-col w-full mt-auto pt-3 select-none">
                    <Button
                        variant="white"
                        className="!h-8 w-full"
                        onClick={() => {
                            onCodeChanged ? onCodeChanged(genCode) : null;
                        }}
                        disabled={!(genCode && genCode.length > 0) || !isFinished}
                        icon={TbCode}
                        iconClassName="w-4 h-4"
                    >
                        Add new generated code
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GenAICode;
