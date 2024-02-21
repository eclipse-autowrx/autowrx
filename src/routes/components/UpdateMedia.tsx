import { MenuItem } from "@mui/material";
import { doc, FieldPath, runTransaction, collection, deleteField } from "firebase/firestore";
import { FC, useState } from "react";
import { VscEdit } from "react-icons/vsc";
import { db, REFS } from "../../apis/firebase";
import { useCurrentModelPermissions } from "../../permissions/hooks";
import Button from "../../reusable/Button";
import Dropdown from "../../reusable/Dropdown";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import SelectMedia from "./EditPrototype/SelectMedia";
import { ImagePins } from "./EditPrototype/SelectPinsOnImage";
import { TbEdit } from "react-icons/tb";
const saveApiResource = async (params: {
    model_id: string;
    node_path: string;
    type: "glb_file" | "image_file";
    url: string;
    pins?: ImagePins;
}) => {
    await runTransaction(db, async (tx) => {
        tx.update(
            doc(collection(db, "model"), params.model_id),
            new FieldPath("model_files", params.node_path, params.type),
            params.url
        );
        if (typeof params.pins !== "undefined") {
            tx.update(
                doc(collection(db, "model"), params.model_id),
                new FieldPath("model_files", params.node_path, "pins"),
                params.pins
            );
        } else {
            tx.update(
                doc(collection(db, "model"), params.model_id),
                new FieldPath("model_files", params.node_path, "pins"),
                deleteField()
            );
        }
    });
};

interface UpdateMediaProps {
    model_id: string;
    node_path: string;
}

const UpdateMedia: FC<UpdateMediaProps> = ({ model_id, node_path }) => {
    const selectImageMedia = useState(false);
    const selectModelMedia = useState(false);
    const { isLoggedIn, user, profile } = useCurrentUser();
    const modelPermissions = useCurrentModelPermissions();

    return (
        <>
            <SelectMedia
                filter={["image"]}
                state={selectImageMedia}
                selectMedia={async (media, pins) => {
                    await saveApiResource({
                        type: media.type === "image" ? "image_file" : "glb_file",
                        model_id,
                        node_path,
                        url: media.imageUrl,
                        pins,
                    });
                    window.location.reload();
                }}
                supportPins
            />
            <SelectMedia
                filter={["model"]}
                state={selectModelMedia}
                selectMedia={async (media) => {
                    await saveApiResource({
                        type: media.type === "image" ? "image_file" : "glb_file",
                        model_id,
                        node_path,
                        url: media.imageUrl,
                    });
                    window.location.reload();
                }}
            />
            {modelPermissions.canEdit() && (
                <div className="absolute top-3 right-3 z-10">
                    <Dropdown
                        trigger={
                            <Button className="pl-1">
                                <TbEdit
                                    className="w-7 h-auto text-gray-500 hover:text-aiot-blue"
                                    style={{ strokeWidth: 1.5 }}
                                />
                            </Button>
                        }
                    >
                        <MenuItem onClick={() => selectImageMedia[1](true)}>Select Image File</MenuItem>
                        <MenuItem onClick={() => selectModelMedia[1](true)}>Select Model File</MenuItem>
                    </Dropdown>
                </div>
            )}
        </>
    );
};

export default UpdateMedia;
