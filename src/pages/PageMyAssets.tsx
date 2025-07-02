// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import DaText from "@/components/atoms/DaText"
import { useEffect, useState } from "react"
import { useAssets } from '@/hooks/useAssets'
import { TbTrash, TbPencil, TbShare } from "react-icons/tb"
import DaPopup from '../components/atoms/DaPopup'
import { DaButton } from "@/components/atoms/DaButton"
import { DaInput } from "@/components/atoms/DaInput"
import { DaSelect, DaSelectItem } from "@/components/atoms/DaSelect"
import { useToast } from "@/components/molecules/toaster/use-toast"
import { IoAddCircleOutline } from "react-icons/io5";
import ShareAssetPanel from "@/components/molecules/ShareAssetPanel"
import { DaTextarea } from "@/components/atoms/DaTextarea"

interface iPropEditAssetDialog {
    asset: any,
    onCancel: () => void,
    onDone: () => void,
}

interface iPropGenAIPython {
    dataStr: string,
    onDataChange: (v:string) => void,
}

const ASSET_BARE_TYPES = [
    {
        name: 'Runtime',
        value: 'CLOUD_RUNTIME',
        helperText: "Runtime on cloud to execute your app" 
    },
    {
        name: 'Hardware Kit',
        value: 'HARDWARE_KIT',
        helperText: "Hardware setup to get deploy app"
    },
    {
        name: 'Python genAI',
        value: 'GENAI-PYTHON',
        helperText: "genAI endpoint to gen Python QM App"
    }
]

const ASSET_TYPES = [
    {
        name: 'All',
        value: 'all',
        helperText: ''
    },
    ...ASSET_BARE_TYPES
]

const PythonGenAIEditor = ({dataStr, onDataChange}: iPropGenAIPython) => {

    const [method, setMethod] = useState('')
    const [url, setUrl] = useState('')
    const [accessToken, setAccessToken] = useState('')
    const [requestField, setRequestField] = useState('')
    const [responseField, setResponseField] = useState('')

    const sampleDataStr = {
        method: "POST",
        url: "",
        accessToken: "Bear ",
        requestField: "prompt",
        responseField: "data"
    }

    useEffect(() => {
        try {
            let data = JSON.parse(dataStr||JSON.stringify(sampleDataStr))
            setRequestField(data.requestField || '')
            setResponseField(data.responseField || '')
            setMethod(data.method || '')
            setUrl(data.url||'')
            setAccessToken(data.accessToken||'')
        } catch(e) {}
    }, [dataStr])

    const onUrlChange = (value: string) => {
        onDataChange(JSON.stringify({
            method: method,
            url: value || '',
            accessToken: accessToken,
            requestField: requestField,
            responseField: responseField
        }, null, 4))
    }

    const onAccessTokenChange = (value: string) => {
        onDataChange(JSON.stringify({
            method: method,
            url: url,
            accessToken: value || '',
            requestField: requestField,
            responseField: responseField
        }, null, 4))
    }

    const onMethodChange = (value: string) => {
        onDataChange(JSON.stringify({
            method: value || '',
            url: url,
            accessToken: accessToken,
            requestField: requestField,
            responseField: responseField
        }, null, 4))
    }

    const onRequestFieldChange = (value: string) => {
        onDataChange(JSON.stringify({
            method: method,
            url: url,
            accessToken: accessToken,
            requestField: value || '',
            responseField: responseField
        }, null, 4))
    }

    const onResponseFieldChange = (value: string) => {
        onDataChange(JSON.stringify({
            method: method,
            url: url,
            accessToken: accessToken,
            requestField: requestField,
            responseField: value || ''
        }, null, 4))
    }

    return <div>

        <div className="flex items-center space-x-2 mt-4">
            <DaText variant="small"  className="w-20">Method *:</DaText>
            <div className="grow"> 
                <DaInput
                    value={method}
                    onChange={(e) => onMethodChange(e.target.value)}
                    className="flex grow"
                    inputClassName="text-[14px]"
                />
            </div>
            
        </div>

        <div className="flex items-center space-x-2 mt-4">
            <DaText variant="small"  className="w-20">URL *:</DaText>
            <div className="grow"> 
                <DaTextarea
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    className="flex grow"
                    textareaClassName="!text-[14px] !leading-tight"
                />
            </div>
        </div>
        

        <div className="flex items-center space-x-2 mt-4">
            <DaText variant="small"  className="w-20">Access Token *</DaText>
            <div className="grow"> 
                <DaTextarea
                    value={accessToken}
                    onChange={(e) => onAccessTokenChange(e.target.value)}
                    className="flex grow"
                    textareaClassName="!text-[14px] !leading-tight"
                />
                <div className=" text-sm mt-1 text-da-gray-dark">* Notice: This token will be sent in the Authorization header.</div>
            </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
            <DaText variant="small"  className="w-20">Request field *</DaText>
            <div className="grow"> 
                <DaTextarea
                    value={requestField}
                    onChange={(e) => onRequestFieldChange(e.target.value)}
                    className="flex grow"
                    textareaClassName="!text-[14px] !leading-tight"
                />
            </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
            <DaText variant="small"  className="w-20">Response field *</DaText>
            <div className="grow"> 
                <DaTextarea
                    value={responseField}
                    onChange={(e) => onResponseFieldChange(e.target.value)}
                    className="flex grow"
                    textareaClassName="!text-[14px] !leading-tight"
                />
            </div>
        </div>
        
    </div>
    
}



const EditAssetDialog = ({ asset, onDone, onCancel }: iPropEditAssetDialog) => {
    const [name, setName] = useState<any>("")
    const [type, setType] = useState<any>("")
    const [dataStr, setDataStr] = useState<any>("")
    const { createAsset, updateAsset } = useAssets()
    const { toast } = useToast()

    // const ASSET_TYPES = [
    //     { name: 'CLOUD_RUNTIME', helperText: "Runtime on cloud to execute your app" },
    //     { name: 'HARDWARE_KIT', helperText: "Hardware setup to get deploy app" }
    // ]

    // const [readOnlyUsers, setReadOnlyUsers] = useState<any[]>([])

    useEffect(() => {
        setName(asset?.name || '')
        setType(asset?.type || 'CLOUD_RUNTIME')
        setDataStr(asset?.data || '')
    }, [asset])

    return <div className="flex flex-col w-[540px] px-4">
        <DaText variant="title">Edit Asset</DaText>
        <div className="w-full min-h-[200px]">
            <div className="flex items-center space-x-2 mt-4">
                <DaText variant="small"  className="w-20">Name *</DaText>
                <DaInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex grow"
                    inputClassName="text-[14px]"
                />
            </div>

            <div className="flex items-center space-x-2 mt-4">
                <DaText variant="small" className="w-20">Type *</DaText>
                <DaSelect
                    wrapperClassName="grow"
                    className="h-10 border border-gray-200 !shadow-none text-[14px]"
                    defaultValue="CLOUD_RUNTIME"
                    value={type}
                    onValueChange={(value) => setType(value)}
                >
                    {ASSET_BARE_TYPES && ASSET_BARE_TYPES.map((type: any, tIndex: number) => <DaSelectItem
                        helperText={type.helperText}
                        key={tIndex}
                        value={type.value}
                    >
                        <DaText className="da-label-small text-da-gray-dark">
                            {type.value}
                        </DaText>
                    </DaSelectItem>)}
                </DaSelect>
            </div>

            { type == 'GENAI-PYTHON' && <PythonGenAIEditor dataStr={dataStr} onDataChange={setDataStr}/> }

            {/* <div className="flex items-center space-x-2 mt-4">
                <DaText className="w-20">Option</DaText>
                <DaTextarea
                    value={dataStr}
                    onChange={(e: any) => setDataStr(e.target.value)}
                    className="grow"
                    textareaClassName="!text-sm h-40"
                />
            </div> */}


        </div>

        <div className="flex justify-end space-x-2 mt-6">
            <DaButton className="w-32" variant="outline" onClick={() => {
                if (onCancel) onCancel()
            }}>
                Cancel
            </DaButton>

            <DaButton className="w-32" variant="solid" onClick={async () => {
                try {
                    if (!name || !type) {
                        toast({
                            title: `Invalid info`,
                            description: (
                                <DaText variant="small" className="flex items-center text-red-500">
                                    Missing "name", please enter name and try again!
                                </DaText>
                            ),
                            duration: 3000,
                        })
                        return
                    }
                    if (asset.id) {
                        await updateAsset.mutateAsync({
                            id: asset.id,
                            payload: {
                                data: dataStr,
                                type: type,
                                name: name
                            }
                        })
                    } else {
                        await createAsset.mutateAsync({
                            name: name,
                            type: type,
                            data: dataStr,
                        })
                    }

                    if (onDone) {
                        onDone()
                    }
                } catch (e) {
                    toast({
                        title: `Save error`,
                        description: (
                            <DaText variant="small" className="flex items-center text-red-500">
                                Error on save asset
                            </DaText>
                        ),
                        duration: 3000,
                    })
                }

            }}>
                Save
            </DaButton>
        </div>
    </div>
}

const PageMyAssets = () => {

    const { useFetchAssets, deleteAsset } = useAssets()
    const { data: assets, isLoading } = useFetchAssets()
    const [activeAsset, setActiveAsset] = useState<any>()
    const editDialogState = useState<boolean>(false)
    const shareDialogState = useState<boolean>(false)

    const [activeTab, setActiveTab] = useState(ASSET_TYPES[0].value);
    const [filteredAssets, setFilteredAssets] = useState([])

    useEffect(() => {
        if (!assets) {
            setFilteredAssets([])
            return
        }
        let tmpAssets = JSON.parse(JSON.stringify(assets))
        if (activeTab === 'all') {
            setFilteredAssets(tmpAssets)
            return
        }
        setFilteredAssets(tmpAssets.filter((asset: any) =>
            asset.type === activeTab))
    }, [activeTab, assets])

    return <div className="flex w-full min-h-[90vh] bg-slate-200 pt-2 pb-4">
        <div className="flex flex-col container py-4 justify-start items-start bg-white rounded-xl">
            <div className="flex w-full">
                <DaText
                    variant="huge-bold"
                    className="text-da-gray-dark font-semibold"
                >
                    My Assets
                </DaText>
                <div className="grow"></div>
                <DaButton variant="outline"
                    onClick={() => {
                        setActiveAsset({
                            name: '',
                            type: activeTab === 'all' ? ASSET_TYPES[1].value : activeTab,
                            data: ''
                        })
                        editDialogState[1](true)
                    }}>
                    <IoAddCircleOutline size={24} className="mr-2" />
                    Create New Asset
                </DaButton>
            </div>



            <DaPopup state={editDialogState} trigger={<span></span>}>
                <EditAssetDialog asset={activeAsset}
                    onCancel={() => {
                        editDialogState[1](false)
                    }}
                    onDone={() => {
                        editDialogState[1](false)
                    }} />
            </DaPopup>

            <DaPopup state={shareDialogState} trigger={<span></span>}>
                <ShareAssetPanel asset={activeAsset}
                    onCancel={() => {
                        shareDialogState[1](false)
                    }}
                    onDone={() => {
                        shareDialogState[1](false)
                    }}
                />
            </DaPopup>

            {isLoading && <div className="w-full flex py-4 justify-center items-center">Loading...</div>}

            {!isLoading && <>

                <div className="flex w-full mt-2 border-b border-da-gray-medium">
                    {(() => {
                        const assetCounts: { [key: string]: number } = {};
                        if (assets) {
                            ASSET_TYPES.forEach(type => {
                                if (type.value === 'all') {
                                    assetCounts[type.value] = assets.length;
                                } else {
                                    assetCounts[type.value] = assets.filter((asset: any) => asset.type === type.value).length;
                                }
                            });
                        }

                        return ASSET_TYPES.map((type) => (
                            <div
                                key={type.value}
                                className={`
                                    px-4 py-2 cursor-pointer text-lg font-semibold
                                    ${activeTab === type.value
                                    ? 'border-b-2 border-da-primary-500 text-da-primary-500'
                                    : 'text-da-gray-dark hover:text-da-primary-400'
                                }
                                `}
                                onClick={() => setActiveTab(type.value)}
                            >
                                {type.name} {assetCounts[type.value] !== undefined ? `(${assetCounts[type.value]})` : ''}
                            </div>
                        ));
                    })()}
                </div>

                <div className="mt-2 w-full px-4">
                    <div className="flex w-full items-center text-da-gray-medium font-semibold text-sm 
                                        py-1 border-b border-da-gray-medium">
                        <div className="grow">Name</div>
                        <div className="w-[220px] min-w-[220px]">Type</div>
                        <div className="w-[220px] min-w-[220px]">Actions</div>
                    </div>

                    <div className="overflow-auto h-full">

                    {(!assets || assets.length == 0) && <div
                        className="w-full py-4 italic text-slate-500 text-center">
                        You have no asset</div>
                    }

                    {
                        filteredAssets && filteredAssets.length > 0 && filteredAssets.map((asset: any, aIndex: number) => <div key={aIndex}
                            className="flex w-full items-center text-da-gray-dark font-normal text-md 
                                        py-4 border-b border-da-gray-light">
                            <div className="grow">{asset.name}</div>
                            <div className="w-[220px] min-w-[220px] text-xs font-medium text-da-gray-medium font-mono">{asset.type}</div>
                            <div className="w-[220px] min-w-[220px] flex space-x-4">
                                <TbPencil className="text-da-gray-medium cursor-pointer hover:opacity-60" size={22}
                                    onClick={() => {
                                        setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                        editDialogState[1](true)
                                    }} />
                                <TbShare className="text-da-gray-medium cursor-pointer hover:opacity-60" size={22}
                                    onClick={() => {
                                        setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                        shareDialogState[1](true)
                                    }} />
                                <TbTrash className="text-red-500 cursor-pointer hover:opacity-60" size={22}
                                    onClick={async () => {
                                        if (!confirm(`Confirm delete asset '${asset.name}'?`) || !asset.id) {
                                            return
                                        }
                                        await deleteAsset.mutateAsync(asset.id)
                                    }} />
                            </div>
                        </div>)
                    }
                    </div>
                </div>
            </>
            }
        </div>
    </div>
}

export default PageMyAssets