import React, { useState, useEffect } from "react";
import { TbCopy, TbTag } from "react-icons/tb";
import TagChip from "../../TagsFilter/TagChip";
import copyText from "../../../reusable/copyText";
import CodeEditor, { CodeEditorProps } from "./CodeEditor";
import triggerSnackbar from "../../../reusable/triggerSnackbar";
import { nodeTypeColor } from "../CVIViewer/models/ApiListItem";
import ApiDiscussion from "../Discussion/ApiDiscussion";
import Button from "../../../reusable/Button";

interface CodeViewerProps extends CodeEditorProps {
    saving: boolean;
    saveCode: () => Promise<void>;
}

interface ApiCodeBlockProps {
    apiName: string;
    onCopied: () => void;
}

interface APIDetailsProps {
    activeApi: any;
    apiTags: any[];
    popupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

const ApiCodeBlock = ({ apiName, onCopied }: ApiCodeBlockProps) => {
    const [code, setCode] = useState<any>(null);
    useEffect(() => {
        setCode(`await v${apiName.substring(1)}`);
    }, [apiName]);
    return (
        <div className="flex px-3 py-3 bg-gray-100 rounded font-mono ">
            <div className="grow pre-wrap text-xs">{code}</div>
            <div
                className="px-2 cursor-pointer text-sky-600 hover:opacity-80"
                onClick={() => {
                    copyText(code);
                    triggerSnackbar("Copied to clipboard");
                    if (onCopied) {
                        onCopied();
                    }
                }}
            >
                Copy
            </div>
        </div>
    );
};

const APIDetails: React.FC<APIDetailsProps> = ({ activeApi, apiTags, popupState }) => {
    const [noOfDiscuss, setNoOfDiscuss] = useState(0);

    return (
        <div className="flex flex-col">
            {activeApi && (
                <div className="flex flex-col w-full">
                    <div className="text-gray-600 py-1 flex items-center font-bold text-xl border-b border-gray-300">
                        <div
                            className="flex items-center grow cursor-pointer"
                            onClick={() => copyText(activeApi.name, `Copied "${activeApi.name}" to clipboard.`)}
                        >
                            {activeApi.name}
                            <TbCopy className="w-5 h-5 ml-1" />
                        </div>
                        <div className={nodeTypeColor("text", activeApi.type)}>{activeApi.type.toUpperCase()}</div>
                    </div>
                    <div className="max-h-[500px] px-2 overflow-y-auto scroll-gray">
                        {["branch"].includes(activeApi.type) && (
                            <div>
                                <div className="text-gray-500 py-1 mt-1 flex items-center font-normal text-md">
                                    This is branch node, branch include a list of child API. You can not call a branch
                                    in python code, please select its children.
                                </div>
                            </div>
                        )}
                        {["actuator", "sensor"].includes(activeApi.type) && (
                            <div>
                                <div className="text-gray-700 py-1 mt-1 flex items-center font-bold text-md">
                                    Sample code to get API value:
                                </div>
                                <ApiCodeBlock
                                    apiName={activeApi.name + ".get()"}
                                    onCopied={() => {
                                        popupState[1](false);
                                    }}
                                />
                            </div>
                        )}
                        {["actuator"].includes(activeApi.type) && (
                            <div>
                                <div className="text-gray-700 py-1 mt-1 flex items-center font-bold text-md">
                                    Sample code to Set API:
                                </div>
                                <ApiCodeBlock
                                    apiName={activeApi.name + ".set(value)"}
                                    onCopied={() => {
                                        popupState[1](false);
                                    }}
                                />
                            </div>
                        )}
                        {["actuator", "sensor"].includes(activeApi.type) && (
                            <div>
                                <div className="text-gray-700 py-1 mt-1 flex items-center font-bold text-md">
                                    Sample code to subscrible for API value change:
                                </div>
                                <ApiCodeBlock
                                    apiName={activeApi.name + ".subscribe(function_name)"}
                                    onCopied={() => {
                                        popupState[1](false);
                                    }}
                                />
                            </div>
                        )}

                        <div className="flex mt-2">
                            <div className="flex text-sm text-gray-800 w-fit h-8 px-2 mr-2 rounded select-none justify-center items-center">
                                <TbTag className="mr-1" />
                                Tags
                            </div>
                            {apiTags.length > 0 && (
                                <div className="flex flex-wrap select-none">
                                    {apiTags.map((tag, index) => (
                                        <TagChip key={index} categoryAndTag={tag} loading={false} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <ApiDiscussion
                            api={activeApi.name}
                            onDiscussionLoaded={(numOfDiscuss: any) => {
                                setNoOfDiscuss(numOfDiscuss);
                            }}
                        />
                    </div>
                </div>
            )}
            <div className="flex mt-3">
                <div className="grow"></div>
                <Button
                    variant="blue"
                    className="px-4 py-2"
                    onClick={() => {
                        popupState[1](false);
                    }}
                >
                    Close
                </Button>
            </div>
        </div>
    );
};

export default APIDetails;
