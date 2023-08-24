import { doc, updateDoc } from "firebase/firestore"
import { useState } from "react"
import { VscEdit } from "react-icons/vsc"
import { REFS } from "../../../apis/firebase"
import useCurrentPrototype from "../../../hooks/useCurrentPrototype"
import { useCurrentProtototypePermissions } from "../../../permissions/hooks"
import Button from "../../../reusable/Button"
import SelectMedia from "../EditPrototype/SelectMedia"
import DisplayImage from "../PrototypeOverview/DisplayImage"

const DisplayPrototypeImage = () => {
    const prototype = useCurrentPrototype()
    const selectImageMedia = useState(false)
    const canEdit = useCurrentProtototypePermissions().canEdit()

    if (typeof prototype === "undefined") {
        return null
    }
    
    return (
        <div className="flex w-full h-full relative">
            {canEdit && (
                <div className="absolute top-3 right-3 z-10">
                    <Button className="pl-1" onClick={() => selectImageMedia[1](true)}>
                        <VscEdit className="text-3xl" style={{transform: "scale(0.55)", marginRight: "2px"}}/>
                        <div>Edit</div>
                    </Button>
                </div>
            )}
            <DisplayImage image_file={prototype.image_file} />
            <SelectMedia
            filter={["image"]}
            state={selectImageMedia}
            selectMedia={async media => {
                await updateDoc(doc(REFS.prototype, prototype.id), {
                    image_file: media.imageUrl
                })
                window.location.reload()
            }}
            />
        </div>
    )
}

export default DisplayPrototypeImage