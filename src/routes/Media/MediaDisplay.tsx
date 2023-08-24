import clsx from "clsx"
import { FC, useState } from "react"
import { Md3DRotation, MdDelete } from "react-icons/md"
import Button from "../../reusable/Button"
import Popup from "../../reusable/Popup/Popup"

interface MediaDisplayProps {
    type: "image" | "model"
    filename: string
    url: string
    deleteMedia?: (filename: string) => void
    onClick?: () => void
}

const MediaDisplay: FC<MediaDisplayProps> = ({type, filename, url, deleteMedia, onClick}) => {
    const popupState = useState(false)
    return (
        <div
        className={clsx(
            "flex flex-col relative rounded-lg overflow-hidden select-none hover:border-aiot-blue transition duration-300 bg-gray-300",
            onClick && "cursor-pointer"
        )}
        style={{maxWidth: 450}}
        onClick={onClick}
        >
            {type === "image" ? (
                <img src={url} alt={filename} className="h-full" style={{objectFit: "contain", maxHeight: 250}} />
            ) : (
                <div className="flex h-full bg-gray-300 justify-center items-center text-5xl text-gray-500">
                    <Md3DRotation/>
                </div>
            )}
            <div className="text-aiot-blue p-2 text-sm border-r border-l border-b border-gray-200 rounded-b-lg bg-white">{filename}</div>
            {deleteMedia && (
                <Popup state={popupState} trigger={
                    <div className="absolute bottom-3 right-2 cursor-pointer transition text-gray-400 hover:text-gray-500">
                        <MdDelete/>
                    </div>
                }>
                    <div className="mb-3">Are you sure you want to delete this file?</div>
                    <Button className="ml-auto py-1 w-fit text-sm" onClick={() => {
                        popupState[1](false)
                        deleteMedia(filename)
                    }}>
                        I'm Sure
                    </Button>
                </Popup>
            )}
        </div>
    )
}

export default MediaDisplay