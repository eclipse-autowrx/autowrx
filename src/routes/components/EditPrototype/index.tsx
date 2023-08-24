import { FC, useState } from "react"
import { MdImage } from "react-icons/md"
import { MediaFile, Prototype } from "../../../apis/models"
import Button from "../../../reusable/Button"
import Input from "../../../reusable/Input/Input"
import DisplayImage from "../PrototypeOverview/DisplayImage"
import SelectMedia from "./SelectMedia"
import { useNavigate } from "react-router-dom"
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel"

interface EditPrototypeProps {
    prototype: Prototype
    updatePrototypes: () => void
}

const EditPrototype: FC<EditPrototypeProps> = ({prototype, updatePrototypes}) => {
    const State = {
        selectedMedia: useState<MediaFile | undefined>(),
        name: useState(prototype?.name ?? "")
    }
    
    const selectMediaPopup = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const navigate = useNavigate()
    const model = useCurrentModel()

    const onSubmit = async () => {
        setSubmitting(true)
        setSubmitting(false)
        updatePrototypes()
        navigate(`/model/${model?.id}/library/prototype/${prototype.id}`)
    }

    return (
        <div className="flex flex-col h-full">
            {typeof prototype === "undefined" ? (
                <div className="px-4 py-2 text-gray-600 select-none">New Prototype</div>
            ) : (
                <div className="px-4 py-2 text-gray-600 select-none">Editing <strong>{prototype?.name}</strong></div>
            )}
            {((typeof prototype === "undefined" || prototype.image_file === "") && typeof State.selectedMedia[0] === "undefined") ? (
                <div
                className="flex h-48 bg-gray-100 items-center justify-center cursor-pointer"
                onClick={() => selectMediaPopup[1](true)}
                >
                    <MdImage className="text-gray-400 text-5xl" />
                </div>
            ) : (
                <div className="relative flex cursor-pointer" onClick={() => selectMediaPopup[1](true)}>
                    <div className="opacity-50">
                        <DisplayImage image_file={State.selectedMedia[0]?.imageUrl ?? prototype?.image_file ?? ""} />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50 flex items-center justify-center">
                        <MdImage className="text-gray-400 text-5xl" />
                    </div>
                </div>
            )}
            <SelectMedia
            filter={["image"]}
            state={selectMediaPopup}
            selectMedia={async media => State.selectedMedia[1](media)}
            />
            <div className="flex flex-col p-5 flex-1">
                <div className="mb-4">
                    <Input state={State.name} placeholder="Prototype Name" />
                </div>
                <div className="flex-1">
                    <Button className="w-fit py-1 ml-auto text-xl mt-auto" onClick={onSubmit} disabled={submitting}>
                        {typeof prototype === "undefined" ? "Create" : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EditPrototype