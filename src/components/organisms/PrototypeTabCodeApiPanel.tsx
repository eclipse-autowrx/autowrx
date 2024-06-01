import { FC, useState, useEffect } from "react"
import DaPopup from "../atoms/DaPopup"
import { shallow } from "zustand/shallow";
import useModelStore from '@/stores/modelStore'
import { DaText } from "../atoms/DaText";
import { DaApiListItem } from "../molecules/DaApiList";
import ModelApiList from "./ModelApiList";
import { TbCopy } from "react-icons/tb";
import { copyText, getApiTypeClasses } from "@/lib/utils";

interface ApiCodeBlockProps {
    apiName: string;
    onCopied: () => void;
}

const ApiCodeBlock = ({ apiName, onCopied }: ApiCodeBlockProps) => {
    const [code, setCode] = useState<any>(null);
    useEffect(() => {
        setCode(`await v${apiName.substring(1)}`);
    }, [apiName]);
    return (
        <div className="flex px-3 py-3 bg-da-gray-light rounded font-mono ">
            <div className="grow pre-wrap da-label-small">{code}</div>
            <div
                className="px-2 cursor-pointer text-da-primary-500 hover:opacity-80"
                onClick={() => {
                    copyText(code);
                    // triggerSnackbar("Copied to clipboard");
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

interface APIDetailsProps {
    activeApi: any
    requestCancel?: () => void
}

const APIDetails: FC<APIDetailsProps> = ({ activeApi, requestCancel }) => {
    return <div className="flex flex-col">
        {activeApi && (
            <div className="flex flex-col w-full">
                <div className="text-da-gray-dark py-1 flex items-center da-label-sub-title border-b border-da-gray-medium">
                    <div
                        className="flex items-center grow cursor-pointer"
                        onClick={() => copyText(activeApi.api, `Copied "${activeApi.api}" to clipboard.`)}
                    >
                        {activeApi.api}
                        <TbCopy className="w-5 h-5 ml-1" />
                    </div>
                    <div className={getApiTypeClasses(activeApi.type).textClass}>{activeApi.type.toUpperCase()}</div>
                </div>
                <div className="max-h-[500px] px-2 overflow-y-auto scroll-gray">
                    {["branch"].includes(activeApi.type) && (
                        <div>
                            <div className="mt-4 text-da-gray-dark py-1 mt-1 flex items-center da-label-regular">
                                This is branch node, branch include a list of child API. You can not call a branch
                                in python code, please select its children.
                            </div>
                        </div>
                    )}
                    {["actuator", "sensor"].includes(activeApi.type) && (
                        <div>
                            <div className="mt-4  text-da-gray-dark py-1 mt-1 flex items-center da-label-regular">
                                Sample code to get API value:
                            </div>
                            <ApiCodeBlock
                                apiName={activeApi.api + ".get()"}
                                onCopied={() => {
                                    if (requestCancel) requestCancel()
                                }}
                            />
                        </div>
                    )}
                    {["actuator"].includes(activeApi.type) && (
                        <div>
                            <div className="mt-4 text-da-gray-dark py-1 mt-1 flex items-center da-label-regular">
                                Sample code to Set API:
                            </div>
                            <ApiCodeBlock
                                apiName={activeApi.api + ".set(value)"}
                                onCopied={() => {
                                    if (requestCancel) requestCancel()
                                }}
                            />
                        </div>
                    )}
                    {["actuator", "sensor"].includes(activeApi.type) && (
                        <div>
                            <div className="text-da-gray-dark py-1 mt-1 flex items-center da-label-regular">
                                Sample code to subscrible for API value change:
                            </div>
                            <ApiCodeBlock
                                apiName={activeApi.api + ".subscribe(function_name)"}
                                onCopied={() => {
                                    if (requestCancel) requestCancel()
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
}

interface PrototypeTabCodeApiPanelProps {
    code: string
}

const PrototypeTabCodeApiPanel: FC<PrototypeTabCodeApiPanelProps> = ({ code }) => {
    const [activeModelApis] = useModelStore((state) => [
        state.activeModelApis
    ], shallow)

    const [useApis, setUseApis] = useState<any[]>([])
    const [activeApi, setActiveApi] = useState<any>()
    const popupApi = useState<boolean>(false)

    useEffect(() => {
        if (!code || !activeModelApis || activeModelApis.length === 0) {
            setUseApis([]);
            return;
        }
        let useList: any[] = [];
        activeModelApis.forEach((item: any) => {
            if (code.includes(item.shortName)) {
                useList.push(item);
            }
        });
        console.log("useList", useList)
        setUseApis(useList);
    }, [code, activeModelApis]);

    const onApiClicked = (api: any) => {
        if (!api) return
        setActiveApi(api)
        popupApi[1](true)
    }

    return <>
        <DaPopup state={popupApi} width={"680px"} trigger={<span></span>}>
            <APIDetails activeApi={activeApi} requestCancel={() => { popupApi[1](false) }} />
        </DaPopup>
        <DaText variant='sub-title' className='px-4 mt-2'>
            Used APIs({useApis.length})
        </DaText>
        {useApis && useApis.length > 0 && (
            <div className="mb-2">

                <div className="flex flex-col w-full px-6 scroll-gray">
                    <div className="max-h-[150px] mt-2 overflow-y-auto scroll-gray">
                        {useApis.map((item: any, index: any) => (
                            <DaApiListItem
                                key={index}
                                api={item}
                                onClick={() => { onApiClicked(item) }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}
        <DaText variant='sub-title' className='px-4 mt-2'>
            All APIs
        </DaText>
        <div className='grow overflow-hidden'>
            <ModelApiList onApiClick={onApiClicked} />
        </div>
    </>
}

export default PrototypeTabCodeApiPanel