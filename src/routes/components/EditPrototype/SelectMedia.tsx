import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh"
import Popup from "../../../reusable/Popup/Popup"
import { ImagePin, Media as MediaModel, MediaFile } from "../../../apis/models"
import FlexibleGrid from "../../../reusable/FlexibleGrid"
import MediaDisplay from "../../Media/MediaDisplay"
import LoadingPage from "../LoadingPage"
import { FC, useState } from "react"
import SideNav from "../../../reusable/SideNav/SideNav"
import SelectImagePin from "./SelectImagePin"
import { ImagePins } from "./SelectPinsOnImage"
import clsx from "clsx"
import LinkWrap from "../../../reusable/LinkWrap"
import { HiPlus } from "react-icons/hi"
import { getMedia } from "../../../apis"

interface SelectMediaProps {
    trigger?: React.ReactElement
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    selectMedia: (filename: MediaFile, pins?: ImagePins) => Promise<void>
    filter?: ("model" | "image")[]
    supportPins?: boolean
}

const SelectMedia: FC<SelectMediaProps> = ({trigger, state: statePassed, selectMedia, filter, supportPins = false}) => {
    const selfManaged = useState(false)
    const state = statePassed ?? selfManaged

    const {value: mediaLibrary, loading} = useAsyncRefresh(async () => {
        return await getMedia()
    }, [])

    const filteredLibrary = typeof mediaLibrary === "undefined" ? [] : (
        mediaLibrary
        .filter(media => typeof filter === "undefined" || filter.includes((media as MediaFile).type))
    )

    const selectPinNav = useState(false)
    const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null)

    return (
        <>
            <SelectImagePin selectPinNav={selectPinNav} selectedImage={selectedImage} selectMedia={selectMedia} />
            <SideNav trigger={typeof trigger === "undefined" ? <></> : trigger} state={state}>
                {loading ? (
                    <div className="flex w-full h-full items-center justify-center pt-36" style={{width: 490}}>
                        <LoadingPage/>
                    </div>
                ) : (
                    <FlexibleGrid>
                        {typeof mediaLibrary === "undefined" ? [] : (
                            <>
                                {filteredLibrary.map(media => (
                                    <MediaDisplay
                                    key={media.filename}
                                    type={media.type}
                                    filename={media.filename}
                                    url={media.imageUrl}
                                    onClick={() => {
                                        if (media.type === "image") {
                                            if (supportPins) {
                                                state[1](false)
                                                selectPinNav[1](true)
                                                setSelectedImage(media)    
                                            } else {
                                                state[1](false)
                                                selectMedia((media as MediaFile))    
                                            }
                                        } else {
                                            state[1](false)
                                            selectMedia((media as MediaFile))
                                        }
                                    }}
                                    />
                                ))}
                                <a href="/media" target="_blank">
                                    <div
                                    style={{height: 250}}
                                    className={clsx(
                                        "flex mt-3 rounded-lg border-4 border-dashed items-center justify-center text-gray-200 hover:border-gray-300 hover:text-gray-300 cursor-pointer transition",
                                    )}
                                    >
                                        <HiPlus className="text-5xl" />
                                    </div>
                                </a>
                            </>
                        )}
                    </FlexibleGrid>
                )}
            </SideNav>
        </>
    )
}

export default SelectMedia