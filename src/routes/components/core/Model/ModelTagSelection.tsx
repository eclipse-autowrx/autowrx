import { Model, Tag, TagCategory } from "../../../../apis/models";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { slugify } from "../../../../reusable/functions";
import { REFS } from "../../../../apis/firebase";
import { TENANT_ID } from "../../../../constants";
import { useState, useEffect } from "react";
import TagChip from "../../../TagsFilter/TagChip";
import DropdownTagInput from "../../../TagsFilter/DropdownTagInput";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import { useCurrentTenantTagCategories } from "../../../../reusable/hooks/useCurrentTenantTagCategories";
import { TbPlus, TbChevronDown } from "react-icons/tb";

interface ModelTagSelectionProps {}

const ModelTagSelection: React.FC<ModelTagSelectionProps> = ({}) => {
    const [selectedTags, setSelectedTags] = useState<any[]>([]); // Define the state for selectedTags
    const [tagInputLoading, setTagInputLoading] = useState<boolean>(false); // I'm assuming you have this state for loading
    const tagCategories = useCurrentTenantTagCategories();
    const model = useCurrentModel() as Model;
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // console.log("Model is: " + model.id + " and name is: " + model.name)
        // console.log("model categories: " + model.tags)

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
    }, []); // refetch when model id changes

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
                console.warn("Tag already exists.");
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
            console.warn("Tag already exists on the model.");
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
                    console.warn("Tag already exists on the model.");
                    setTagInputLoading(false);
                    resolve(null);
                    return;
                }
                // Update the model with the new tag
                const newTags = existingModel?.tags ? [...existingModel.tags, selectedTagDetail] : [selectedTagDetail];

                try {
                    await updateDoc(modelRef, { tags: newTags });
                    setSelectedTags((prevSelectedTags) => [...prevSelectedTags, selectedTagDetail]);
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
        const updatedTags = selectedTags.filter((tag, i) => i !== index);

        // Update the tags in Firebase
        try {
            await updateDoc(doc(REFS.model, model.id), { tags: updatedTags });
            // Update the local state
            setSelectedTags(updatedTags);
        } catch (err) {
            console.error("Error updating document: ", err);
        }
    };

    return (
        <div className="flex flex-wrap w-full">
            <div className="flex w-full">
                <div className="select-none w-fit">
                    {selectedTags.length > 0 && (
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
                    )}
                </div>
                <div className="flex w-fit mb-2">
                    <button
                        className="w-[5rem] h-8 border-2 text-gray-500 text-xs rounded-full flex items-center justify-center hover:bg-gray-50 hover:text-gray-700"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? (
                            <TbChevronDown className="w-4 h-auto mr-1 text-gray-400" />
                        ) : (
                            <TbPlus className="w-4 h-auto mr-1 text-gray-400" />
                        )}
                        <span className="mr-1 ">Add tag</span>
                    </button>
                </div>
            </div>

            <div className={`w-full ${selectedTags.length > 0 ? "mt-2" : ""} mb-4`}>
                {isEditing && (
                    <DropdownTagInput
                        fullWidth={true}
                        tagCategories={tagCategories}
                        onCreate={handleTagCreation}
                        onSelect={onSelect}
                        loading={tagInputLoading}
                        selectedTags={selectedTags}
                    />
                )}
            </div>
        </div>
    );
};

export default ModelTagSelection;
