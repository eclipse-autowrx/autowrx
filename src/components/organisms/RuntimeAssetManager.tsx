import { useState, useEffect } from "react"
import DaText from "../atoms/DaText"
import { useAssets } from '@/hooks/useAssets'
import { IoClose } from "react-icons/io5";
import { TbTrash, TbShare } from "react-icons/tb"
import { DaInput } from "../atoms/DaInput";
import { DaButton } from "../atoms/DaButton";
import ShareAssetPanel from "../molecules/ShareAssetPanel";
import DaPopup from "../atoms/DaPopup";

interface iPropRuntimeAssetManager {
    onClose: () => void,
    onCancel: () => void,
}

const RuntimeAssetManager = ({ onClose, onCancel }: iPropRuntimeAssetManager) => {
    const [myRuntimes, setMyRuntimes] = useState<any[]>([])
    const { useFetchAssets, deleteAsset, createAsset, updateAsset } = useAssets()
    const { data: assets, isLoading, refetch } = useFetchAssets()
    const [activeAsset, setActiveAsset] = useState<any>()
    const [newRtName, setNewRtName] = useState<string>("Runtime-")
    const shareDialogState = useState<boolean>(false)

    useEffect(() => {
        setMyRuntimes(assets?.filter((a: any) => a.type == 'CLOUD_RUNTIME') || [])
    }, [assets])

    return <div className="w-[800px] min-h-[400px] px-2 py-1">
        <div className="flex items-center">
            <DaText
                variant="huge-bold"
                className="text-da-gray-dark font-semibold"
            >
                My Assets
            </DaText>
            <div className="grow"></div>
            <IoClose className="cursor-pointer" size={24} onClick={() => {
                if (onClose) onClose()
            }} />
        </div>

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

        <div className="flex flex-col w-full mt-6 max-h-[400px] overflow-auto">
            <div className="bg-slate-100 w-full px-4 py-2">
                <DaText variant="sub-title">Add new asset</DaText>
                <div className="mt-2 flex items-center">
                    <DaText>Runtime Code:</DaText>
                    <DaInput
                        value={newRtName}
                        onChange={(e) => setNewRtName(e.target.value)}
                        className="flex w-[280px] mx-2"
                        inputClassName="text-sm"
                    />
                    <DaButton disabled={newRtName.trim().length <= 0} className="" onClick={async () => {
                        try {
                            await createAsset.mutateAsync({
                                name: newRtName,
                                type: 'CLOUD_RUNTIME',
                                data: '{}',
                            })
                            setNewRtName('Runtime-')
                            await refetch()
                        } catch (err) {

                        }

                    }}>Add</DaButton>
                </div>
            </div>

            {isLoading && <div className="w-full flex py-4 justify-center items-center">Loading...</div>}

            {!isLoading && <div className="mt-6 w-full">
                <div className="flex w-full items-center text-da-gray-dark font-bold text-lg 
                        py-1 border-b border-da-gray-medium">
                    <div className="grow">Name</div>
                    <div className="w-[200px] min-w-[100px]">Actions</div>
                </div>

                {(!assets || assets.length == 0) && <div
                    className="w-full py-4 italic text-slate-500 text-center">
                    You have no asset</div>
                }

                {
                    assets && assets.length > 0 && assets.map((asset: any, aIndex: number) => <div key={aIndex}
                        className="flex w-full items-center text-da-gray-dark font-normal text-md 
                        py-4 border-b border-da-gray-light">
                        <div className="grow">{asset.name}</div>
                        <div className="w-[200px] min-w-[100px] flex space-x-4">
                            {/* <TbPencil className="text-da-gray-medium cursor-pointer hover:opacity-60" size={24}
                                onClick={() => {
                                    setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                }} /> */}
                            <TbShare className="text-da-gray-medium cursor-pointer hover:opacity-60" size={24}
                                onClick={() => {
                                    setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                    shareDialogState[1](true)
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

export default RuntimeAssetManager