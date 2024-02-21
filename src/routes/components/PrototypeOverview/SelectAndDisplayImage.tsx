import { CollectionReference, deleteField, doc, DocumentData, updateDoc } from "firebase/firestore";
import { TbUpload, TbX, TbPhotoEdit } from "react-icons/tb";
import { Model, Prototype } from "../../../apis/models";
import Button from "../../../reusable/Button";
import SelectMedia from "../EditPrototype/SelectMedia";
import DisplayImage from "./DisplayImage";
import CustomDisplayImage from "./CustomDisplayImage";

type SelectAndDisplayImageProps<Object extends Prototype | Model> = {
    db: CollectionReference<DocumentData>;
    object: Object;
    object_key: keyof Object;
    canEdit: () => boolean;
    disableNoImagePlaceholder?: boolean;
};

const SelectAndDisplayImage = <Object extends Prototype | Model>({
    db,
    object,
    object_key,
    canEdit,
    disableNoImagePlaceholder,
}: SelectAndDisplayImageProps<Object>) => {
    return (
        // <div className="flex h-full w-full relative" style={{ pointerEvents: 'none' }}>
        <div className="flex h-full w-full relative">
            {canEdit() && (
                <div className="flex absolute right-0 top-0" style={{ zIndex: 99 }}>
                    {(object[object_key] ?? "") === "" && (
                        <Button
                            className="pl-3 py-1 w-fit mr-2"
                            onClick={async () => {
                                await updateDoc(doc(db, object.id), {
                                    [object_key]: deleteField(),
                                });
                                window.location.reload();
                            }}
                        >
                            <TbX className="w-7 h-auto text-gray-500 hover:text-aiot-blue mr-2" />
                        </Button>
                    )}
                    <SelectMedia
                        trigger={
                            <Button className="pl-3 px-1 text-sm text-gray-500 hover:text-aiot-blue">
                                <TbPhotoEdit
                                    className="w-6 h-auto text-gray-500 hover:text-aiot-blue"
                                    style={{ strokeWidth: 1.7 }}
                                />
                            </Button>
                        }
                        filter={["image"]}
                        selectMedia={async (media) => {
                            await updateDoc(doc(db, object.id), {
                                [object_key]: media.imageUrl,
                            });
                            window.location.reload();
                        }}
                    />
                </div>
            )}
            <div className="flex w-full h-full items-center justify-center">
                {/* <CustomDisplayImage image_file={(object[object_key] as any) ?? ""} disableNoImagePlaceholder={disableNoImagePlaceholder} height={1000} isBlur={false} aspectRatio="free" /> */}
                <DisplayImage
                    image_file={(object[object_key] as any) ?? ""}
                    disableNoImagePlaceholder={disableNoImagePlaceholder}
                    maxHeight={1000}
                />
            </div>
        </div>
    );
};

export default SelectAndDisplayImage;
