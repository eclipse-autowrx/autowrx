import clsx from "clsx"
import { Model } from "../../../../apis/models"
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel"
import LinkWrap from "../../../../reusable/LinkWrap"
import WIPPopup from "../../WIPPopup"
import { REFS } from "../../../../apis/firebase"
import Button from "../../../../reusable/Button"
import SelectAndDisplayImage from "../../PrototypeOverview/SelectAndDisplayImage"
import permissions from "../../../../permissions"
import useCurrentUser from "../../../../reusable/hooks/useCurrentUser"
import { HiCheck, HiPencil } from "react-icons/hi"
import { useState } from "react"
import Input from "../../../../reusable/Input/Input"
import { saveModelName } from "../../../../apis"

interface FeatureBoxProps {
    title: string
    description: string
    to: string
    wip?: boolean
}

const FeatureBox = ({to, title, description, wip}: FeatureBoxProps) => {
    const inner = (
        <div className={clsx(
            "flex flex-col w-full py-5 px-4 rounded border border-gray-300 select-none h-full justify-center",
            "hover:bg-aiot-blue/10 hover:border-aiot-blue transition duration-300 cursor-pointer"
        )}>
            <div className="flex text-xl mb-2">{title}</div>
            <div className="text-gray-600">{description}</div>
        </div>
    )

    return wip ? (
        <WIPPopup trigger={(
            <div className="mb-4">{inner}</div>
        )} />
        
    ) : (
        <LinkWrap to={to} className="mb-4">{inner}</LinkWrap>
    )
}

const ModelHome = () => {
    const {profile} = useCurrentUser()
    const model = useCurrentModel() as Model
    const [editingModelName, setEditingModelName] = useState(false)
    const [editingInput, setEditingInput] = useState(model.name)

    return (
        <div className="flex h-full w-full">
            <div className="flex flex-col h-full w-3/6 p-6">
                <div className="flex text-4xl mb-8 items-center relative">
                    {editingModelName ? (
                        <Input containerClassName="mr-3 text-lg" state={[editingInput, setEditingInput]} />
                    ) : (
                        <div>{model.name}</div>
                    )}
                    {permissions.TENANT(profile).canEdit() && (
                        editingModelName ? (
                            <Button
                            className="ml-auto py-1 h-full"
                            onClick={async () => {
                                await saveModelName(model.id, editingInput)
                                window.location.reload()
                            }}>
                                <HiCheck className="text-3xl" />
                            </Button> 
                        ) : (
                            <Button
                            className="ml-auto py-1 absolute right-0"
                            onClick={() => {
                                setEditingModelName(true)
                            }}>
                                <HiPencil className="text-3xl" />
                            </Button>    
                        )
                    )}
                </div>
                <div className="flex flex-col h-full">
                    <FeatureBox to={`/model/${model.id}/cvi`} title="Vehicle APIs" description="Browse, explore and enhance the catalogue of Connected Vehicle Interfaces" />
                    <FeatureBox to={`/model/${model.id}/library`} title="Prototype Library" description="Build up, evaluate and prioritize your portfolio of connected vehicle applications" />
                </div>
            </div>
            <div className="flex h-full w-3/6 relative">
                <SelectAndDisplayImage
                canEdit={permissions.MODEL(profile, model).canEdit}
                db={REFS.model}
                object={model}
                object_key="model_home_image_file"
                />
            </div>
        </div>
    )
}

export default ModelHome