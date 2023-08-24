import { CollectionReference, deleteField, doc, DocumentData, updateDoc } from "firebase/firestore"
import { FiUpload } from "react-icons/fi"
import { HiX } from "react-icons/hi"
import { Model, Prototype } from "../../../apis/models"
import Button from "../../../reusable/Button"
import SelectMedia from "../EditPrototype/SelectMedia"
import DisplayImage from "./DisplayImage"

type SelectAndDisplayImageProps<Object extends Prototype | Model> = {
    db: CollectionReference<DocumentData>
    object: Object
    object_key: keyof Object
    canEdit: () => boolean
    disableNoImagePlaceholder?: boolean
}

const SelectAndDisplayImage = <Object extends Prototype | Model>({db, object, object_key, canEdit, disableNoImagePlaceholder}: SelectAndDisplayImageProps<Object>) => {
    return (
        <div className="flex h-full w-full">
            <DisplayImage image_file={(object[object_key] as any) ?? ""} disableNoImagePlaceholder={disableNoImagePlaceholder} maxHeight={2000} />
            {canEdit() && (
                <div className="flex absolute right-3 top-3">
                    {(object[object_key] ?? "") === "" && (
                        <Button className="pl-3 py-1 w-fit mr-2" onClick={async () => {
                            await updateDoc(doc(db, object.id), {
                                [object_key]: deleteField()
                            })
                            window.location.reload()                    
                        }}>
                            <HiX/>
                        </Button>
                    )}
                    <SelectMedia
                    trigger={
                        <Button className="pl-3 py-1">
                            <FiUpload className="mr-2"/>Attach Image
                        </Button>
                    }
                    filter={["image"]}
                    selectMedia={async media => {
                        await updateDoc(doc(db, object.id), {
                            [object_key]: media.imageUrl
                        })
                        window.location.reload()
                    }}
                    />
                </div>
            )}
        </div>
    )
}

export default SelectAndDisplayImage