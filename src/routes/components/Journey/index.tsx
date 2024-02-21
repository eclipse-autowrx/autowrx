import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
import { BsTrash } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { REFS } from "../../../apis/firebase";
import { Model } from "../../../apis/models";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { useCurrentProtototypePermissions } from "../../../permissions/hooks";
import Button from "../../../reusable/Button";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import triggerConfirmPopup from "../../../reusable/triggerPopup/triggerConfirmPopup";
import triggerSnackbar from "../../../reusable/triggerSnackbar";
import { CategoryAndTag } from "../../TagsFilter/TagChip";
import TagDisplay from "../../TagsFilter/TagDisplay";
import TagSelection from "../../TagsFilter/TagSelection";
import DisplayPrototypeImage from "./DisplayPrototypeImage";
import JourneyEdit, { JourneyEditHandle } from "./JourneyEdit";
import EditableCustomerJourney, { EditableCustomerJourneyHandle } from "../EditableCustomerJourney";
import { isTableValidForSave } from "../EditableCustomerJourney/TableEditor";
import { TbMessages, TbEdit, TbTrashX, TbX, TbCheck } from "react-icons/tb";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import { complexityOptions, statusOptions } from "../PrototypeOverview/PrototypeDisplay";
import { Bars } from "@agney/react-loading";
import UserProfile from "../PrototypeOverview/UserProfile";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { addLog } from "../../../apis";

interface DisplayDescriptionProps {
    name: string;
    value?: string;
}

export interface JourneyRef {
    triggerSave: () => void;
}

const DisplayDescription = ({ name, value }: DisplayDescriptionProps) => {
    return (
        <tr>
            <td className="w-32 font-bold select-none pr-2 py-1 whitespace-nowrap align-top text-gray-800">{name}</td>
            <td className="text-gray-700 first-letter:uppercase" style={{ whiteSpace: "break-spaces" }}>
                {value}
            </td>
        </tr>
    );
};

interface JourneyProps {
    isSave: boolean;
    isEditing: boolean;
    setEditing(isEditng: boolean): void;
}

const Journey = React.forwardRef<JourneyRef, JourneyProps>((props, ref) => {
    const { isEditing, setEditing } = props;
    const prototype = useCurrentPrototype();
    const canEdit = useCurrentProtototypePermissions().canEdit();
    const navigate = useNavigate();
    const model = useCurrentModel() as Model;
    const [isLoading, setLoading] = useState(false);
    const [isDeletePrototype, setDeletePrototype] = useState(false);
    const journeyEditRef = useRef<JourneyEditHandle | null>(null);
    const editableCJRef = useRef<EditableCustomerJourneyHandle | null>(null);
    const editableTableRef = useRef<isTableValidForSave | null>(null);
    const { profile } = useCurrentUser();

    useImperativeHandle(ref, () => ({
        triggerSave: handleSave,
    }));

    const handleSave = async () => {
        const promises: Promise<void>[] = [];

        // Validate the table before proceeding.
        try {
            await editableTableRef.current?.isTableValidForSave();
        } catch (error) {
            // console.error("Table is not valid:", error);
            triggerSnackbar("The table is not valid. Please correct it before saving.");
            setLoading(false);
            return; // Exit the function early.
        }

        setLoading(true);

        if (journeyEditRef.current && journeyEditRef.current.saveProject) {
            promises.push(journeyEditRef.current.saveProject());
        }

        if (editableCJRef.current && editableCJRef.current.triggerSave) {
            promises.push(editableCJRef.current.triggerSave());
        }
        try {
            await Promise.all(promises);

            triggerSnackbar("All changes saved successfully.");
        } catch (error) {
            console.error("Error while saving:", error);
            triggerSnackbar("An error occurred while saving. Please try again.");
        }
        setLoading(false);
        setEditing(false);
    };

    // Initialize the tags state
    const [tags, setTags] = useState<CategoryAndTag[]>(prototype?.tags ?? []);

    // Update the tags state when the `prototype` changes
    useEffect(() => {
        setTags(prototype?.tags ?? []);
        // console.log("prototype changed" + prototype?.tags)
        // check if prototype and prototype.tags are defined
        if (prototype?.tags) {
            prototype.tags.forEach((tag, index) => {
                // console.log(`Tag ${index} category name: ${tag.tagCategoryName} tag name: ${tag.tag}`);
            });
        }
    }, [prototype]);

    // Handle save when isSave is true and handle delete prototype when isDeletePrototype is true
    useEffect(() => {
        if (isDeletePrototype && !isEditing) {
            if (!prototype) return;
            triggerConfirmPopup("Are you sure you want to delete this prototype?", async () => {
                await deleteDoc(doc(REFS.prototype, prototype.id));

                if (profile) {
                    const username = profile.name || profile.name || "Anonymous";

                    await addLog(
                        `User '${username}' delete prototype with id '${prototype.id}'`,
                        `User '${username}' delete prototype with id '${prototype.id}'`,
                        "delete",
                        profile.uid,
                        null,
                        prototype.id,
                        "prototype",
                        null
                    );
                }
                navigate(`/model/${model.id}/library`);
            });
        }
    }, [isDeletePrototype]);

    if (typeof prototype === "undefined") {
        return null;
    }

    return (
        <div className="flex flex-col w-full h-auto">
            <div className="flex p-3 w-full h-fit">
                <div className="flex w-[30%] h-fit mr-12">
                    <DisplayPrototypeImage isEdit={isEditing} isCustom={false} />
                </div>
                <div className="flex flex-col relative w-[70%] h-full">
                    <div className="flex w-full items-center pb-2 justify-between">
                        <div className="flex flex-col w-full text-xl">
                            {!isEditing ? (
                                <div className="flex text-center font-bold capitalize text-gray-600 mb-2">
                                    {prototype.name}
                                </div>
                            ) : (
                                <div className="flex text-center font-bold capitalize text-gray-600 mb-2">
                                    Editing Prototype
                                </div>
                            )}
                        </div>
                        <div className="flex h-fit shrink-0">
                            {isEditing ? (
                                <div className="flex w-full">
                                    {!isLoading && (
                                        <Button
                                            className="mr-2"
                                            variant="white"
                                            icon={TbX}
                                            onClick={() => setEditing(false)}
                                        >
                                            Cancel
                                        </Button>
                                    )}

                                    <Button
                                        className={`${
                                            isLoading ? "!shadow-none px-4 bg-white pointer-events-none" : "pr-2.5"
                                        }`}
                                        variant="blue"
                                        icon={TbCheck}
                                        showProgress={isLoading}
                                        progressSize="1.2rem"
                                        progressColor="#005072"
                                        onClick={() => {
                                            handleSave();
                                        }}
                                    >
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                canEdit &&
                                !isEditing && (
                                    <div className="flex flex-col w-full h-full">
                                        <div className="flex w-full">
                                            <Button
                                                variant="white"
                                                className="flex mr-2 hover:border-red-500 hover:bg-red-500 hover:text-white"
                                                icon={TbTrashX}
                                                iconClassName="w-5 h-5"
                                                iconStrokeWidth={1.4}
                                                onClick={() => setDeletePrototype(true)}
                                            >
                                                Delete Prototype
                                            </Button>
                                            <Button
                                                variant="white"
                                                icon={TbEdit}
                                                iconClassName="w-5 h-5"
                                                iconStrokeWidth={1.4}
                                                onClick={() => setEditing(true)}
                                            >
                                                Edit Prototype
                                            </Button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex w-full h-full">
                            <JourneyEdit ref={journeyEditRef} cancelEditing={() => {}} />
                        </div>
                    ) : (
                        <>
                            <div className="flex w-full">
                                <table className="table-auto leading-relaxed">
                                    <tbody>
                                        <DisplayDescription name="Problem" value={prototype.description.problem} />
                                        <DisplayDescription name="Says who?" value={prototype.description.says_who} />
                                        <DisplayDescription name="Solution" value={prototype.description.solution} />
                                        <td className="font-bold select-none pr-6 py-1 whitespace-nowrap align-top text-gray-800">
                                            Status
                                        </td>
                                        <td>
                                            <CustomSelect
                                                options={statusOptions}
                                                selectedValue={prototype.state || "development"}
                                                isReadOnly={true} // Set as readonly
                                                customStyle="shadow-none text-gray-700 p-0"
                                            />
                                        </td>
                                        <tr>
                                            <td className="font-bold select-none pr-6 py-1 whitespace-nowrap align-top text-gray-800">
                                                Complexity
                                            </td>
                                            <td>
                                                <CustomSelect
                                                    options={complexityOptions}
                                                    selectedValue={prototype.complexity_level || 1}
                                                    isReadOnly={true} // Set as readonly
                                                    customStyle="shadow-none text-gray-700 p-0"
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex w-full">
                                <div className="flex text-gray-800 font-bold select-none w-32 align-top mt-1.5">
                                    Tags
                                </div>
                                {Object.keys(prototype.tags ?? {}).length === 0 && !canEdit && (
                                    <div className="mt-3 select-none">No tags</div>
                                )}
                                {canEdit && isEditing && (
                                    <div className="flex">
                                        <TagSelection
                                            selectedTagsState={[
                                                tags,
                                                async (dispatch) => {
                                                    const newSelectedTags =
                                                        typeof dispatch === "function" ? dispatch(tags) : dispatch;
                                                    await updateDoc(doc(REFS.prototype, prototype.id), {
                                                        tags: newSelectedTags,
                                                    });
                                                    triggerSnackbar("Updated Tags");
                                                    // Update the tags state variable instead of reloading the page
                                                    setTags(newSelectedTags);
                                                },
                                            ]}
                                        />
                                    </div>
                                )}
                                <div className="pt-1">
                                    <TagDisplay categoryAndTags={tags} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* <div className="flex w-full px-2 my-3 border-t border border-gray-200"></div> */}
            <div className="flex w-full">
                <EditableCustomerJourney tableRef={editableTableRef} ref={editableCJRef} editing={isEditing} />
            </div>
        </div>
    );
});

export default Journey;
