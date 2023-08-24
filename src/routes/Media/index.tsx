import clsx from "clsx"
import { Media as MediaModel, MediaFile } from "../../apis/models"
import Button from "../../reusable/Button"
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh"
import LoadingPage from "../components/LoadingPage"
import MediaDisplay from "./MediaDisplay"
import { FiUpload } from "react-icons/fi"
import { HiPlus } from "react-icons/hi"
import { CircularProgress } from "@mui/material"
import generateMediaChange from "./generateMediaChange"
import { useRef, useState } from "react"
import { getStorageRef, REFS } from "../../apis/firebase"
import { doc } from "firebase/firestore"
import { deleteObject } from "firebase/storage"
import { deleteField, FieldPath, updateDoc } from "firebase/firestore"
import FlexibleGrid from "../../reusable/FlexibleGrid"
import { getMedia } from "../../apis"
import { TENANT_ID } from "../../constants"
import permissions from "../../permissions"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel"
  

const Media = () => {
    const [progress, setProgress] = useState<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [refreshCounter, setRefreshCounter] = useState(0)

    const { isLoggedIn } = useCurrentUser()

    const {value: mediaLibrary, loading} = useAsyncRefresh(async () => {
        return await getMedia()
    }, [refreshCounter])

    if (loading) {
        return <LoadingPage/>
    }


    const triggerUploadMedia = () => {
        inputRef.current?.click()
    }

    const changeMediaInput = generateMediaChange({
        setProgress,
        refreshCounter,
        setRefreshCounter
    })

    const deleteMedia = async (filename: string) => {
        updateDoc(doc(REFS.media, TENANT_ID), new FieldPath("media", filename), deleteField())
        const storageRef = getStorageRef(`media/${filename}`)
        await deleteObject(storageRef)
        setRefreshCounter(refreshCounter + 1)

    }

    return (
        <div className="flex flex-col">
            {isLoggedIn && (
                <>
                    <input
                    type="file"
                    style={{display: "none"}}
                    ref={inputRef}
                    accept=".png,.jpg,.jpeg,.glb"  
                    onChange={changeMediaInput}
                    />
                    <div className="flex px-5 ml-auto">
                        <Button className={clsx("w-fit py-1", progress !== null && "pointer-events-none")} onClick={triggerUploadMedia}>
                            {progress === null ? (
                                <>
                                    <FiUpload className="mr-2"/>Upload Media
                                </>
                            ) : (
                                <>
                                    <CircularProgress variant="determinate" value={progress} size="1em" className="m-auto mr-2" />Uploading
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}
            <FlexibleGrid>
                {typeof mediaLibrary === "undefined" ? [] : (
                    Object.values(mediaLibrary).map(media => (
                        <MediaDisplay
                        key={media.filename}
                        deleteMedia={filename => deleteMedia(filename)}
                        type={media.type}
                        filename={media.filename}
                        url={media.imageUrl}
                        />
                    ))
                )}
                {isLoggedIn && (
                    <div
                    className={clsx(
                        "flex rounded-lg border-4 border-dashed items-center justify-center text-gray-200 hover:border-gray-300 hover:text-gray-300 cursor-pointer transition",
                        progress !== null && "bg-gray-50 pointer-events-none"
                    )}
                    onClick={triggerUploadMedia}
                    >
                        <HiPlus className="text-5xl" />
                    </div>
                )}
            </FlexibleGrid>
        </div>
    )
}

export default Media