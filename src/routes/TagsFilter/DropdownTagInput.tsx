import React, { useState, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import { Tag, TagCategory } from "../../apis/models";
import { TbChevronRight, TbPlus, TbCheck, TbPlaylistAdd, TbAlertSquare } from "react-icons/tb";
import GeneralTooltip from "../../reusable/ReportTools/GeneralTooltip";
import Button from "../../reusable/Button";

interface DropdownTagInputProps {
    tagCategories: TagCategory[];
    onCreate: (newTagCategory: TagCategory, newTag: Tag) => void;
    onSelect: (tagCategory: TagCategory, tag: Tag) => void;
    loading?: boolean;
    selectedTags: Array<{ tagCategoryId: string; tagCategoryName: string; tag: string }>;
    fullWidth?: boolean;
}

const DropdownTagInput: React.FC<DropdownTagInputProps> = ({
    tagCategories,
    onCreate,
    onSelect,
    loading,
    selectedTags,
    fullWidth,
}) => {
    const [inputValue, setInputValue] = useState("");

    // suggested tags and categories that match the input value
    const [suggestedCategories, setSuggestedCategories] = useState<TagCategory[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);

    // state to hold the value of the selected tag and category
    const [selectedTag, setSelectedTag] = useState<Tag | null>();
    const [selectedTagCategory, setSelectedTagCategory] = useState<TagCategory | null>();

    // track user input focus
    const inputRef = useRef<HTMLInputElement>(null);
    const [isInputFocused, setInputFocused] = useState(false);

    // track tag existence to prevent tag creation
    const [istagExists, setTagExists] = useState(false);

    // track tag creation to prevent tag creation when the Tab key is pressed
    const [preventTagCreation, setPreventTagCreation] = useState(false);

    // add state for handling dropdown visibility
    const [isTagDropdownVisible, setTagDropdownVisible] = useState(false);
    const [isCategoryDropdownVisible, setCategoryDropdownVisible] = useState(true);

    // Add a timeout to delay hiding the dropdown in handleBlur
    let blurTimeoutId: NodeJS.Timeout | null = null;

    // Add a ref to the dropdown container
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isEditing, setIsEditing] = useState(false);

    // Define a function to toggle the editing mode
    const toggleEditing = () => {
        setIsEditing(!isEditing);
    };

    // Add a listener for clicks outside of the dropdown to close/hide the suggestions dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close the dropdown if we click outside of it
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setTagDropdownVisible(false);
                setCategoryDropdownVisible(false);
                setInputFocused(false);
            } else {
                setTagDropdownVisible(true);
                setCategoryDropdownVisible(true);
                setInputFocused(true);
            }
        };

        // Add the listener when the component mounts
        document.addEventListener("mousedown", handleClickOutside);
        // Clean up the listener when the component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Add a listener for the Enter and Tab key
    useEffect(() => {
        // Add a listener for the Enter key to select the first suggestion and create a new tag if no suggestion is selected
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                inputValue.trim() !== "" &&
                (!preventTagCreation || (selectedTagCategory && selectedTag))
            ) {
                if (selectedTagCategory && selectedTag) {
                    handleOnSelect(selectedTag);
                } else {
                    loading ? null : handleTagCreate();
                }
            }
        };

        // Add a listener for the Tab key to select the first suggestion
        const handleTabPress = (event: KeyboardEvent) => {
            if (event.key === "Tab") {
                event.preventDefault();
                setPreventTagCreation(true); // Prevent tag creation when the Tab key is pressed
                if (!selectedTagCategory && suggestedCategories.length > 0) {
                    handleTagCategorySelect(suggestedCategories[0]);
                } else if (selectedTagCategory && suggestedTags.length > 0) {
                    handleTagSelect(suggestedTags[0]);
                }
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keydown", handleTabPress);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keydown", handleTabPress);
        };
    }, [inputValue, suggestedCategories, suggestedTags, selectedTagCategory]);

    // Handle tag existence check and suggestion filtering
    const updateTagState = (categoryName: string, tagName: string) => {
        const category = tagCategories.find((c) => c.name === categoryName.trim());
        setSelectedTagCategory(category);
        if (category && category.tags) {
            const filteredTags = Object.values(category.tags)
                .filter((tag) => tag && tag.name && tag.name.includes(tagName))
                .filter(
                    (tag) =>
                        tag &&
                        tag.name &&
                        !selectedTags.some(
                            (categoryAndTag) =>
                                categoryAndTag.tagCategoryId === category.id && categoryAndTag.tag === tag.name.trim()
                        )
                );
            setSelectedTag(filteredTags[0]);
            setSuggestedTags(filteredTags.slice(0, 5));
            setSuggestedCategories([]);
        } else {
            // Handle the case where category or category.tags is undefined
            setSelectedTag(null);
            setSuggestedTags([]);
            setSuggestedCategories([]);
        }
    };

    // This function used for both tag and category suggestions
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);

        const parts = value.split("/");
        if (parts.length === 2) {
            const [categoryName, tagName] = parts;
            const category = tagCategories.find((c) => c.name === categoryName.trim());

            updateTagState(categoryName, tagName);

            if (category) {
                const tagExists = selectedTags.some(
                    (categoryAndTag) =>
                        categoryAndTag.tagCategoryId === category.id && categoryAndTag.tag === tagName.trim()
                );

                setTagExists(tagExists);

                if (tagExists) {
                    return;
                }

                const filteredTags = Object.values(category.tags)
                    .filter((tag) => tag.name.startsWith(tagName))
                    .filter(
                        (tag) =>
                            !selectedTags.some(
                                (categoryAndTag) =>
                                    categoryAndTag.tagCategoryId === category.id &&
                                    categoryAndTag.tag === tag.name.trim()
                            )
                    );

                const limitedFilteredTags = filteredTags.slice(0, 5);
                setSelectedTag(filteredTags[0]);
                setSuggestedTags(limitedFilteredTags);
                setSuggestedCategories([]);
            }
        } else {
            setSelectedTagCategory(undefined);
            setSelectedTag(undefined);
            setTagExists(false);

            const filteredCategories = tagCategories
                .filter((category) => category.name.startsWith(value))
                .filter(
                    (category) =>
                        !Object.values(category.tags).every((tag) =>
                            selectedTags.some(
                                (categoryAndTag) =>
                                    categoryAndTag.tagCategoryId === category.id &&
                                    categoryAndTag.tag === tag.name.trim()
                            )
                        )
                );

            const limitedFilteredCategories = filteredCategories.slice(0, 5);
            setSuggestedCategories(limitedFilteredCategories);
            setSuggestedTags([]);
        }
    };

    const handleTagCategorySelect = (tagCategory: TagCategory) => {
        // This function is called when a category is selected
        handleSuggestionClick(tagCategory);
        setInputValue(tagCategory.name + "/");
        setSelectedTagCategory(tagCategory);
        setSuggestedCategories([]);
        setSuggestedTags(Object.values(tagCategory.tags));
        setPreventTagCreation(false);
        updateTagState(tagCategory.name, "");
        setCategoryDropdownVisible(false); // This line closes the dropdown when a category is selected
        // setTagDropdownVisible(true); // show dropdown again with categories
    };

    const handleTagSelect = async (tag: Tag) => {
        // This function is called when a tag is selected
        handleSuggestionClick(tag);
        setInputValue(`${selectedTagCategory?.name}/${tag.name}`);
        setSelectedTag(tag);
        setSuggestedTags([]);
        setPreventTagCreation(false);
        setInputFocused(true);
        updateTagState(selectedTagCategory?.name || "", tag.name);
        setTagDropdownVisible(false); // This line closes the dropdown when a tag is selected
    };

    function getRandomColor() {
        let letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    const handleTagCreate = async () => {
        // This function is called when the user presses Enter to create a new tag
        if (!selectedTagCategory || !selectedTag) {
            const [categoryName, tagName] = inputValue.split("/");

            const tagExists = selectedTags.some(
                (categoryAndTag) =>
                    categoryAndTag.tagCategoryName === categoryName.trim() && categoryAndTag.tag === tagName.trim()
            );

            if (tagExists) {
                setTagExists(true); // Display error about tag duplication
                return;
            } else {
                setTagExists(false);
            }

            const newTagCategory: TagCategory = {
                id: Date.now().toString(),
                tenant_id: "",
                name: categoryName.trim(),
                color: getRandomColor(),
                tags: {},
            };
            const newTag: Tag = {
                name: tagName.trim(),
                tag_image_file: "", // Develop later
                description: "", // Develop later
            };
            setSelectedTagCategory(newTagCategory);
            setSelectedTag(newTag);
            await onCreate(newTagCategory, newTag); // Call the onCreate prop and wait for it
            setInputValue(""); // Then clear the input field
            setPreventTagCreation(false);
        }
    };

    const handleOnSelect = async (tag: Tag) => {
        if (selectedTagCategory) {
            await onSelect(selectedTagCategory, tag); // Call the onSelect prop and wait for it
            setInputValue(""); // Then clear the input field
            setPreventTagCreation(false); // Add this line
        }
        setCategoryDropdownVisible(true);
    };

    const handleSuggestionClick = (suggestion: Tag | TagCategory) => {
        if (blurTimeoutId) {
            clearTimeout(blurTimeoutId);
            blurTimeoutId = null;
        }
    };

    // And finally, Clear the timeout when the component is unmounted to avoid memory leaks
    useEffect(() => {
        return () => {
            if (blurTimeoutId) {
                clearTimeout(blurTimeoutId);
                blurTimeoutId = null;
            }
        };
    }, []);

    // split the input value into the tag name
    const inputValueParts = inputValue.split("/");

    useEffect(() => {
        function handleDropdownVisibility() {
            if (suggestedCategories.length === 0) {
                setCategoryDropdownVisible(false);
            } else if (suggestedCategories.length > 0 && inputValueParts[0].length >= 0 && isInputFocused) {
                setCategoryDropdownVisible(true);
                setTagDropdownVisible(false);
            } else {
                setCategoryDropdownVisible(false);
            }

            if (inputValue.includes("/")) {
                setCategoryDropdownVisible(false);
                const matchingTag = suggestedTags.some((tag) => tag.name === inputValueParts[1]);
                setTagDropdownVisible(!matchingTag);
            }
        }
        handleDropdownVisibility();
        // console.log("isCategoryDropdownVisible: ", isCategoryDropdownVisible);
        // console.log("isTagDropdownVisible: ", isTagDropdownVisible);
        // console.log("suggestTagCategories: ", suggestedCategories.length);
    }, [
        inputValueParts,
        inputValue,
        isInputFocused,
        suggestedCategories,
        suggestedTags,
        tagCategories,
        selectedTagCategory,
    ]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click was on the trigger div.
            const clickedOnTriggerDiv =
                dropdownRef.current &&
                dropdownRef.current.previousSibling &&
                dropdownRef.current.previousSibling.contains(event.target);

            // Check if the click was outside the dropdown.
            const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);

            // If the dropdown is open and the click was outside both the dropdown and the trigger div, close it.
            if (isEditing && clickedOutsideDropdown && !clickedOnTriggerDiv) {
                setIsEditing(false);
            }
        };

        document.body.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.body.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEditing]);

    const widthClass = fullWidth ? "w-full !min-w-[15rem]" : "!min-w-[15rem]"; // If fullWidth is true, apply w-full class
    const inputWrapperClass = isEditing ? "w-full" : "w-[5.5rem]";
    const applyButtonRef = useRef<HTMLDivElement | null>(null);
    const createButtonRef = useRef<HTMLDivElement | null>(null);
    const alertRef = useRef<HTMLDivElement | null>(null);

    return (
        <div className={`${widthClass} flex relative text-xs`}>
            <div className="w-full" ref={dropdownRef}>
                <div
                    className={`${inputWrapperClass} h-8 flex transition-width duration-100 rounded items-center shadow-sm border-gray-200 border overflow-hidden`}
                >
                    {isEditing ? (
                        <div className="flex w-full items-center text-xs text-gray-600 hover:text-gray-800  rounded">
                            <TbChevronRight className="flex w-4 h-4 ml-2 mr-1" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                className="flex-1 text-xs py-2 rounded-r bg-transparent focus:outline-none"
                                placeholder="Enter Category/Tag"
                                autoFocus
                            />
                            {isEditing &&
                                inputValue.includes("/") &&
                                selectedTagCategory &&
                                selectedTag &&
                                !istagExists &&
                                inputValueParts[1].length > 0 &&
                                suggestedTags.some((tag) => tag.name === inputValueParts[1]) && (
                                    <GeneralTooltip
                                        className="scale-100 w-fit"
                                        content="Apply this category/tag"
                                        delay={100}
                                        targetRef={applyButtonRef}
                                        space={15}
                                    >
                                        <Button
                                            className="bg-gray-100 px-2 py-3 hover:bg-gray-200"
                                            onClick={() => handleOnSelect(selectedTag)}
                                            ref={applyButtonRef}
                                            showProgress={loading}
                                            progressColor="#1f2937"
                                            icon={TbCheck}
                                            iconClassName="text-gray-600 hover:text-gray-800 !mr-0"
                                        />
                                    </GeneralTooltip>
                                )}
                            {isEditing &&
                                inputValue.includes("/") &&
                                inputValueParts[1] &&
                                inputValueParts[1].length > 0 &&
                                !istagExists &&
                                !suggestedTags.some((tag) => tag.name === inputValueParts[1]) && (
                                    <GeneralTooltip
                                        className="scale-100 w-fit"
                                        content="Creat new category/tag"
                                        delay={100}
                                        targetRef={createButtonRef}
                                        space={15}
                                    >
                                        <Button
                                            className="bg-gray-100 px-2 py-3 hover:bg-gray-200 h-full"
                                            onClick={handleTagCreate}
                                            ref={createButtonRef}
                                            showProgress={loading}
                                            progressColor="#1f2937"
                                            icon={TbPlaylistAdd}
                                            iconClassName="text-gray-600 hover:text-gray-800 !mr-0"
                                        />
                                    </GeneralTooltip>
                                )}
                            {istagExists && (
                                <GeneralTooltip
                                    className={`scale-100`}
                                    content="Tag already exists"
                                    delay={100}
                                    targetRef={alertRef}
                                >
                                    <div ref={alertRef}>
                                        <TbAlertSquare className="w-4 h-4 mr-2 text-red-500" />
                                    </div>
                                </GeneralTooltip>
                            )}
                        </div>
                    ) : (
                        <Button
                            variant="white"
                            className="border-0 bg-white w-full h-full"
                            icon={TbPlus}
                            onClick={toggleEditing}
                            iconStrokeWidth={1.75}
                        >
                            Add tag
                        </Button>
                    )}
                </div>

                {isEditing && (
                    <>
                        {isCategoryDropdownVisible && suggestedCategories.length >= 0 && (
                            <div
                                className={`${widthClass} absolute mt-2 border border-gray-100 text-gray-500 bg-white rounded shadow`}
                                style={{ zIndex: 9999 }}
                            >
                                <div className="bg-transparent pt-2 pb-1 px-4 text-[12px] font-bold text-gray-800">
                                    CATEGORY SUGGESTIONS
                                </div>
                                <div className="text-[12px]">
                                    {suggestedCategories.map((tagCategory) => (
                                        <div
                                            key={tagCategory.id}
                                            onClick={() => handleTagCategorySelect(tagCategory)}
                                            className="mx-2 px-2 py-2 cursor-pointer hover:bg-gray-100 hover:rounded text-gray-600"
                                        >
                                            {tagCategory.name}
                                        </div>
                                    ))}
                                    <div className="pt-2"></div>
                                </div>
                            </div>
                        )}

                        {isTagDropdownVisible && suggestedTags.length > 0 && inputValueParts.length > 1 && (
                            <div
                                className={`${widthClass} absolute mt-2 border border-gray-100 text-gray-500 bg-white rounded shadow`}
                                style={{ zIndex: 9999 }}
                            >
                                <div className="bg-transparent pt-2 pb-1 px-4 text-[12px] font-bold text-gray-800">
                                    TAG SUGGESTIONS
                                </div>
                                <div className="text-[12px]">
                                    {suggestedTags.map((tag) => (
                                        <div
                                            key={tag.name}
                                            onClick={() => handleTagSelect(tag)}
                                            className="mx-2 px-2 py-2 cursor-pointer hover:bg-gray-100 hover:rounded text-gray-600"
                                        >
                                            {tag.name}
                                        </div>
                                    ))}
                                    <div className="pt-2"></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DropdownTagInput;
