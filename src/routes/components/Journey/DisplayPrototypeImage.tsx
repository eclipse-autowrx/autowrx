import { doc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { VscEdit } from "react-icons/vsc";
import { REFS } from "../../../apis/firebase";
import { TbPhotoEdit } from "react-icons/tb";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { useCurrentProtototypePermissions } from "../../../permissions/hooks";
import Button from "../../../reusable/Button";
import SelectMedia from "../EditPrototype/SelectMedia";
import DisplayImage from "../PrototypeOverview/DisplayImage";
import CustomDisplayImage from "../PrototypeOverview/CustomDisplayImage";

interface DisplayPrototypeImageProps {
    isCustom?: boolean;
    isEdit?: boolean;
}
interface MediaType {
    imageUrl: string;
    // Add other properties of media if they exist
}

const DisplayPrototypeImage: React.FC<DisplayPrototypeImageProps> = ({ isCustom = false, isEdit }) => {
    const prototype = useCurrentPrototype();
    const [selectImageMedia, setSelectImageMedia] = useState(false);
    const [previewImage, setPreviewImage] = useState<MediaType | null>(null);
    const canEdit = useCurrentProtototypePermissions().canEdit();

    useEffect(() => {
        // console.log("Editing = ", isEdit, " and have preview img = ", previewImage ? "true" : "false")
        if (!isEdit && previewImage) {
            // console.log("Editing = true and have preview img")
            if (prototype) {
                // Ensure prototype is defined before updating
                updateSelectedMedia();
            }
        }
    }, [isEdit, previewImage]);

    const updateSelectedMedia = async () => {
        // console.log("Function Update triggered")
        if (prototype && previewImage) {
            // Ensure both prototype and previewImage are defined
            // console.log("Update triggered")
            try {
                await updateDoc(doc(REFS.prototype, prototype.id), {
                    image_file: previewImage.imageUrl,
                });
                window.location.reload();
            } catch (error) {
                console.error("Error updating document:", error);
            }
        }
    };

    return (
        <div className="flex w-full h-full">
            <div className="flex flex-col w-full h-auto">
                <div className="flex w-full h-full">
                    {isCustom ? (
                        <CustomDisplayImage
                            image_file={previewImage?.imageUrl || prototype?.image_file}
                            aspectRatio="free"
                            alignTop={true}
                            isBlur={false}
                            minHeight={300}
                        />
                    ) : (
                        <DisplayImage maxHeight={300} image_file={previewImage?.imageUrl || prototype?.image_file} />
                    )}
                </div>
                {canEdit && isEdit && (
                    <div className="flex items-center justify-center mt-2" style={{ zIndex: 9999 }}>
                        <Button variant="white" onClick={() => setSelectImageMedia(true)}>
                            <TbPhotoEdit className="w-4 h-4" style={{ strokeWidth: 1.5 }} />
                            <div className="pl-2"> Change Image</div>
                        </Button>
                    </div>
                )}
            </div>
            <SelectMedia
                filter={["image"]}
                state={[selectImageMedia, setSelectImageMedia]}
                selectMedia={(media) => {
                    setPreviewImage(media);
                    setSelectImageMedia(false);
                    return Promise.resolve(); // If there's more to be done asynchronously, handle it here.
                }}
            />
        </div>
    );
};

export default DisplayPrototypeImage;
