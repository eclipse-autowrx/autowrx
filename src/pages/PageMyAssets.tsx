import DaText from "@/components/atoms/DaText"
import { useEffect, useState } from "react"
import { useAssets } from '@/hooks/useAssets'
import { TbTrash, TbPencil } from "react-icons/tb"
import DaPopup from '../components/atoms/DaPopup'
import { DaButton } from "@/components/atoms/DaButton"
import { DaInput } from "@/components/atoms/DaInput"
import { DaTextarea } from "@/components/atoms/DaTextarea"
import { DaSelect, DaSelectItem } from "@/components/atoms/DaSelect"
import { useToast } from "@/components/molecules/toaster/use-toast"
import { IoAddCircleOutline } from "react-icons/io5";

interface iPropEditAssetDialog {
    asset: any,
    onCancel: () => void,
    onDone: () => void,
}

const EditAssetDialog = ({ asset, onDone, onCancel }: iPropEditAssetDialog) => {
    const [name, setName] = useState<any>("")
    const [type, setType] = useState<any>("")
    const [dataStr, setDataStr] = useState<any>("")

    const { createAsset, updateAsset, shareMyAsset, getAssetById } = useAssets()
    const { toast } = useToast()

    const ASSET_TYPES = [
        { name: 'CLOUD_RUNTIME', helperText: "Runtime on cloud to execute your app" },
        { name: 'HARDWARE_KIT', helperText: "Hardware setup to get deploy app" }
    ]

    const [readOnlyUsers, setReadOnlyUsers] = useState<any[]>([])

    useEffect(() => {
        setName(asset?.name || '')
        setType(asset?.type || 'CLOUD_RUNTIME')
        try {
            setDataStr(JSON.stringify(JSON.parse(asset?.data), null, 4) || '{}')
        } catch (e) {
            setDataStr(`${asset?.data}` || '{}')
        }
        if(asset.id) {
            getAssetInfo()
        }
    }, [asset])

    const getAssetInfo = async () => {
        let items = [] as any
        try {
            let data = await getAssetById(asset.id)
            console.log('listAllUserForAsset', data)
            if(data && data.readAccessUsers) {
                items = data.readAccessUsers
            }
        } catch(e) {
            console.log(`Error on listAllUserForAsset`, e)
        }
        setReadOnlyUsers(items)
    }

    return <div className="flex flex-col w-[480px] px-4">
        <DaText variant="title">Edit Asset</DaText>
        <div className="w-full min-h-[200px]">
            <div className="flex items-center space-x-2 mt-4">
                <DaText className="w-20">Name *</DaText>
                <DaInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex grow"
                    inputClassName="text-sm"
                />
            </div>

            <div className="flex items-center space-x-2 mt-4">
                <DaText className="w-20">Type *</DaText>
                <DaSelect
                    wrapperClassName="grow"
                    className="h-10 border border-gray-200 !shadow-none"
                    defaultValue="CLOUD_RUNTIME"
                    value={type}
                    onValueChange={(value) => setType(value)}
                >
                    {ASSET_TYPES && ASSET_TYPES.map((type: any, tIndex: number) => <DaSelectItem
                        helperText={type.helperText}
                        key={tIndex}
                        value={type.name}
                    >
                        <DaText className="da-label-small text-da-gray-dark">
                            {type.name}
                        </DaText>
                    </DaSelectItem>)}
                </DaSelect>
            </div>

            {/* <div className="flex items-center space-x-2 mt-4">
                <DaText className="w-20">Option</DaText>
                <DaTextarea
                    value={dataStr}
                    onChange={(e: any) => setDataStr(e.target.value)}
                    className="grow"
                    textareaClassName="!text-sm h-40"
                />
            </div> */}

            <div>
                <DaText>Share to:</DaText>
                <div>
                    
                </div>
            </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
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
    // useEffect(() => {
    //     console.log(`assets`, assets)
    // }, [assets])

    return <div className="flex w-full h-full bg-slate-200 p-2">
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
                            type: 'CLOUD_RUNTIME',
                            data: ''
                        })
                        editDialogState[1](true)
                    }}>
                    <IoAddCircleOutline size={24} className="mr-2"/>
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

            {isLoading && <div className="w-full flex py-4 justify-center items-center">Loading...</div>}

            {!isLoading && <div className="mt-6 w-full">
                <div className="flex w-full items-center text-da-gray-dark font-bold text-lg 
                                    py-1 border-b border-da-gray-medium">
                    <div className="grow">Name</div>
                    <div className="w-[200px] min-w-[100px]">Type</div>
                    <div className="w-[200px] min-w-[100px]">Actions</div>
                </div>

                { (!assets || assets.length==0) && <div 
                    className="w-full py-4 italic text-slate-500 text-center">
                        You have no asset</div>
                }

                {
                    assets && assets.length > 0 && assets.map((asset: any, aIndex: number) => <div key={aIndex}
                        className="flex w-full items-center text-da-gray-dark font-normal text-md 
                                    py-4 border-b border-da-gray-light">
                        <div className="grow">{asset.name}</div>
                        <div className="w-[200px] min-w-[100px]">{asset.type}</div>
                        <div className="w-[200px] min-w-[100px] flex space-x-2">
                            <TbPencil className="text-da-gray-medium cursor-pointer hover:opacity-60" size={24}
                                onClick={() => {
                                    setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                    editDialogState[1](true)
                                }} />
                            <TbTrash className="text-red-500 cursor-pointer hover:opacity-60" size={24}
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
            }
        </div>
    </div>
}

export default PageMyAssets