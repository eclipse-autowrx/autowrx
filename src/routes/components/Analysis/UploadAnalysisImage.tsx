import { updateDoc, doc } from "firebase/firestore";
import { FiUpload } from "react-icons/fi";
import { REFS } from "../../../apis/firebase";
import { Prototype } from "../../../apis/models";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { useCurrentProtototypePermissions } from "../../../permissions/hooks";
import Button from "../../../reusable/Button";
import SelectMedia from "../EditPrototype/SelectMedia";

const UploadAnalysisImage = () => {
    const prototype = useCurrentPrototype() as Prototype;
    const canEdit = useCurrentProtototypePermissions().canEdit();

    return !canEdit ? null : (
        <div className="absolute right-3 top-3">
            <SelectMedia
                trigger={
                    <Button className="pl-3 py-1">
                        <FiUpload className="mr-2" />
                        Attach Image
                    </Button>
                }
                filter={["image"]}
                selectMedia={async (media, pins) => {
                    await updateDoc(doc(REFS.prototype, prototype.id), {
                        analysis_image_file: media.imageUrl,
                    });
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default UploadAnalysisImage;
