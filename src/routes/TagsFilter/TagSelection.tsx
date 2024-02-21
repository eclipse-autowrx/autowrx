import { FC, useState, useEffect } from "react";
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh";
import { useCurrentTenantTagCategories } from "../../reusable/hooks/useCurrentTenantTagCategories";
import TagChip, { CategoryAndTag } from "./TagChip";
import TagInput from "./TagInput";
import DropdownTagInput from "./DropdownTagInput";
import { TagCategory, Tag } from "../../apis/models";
import { TbPlus, TbChevronDown } from "react-icons/tb";
import { getDoc, updateDoc, setDoc, doc } from "firebase/firestore";
import { REFS } from "../../apis/firebase";
import { TENANT_ID } from "../../constants";
import { slugify } from "../../reusable/functions";

const TagSelection: FC<{
    selectedTagsState: [CategoryAndTag[], React.Dispatch<React.SetStateAction<CategoryAndTag[]>>];
    fullWidth?: boolean;
}> = ({ selectedTagsState, fullWidth = false }) => {
    const [selectedTags, setSelectedTags] = selectedTagsState;
    const [loading, setLoading] = useState(false);
    const [tagInputLoading, setTagInputLoading] = useState(false);
    const tagCategories = useCurrentTenantTagCategories();
    const [tagRemovalQueue, setTagRemovalQueue] = useState<Array<() => Promise<void>>>([]);

    // Define a function to create a new tag
    const handleTagCreation = async (newTagCategory, newTag) => {
        const id = slugify(newTagCategory.name);
        const docRef = doc(REFS.tags, id);
        const docSnap = await getDoc(docRef);

        // Firebase Firestore logic to update the document
        if (docSnap.exists()) {
            // Update the existing document by appending the new tag to the 'tags' field
            await updateDoc(docRef, {
                [`tags.${newTag.name}`]: newTag,
            });
        } else {
            // Create a new document
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
        onCreate(newTagCategory, newTag);
    };

    const onCreate = (newTagCategory: TagCategory, newTag: Tag) => {
        return new Promise((resolve) => {
            setTagInputLoading(true);
            setTimeout(() => {
                setSelectedTags((prevSelectedTags) => [
                    ...prevSelectedTags,
                    {
                        tagCategoryId: newTagCategory.id,
                        tagCategoryName: newTagCategory.name,
                        tag: newTag.name,
                    },
                ]);
                setTagInputLoading(false);
                resolve(null);
            }, 100);
        });
    };

    const onSelect = (selectedTagCategory: TagCategory, selectedTag: Tag) => {
        return new Promise((resolve) => {
            setTagInputLoading(true);
            setTimeout(() => {
                setSelectedTags((prevSelectedTags) => [
                    ...prevSelectedTags,
                    {
                        tagCategoryId: selectedTagCategory.id,
                        tagCategoryName: selectedTagCategory.name,
                        tag: selectedTag.name,
                    },
                ]);
                setTagInputLoading(false);
                resolve(null);
            }, 100);
        });
    };

    // if needEdit = true then require the button add tag else  directly enable dropdown taginput

    return (
        <div className="flex w-full">
            <div className="flex w-full flex-wrap">
                <div className="select-none w-fit">
                    {selectedTags.length > 0 && (
                        <div className="inline-flex flex-wrap">
                            {selectedTags.map((categoryAndTag, index) => (
                                <TagChip
                                    loading={loading}
                                    key={categoryAndTag.tag + "-/-" + categoryAndTag.tagCategoryId}
                                    categoryAndTag={categoryAndTag}
                                    onRemove={async () => {
                                        setLoading(true);
                                        await setSelectedTags(() => {
                                            return selectedTags.filter(
                                                (tagCategory) =>
                                                    JSON.stringify(tagCategory) !== JSON.stringify(categoryAndTag)
                                            );
                                        });
                                        setLoading(false);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex w-fit">
                    <div className={`flex w-full ${selectedTags.length > 0 ? "" : ""}`}>
                        <DropdownTagInput
                            fullWidth={fullWidth}
                            tagCategories={tagCategories}
                            onCreate={handleTagCreation}
                            onSelect={onSelect}
                            loading={tagInputLoading}
                            selectedTags={selectedTags}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagSelection;
