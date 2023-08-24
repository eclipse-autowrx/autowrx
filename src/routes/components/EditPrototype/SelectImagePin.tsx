import clsx from "clsx"
import { useState } from "react"
import { MdWrongLocation } from "react-icons/md"
import { ImagePin, MediaFile } from "../../../apis/models"
import Button from "../../../reusable/Button"
import SideNav from "../../../reusable/SideNav/SideNav"
import SelectImagePinButtons from "./SelectImagePinButtons"
import SelectPinsOnImage, { ImagePins } from "./SelectPinsOnImage"

interface SelectImagePinProps {
    selectMedia: (filename: MediaFile, pins?: ImagePins) => Promise<void>
    selectedImage: MediaFile | null
    selectPinNav: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const SelectImagePin = ({selectMedia, selectedImage, selectPinNav}: SelectImagePinProps) => {
    const [pins, setPins] = useState<ImagePins>({})
    const [selectedPin, setSelectedPin] = useState<ImagePin | undefined>(undefined)
    const [loading, setLoading] = useState(false)

    return (
        <SideNav trigger={<></>} state={selectPinNav} className="h-full">
            {selectedImage && (
                <div className="flex flex-col p-5 w-full h-full">
                    <SelectPinsOnImage image={selectedImage} pinsState={[pins, setPins]} />
                    <SelectImagePinButtons
                    loadingState={[loading, setLoading]}
                    selectedPinState={[selectedPin, setSelectedPin]}
                    confirmMedia={async () => {
                        setLoading(true)
                        await selectMedia(selectedImage, pins)
                        setLoading(false)
                    }}
                    />
                </div>
            )}
        </SideNav>
    )
}

export default SelectImagePin