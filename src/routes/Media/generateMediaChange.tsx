import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { getStorageRef, REFS } from "../../apis/firebase";
import { TENANT_ID } from "../../constants";
import { useEffect } from "react";
import { MediaFile } from "../../apis/models";

const generateMediaChange = ({
    setProgress,
    refreshCounter,
    setRefreshCounter,
    onNewMediaUpload,
}: {
    setProgress: (progress: number | null) => void;
    refreshCounter: number;
    setRefreshCounter: (refreshCounter: number) => void;
    onNewMediaUpload?: (media: MediaFile) => void;
}) => {
    const changeMediaInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        e.preventDefault();
        const file = e.target.files?.[0];

        if (!file) return;

        const storageRef = getStorageRef(`media/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setProgress(progress);
            },
            (error) => {
                alert(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                    setProgress(null);
                    const media: MediaFile = {
                        filename: file.name,
                        imageUrl: downloadURL,
                        thumbnailUrl: downloadURL,
                        type: file.type.includes("image") ? "image" : "model",
                    } as MediaFile; // Use type assertion to tell TypeScript that media is a MediaFile
                    await setDoc(doc(REFS.media, TENANT_ID), { media: { [file.name]: media } }, { merge: true });
                    setRefreshCounter(refreshCounter + 1);
                    console.log("image uploaded url" + media); // Log upload imageURL to console
                    if (onNewMediaUpload) onNewMediaUpload(media);
                });
            }
        );
    };

    return changeMediaInput;
};

export default generateMediaChange;
