import clsx from "clsx";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import LinkWrap from "../../../../reusable/LinkWrap";
import WIPPopup from "../../WIPPopup";
import Button from "../../../../reusable/Button";
import SelectAndDisplayImage from "../../PrototypeOverview/SelectAndDisplayImage";
import permissions from "../../../../permissions";
import useCurrentUser from "../../../../reusable/hooks/useCurrentUser";
import { TbEdit, TbSquareCheck, TbDownload } from "react-icons/tb";
import { useState, useEffect } from "react";
import Input from "../../../../reusable/Input/Input";
import { addLog, saveModelName } from "../../../../apis";
import SelectUser from "../../../Permissions/SelectUser";
import ModelPermissions from "../../../../routes/Permissions/ModelPermissions";
import { downloadModelZip } from "../../../../utils/zipUtils";
import Popup from "../../../../reusable/Popup/Popup";
import TagSelection from "../../../TagsFilter/TagSelection";

import { Model, Tag, TagCategory } from "../../../../apis/models";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { REFS } from "../../../../apis/firebase";
import { TENANT_ID } from "../../../../constants";
import { slugify } from "../../../../reusable/functions";
import TagChip, { CategoryAndTag } from "../../../TagsFilter/TagChip";
import DropdownTagInput from "../../../TagsFilter/DropdownTagInput";
import { useCurrentTenantTagCategories } from "../../../../reusable/hooks/useCurrentTenantTagCategories";
import ModelVehicleProperty from "./ModelVehicleProperty";

interface FeatureBoxProps {
    title: string;
    description: string;
    to: string;
    wip?: boolean;
}

const FeatureBox = ({ to, title, description, wip }: FeatureBoxProps) => {
    const inner = (
        <div
            className={clsx(
                "flex flex-col w-full py-4 px-4 rounded border border-gray-300 select-none h-full justify-center",
                "hover:bg-aiot-blue/5 hover:border-aiot-blue transition duration-300 cursor-pointer"
            )}
        >
            <div className="flex text-xl mb-2 text-gray-700 group-hover:text-aiot-blue">{title}</div>
            <div className="text-gray-600">{description}</div>
        </div>
    );

    return wip ? (
        <WIPPopup trigger={<div className="mb-4">{inner}</div>} />
    ) : (
        <LinkWrap to={to} className="mb-4 group">
            {inner}
        </LinkWrap>
    );
};

const ModelHome = () => {
    const { profile } = useCurrentUser();
    const model = useCurrentModel() as Model;
    const [selectedTags, setSelectedTags] = useState<CategoryAndTag[]>([]);
    const [tagInputLoading, setTagInputLoading] = useState(false);
    const [editingModelName, setEditingModelName] = useState(false);
    const exportState = useState(false);
    const [editingInput, setEditingInput] = useState(model.name);
    const tagCategories = useCurrentTenantTagCategories();

    useEffect(() => {
        // console.log("Model is: " + model.id + " and name is: " + model.name);
        // console.log("model categories: " + model.tags);

        //  `model.tags` is an array of tags where each tag has `TagName` and `CategoryName`
        const fetchedTags = model.tags?.map((tag) => {
            return {
                tagCategoryId: slugify(tag.tagCategoryName),
                tagCategoryName: tag.tagCategoryName,
                tag: tag.tag,
            };
        });
        // setSelectedTags is used to display existed tags coordinating with DropdownTagInput and TagSelection
        if (fetchedTags) {
            setSelectedTags(fetchedTags);
        } else {
            setSelectedTags([]);
        }
    }, [model.id]); // refetch when model id changes

    // useEffect(() => {
    //     console.log("Model tags changed: ", model.tags);
    // }, [model.tags]);

    // handleTagCreation is create Tag on "tags" Firebase
    const handleTagCreation = async (newTagCategory, newTag) => {
        const id = slugify(newTagCategory.name);
        const docRef = doc(REFS.tags, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const existingTagCategory = docSnap.data();
            const existingTag = existingTagCategory?.tags[newTag.name];
            if (existingTag) {
                // console.warn("Tag already exists.");
                return;
            }
            await updateDoc(docRef, { [`tags.${newTag.name}`]: newTag });
        } else {
            const tagCategoryObject = {
                ...newTagCategory,
                id,
                tenant_id: TENANT_ID,
                tags: {
                    [newTag.name]: newTag,
                },
            };
            await setDoc(docRef, tagCategoryObject);
        }
        onCreate(newTagCategory, newTag).catch(console.error);
    };

    // onCreate is create Tag on "model" Firebase
    const onCreate = async (newTagCategory: TagCategory, newTag: Tag) => {
        setTagInputLoading(true);
        const newTagDetail = {
            tagCategoryId: newTagCategory.id,
            tagCategoryName: newTagCategory.name,
            tag: newTag.name,
        };

        const modelRef = doc(REFS.model, model.id);
        const docSnap = await getDoc(modelRef);
        const existingModel = docSnap.data();
        const existingTag = existingModel?.tags?.find(
            (tag) => tag.tag === newTag.name && tag.tagCategoryId === newTagCategory.id
        );

        if (existingTag) {
            // console.warn("Tag already exists on the model.");
            setTagInputLoading(false);
            return;
        }

        const newTags = existingModel?.tags ? [...existingModel.tags, newTagDetail] : [newTagDetail];

        try {
            await updateDoc(modelRef, { tags: newTags });
            setSelectedTags((prevSelectedTags) => [...prevSelectedTags, newTagDetail]);
        } catch (err) {
            console.error("Error updating document: ", err);
        }

        setTagInputLoading(false);
    };

    // current tag assign to model
    const onSelect = (selectedTagCategory: TagCategory, selectedTag: Tag) => {
        return new Promise((resolve) => {
            setTagInputLoading(true);
            setTimeout(async () => {
                const selectedTagDetail = {
                    tagCategoryId: selectedTagCategory.id,
                    tagCategoryName: selectedTagCategory.name,
                    tag: selectedTag.name,
                };
                // Fetch the model from Firebase
                const modelRef = doc(REFS.model, model.id);
                const docSnap = await getDoc(modelRef);
                const existingModel = docSnap.data();
                const existingTag = existingModel?.tags?.find(
                    (tag) => tag.tag === selectedTag.name && tag.tagCategoryId === selectedTagCategory.id
                );
                // Check if the tag already exists on the Firebase's model
                if (existingTag) {
                    // console.warn("Tag already exists on the model.");
                    setTagInputLoading(false);
                    resolve(null);
                    return;
                }
                // Update the model with the new tag
                const newTags = existingModel?.tags ? [...existingModel.tags, selectedTagDetail] : [selectedTagDetail];

                try {
                    await updateDoc(modelRef, { tags: newTags });
                    setSelectedTags((prevSelectedTags) => [...prevSelectedTags, selectedTagDetail]);
                    // Add tag log
                    if (profile) {
                        const username = profile.name || profile.email || "Anonymous";
                        addLog(
                            `User '${username}' add new tag '${selectedTag.name}'`,
                            `User '${username}' add new tag '${selectedTag.name}' to model '${model.name}' with id '${model.id}'`,
                            "update",
                            profile.uid,
                            null,
                            model.id,
                            "model",
                            null
                        );
                    }
                } catch (err) {
                    console.error("Error updating document: ", err);
                }

                setTagInputLoading(false);
                resolve(null);
            }, 100);
        });
    };

    // useEffect(() => {
    //     console.log("Model: ", model)
    // }, [model]);

    // Function to remove a tag
    const handleTagRemoval = async (index: number) => {
        // Create new array filter out the removed tag from selectedTags
        const deletedTag = selectedTags[index];
        const updatedTags = selectedTags.filter((tag, i) => i !== index);

        // Update the tags in Firebase
        try {
            await updateDoc(doc(REFS.model, model.id), { tags: updatedTags });
            // Update the local state
            setSelectedTags(updatedTags);
            // Remove tag log
            if (profile) {
                const username = profile.name || profile.name || "Anonymous";

                addLog(
                    `User '${username}' delete tag '${deletedTag.tag}'`,
                    `User '${username}' delete tag '${deletedTag.tag}' from model '${model.name}' with id '${model.id}'`,
                    "update",
                    profile.uid,
                    null,
                    model.id,
                    "model",
                    null
                );
            }
        } catch (err) {
            console.error("Error updating document: ", err);
        }
    };

    return (
        <div className="flex h-full w-full">
            {exportState[0] && (
                <div className="z-50 top-40 right-40 bottom-40 left-40 border border-gray-200 rounded-lg shadow-md fixed grid place-items-center text-3xl py-20 bg-white">
                    Collecting data to export...
                </div>
            )}

            <div className="flex flex-col h-full w-3/6 p-6">
                <div className="flex mb-4 items-top justify-between">
                    {editingModelName ? (
                        <Input containerClassName="mr-3 text-lg" state={[editingInput, setEditingInput]} />
                    ) : (
                        <div>
                            <div className="text-3xl font-bold text-gray-700">{model.name}</div>
                        </div>
                    )}
                    {permissions.TENANT(profile).canEdit() && (
                        <div className="flex space-x-3 ml-auto">
                            {editingModelName ? (
                                <Button
                                    className="py-1 h-full"
                                    onClick={async () => {
                                        await saveModelName(model.id, editingInput);
                                        window.location.reload();
                                    }}
                                >
                                    <TbSquareCheck
                                        className="w-7 h-auto text-gray-500 hover:text-aiot-blue"
                                        style={{ strokeWidth: 1.5 }}
                                    />
                                </Button>
                            ) : (
                                <Button
                                    className=" py-1"
                                    onClick={() => {
                                        setEditingModelName(true);
                                    }}
                                >
                                    <TbEdit
                                        className="w-7 h-auto text-gray-500 hover:text-aiot-blue"
                                        style={{ strokeWidth: 1.5 }}
                                    />
                                </Button>
                            )}
                            <Button
                                className="flex ml-auto py-1"
                                onClick={async () => {
                                    if (!model) return;
                                    exportState[1](true);
                                    try {
                                        await downloadModelZip(model);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                    exportState[1](false);
                                }}
                            >
                                <TbDownload
                                    className="w-7 h-auto text-gray-500 hover:text-aiot-blue"
                                    style={{ strokeWidth: 1.5 }}
                                />
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col h-full">
                    <FeatureBox
                        to={`/model/${model.id}/architect`}
                        title="Architecture"
                        description="Provide the big picture of the vehicle model"
                    />
                    <FeatureBox
                        to={`/model/${model.id}/library`}
                        title="Prototype Library"
                        description="Build up, evaluate and prioritize your portfolio of connected vehicle applications"
                    />
                    <FeatureBox
                        to={`/model/${model.id}/cvi`}
                        title="Vehicle APIs"
                        description="Browse, explore and enhance the catalogue of Connected Vehicle Interfaces"
                    />
                    <div className="flex w-full h-fit flex-wrap items-center">
                        <div className="inline-flex flex-wrap">
                            {selectedTags.map((tag, index) => (
                                <TagChip
                                    key={index}
                                    categoryAndTag={tag}
                                    onRemove={() => handleTagRemoval(index)}
                                    loading={tagInputLoading}
                                />
                            ))}
                        </div>
                        <div className={`flex w-fit ${selectedTags.length > 0 ? "mt-2" : ""} mb-4`}>
                            <DropdownTagInput
                                tagCategories={tagCategories}
                                onCreate={handleTagCreation}
                                onSelect={onSelect}
                                loading={tagInputLoading}
                                selectedTags={selectedTags}
                                fullWidth={true}
                            />
                        </div>
                    </div>

                    <ModelVehicleProperty />

                    {permissions.MODEL(profile, model).isOwner() && <ModelPermissions />}
                </div>
            </div>
            <div className="flex h-full w-3/6 p-6">
                <SelectAndDisplayImage
                    canEdit={permissions.MODEL(profile, model).canEdit}
                    db={REFS.model}
                    object={model}
                    object_key="model_home_image_file"
                />
            </div>
        </div>
    );
};

export default ModelHome;
