import { doc, setDoc } from "firebase/firestore"
import { getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { getStorageRef, REFS } from "../../apis/firebase";
import { TENANT_ID } from "../../constants";

const generateMediaChange = ({setProgress, refreshCounter, setRefreshCounter}: {
    setProgress: (progress: number | null) => void
    refreshCounter: number
    setRefreshCounter: (refreshCounter: number) => void
}) => {
    const changeMediaInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        e.preventDefault()
        const file = e.target.files?.[0]
    
        if (!file) return;
    
        const storageRef = getStorageRef(`media/${file.name}`)
        const uploadTask = uploadBytesResumable(storageRef, file);
    
        uploadTask.on("state_changed",
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setProgress(progress)
            },
            (error) => {
                alert(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                    setProgress(null)
                    await setDoc(doc(REFS.media, TENANT_ID), {
                        media: {
                            [file.name]: {
                                filename: file.name,
                                imageUrl: downloadURL,
                                thumbnailUrl: downloadURL,
                                type: file.type.includes("image") ? "image" : "model",    
                            }
                        }
                    }, {merge: true})
                    setRefreshCounter(refreshCounter + 1)
                });
            }
        );
    }

    return changeMediaInput
}

export default generateMediaChange