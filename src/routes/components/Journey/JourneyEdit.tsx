import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { REFS } from "../../../apis/firebase";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { useCurrentProtototypePermissions } from "../../../permissions/hooks";
import Button from "../../../reusable/Button";
import CustomInput from "../../../reusable/Input/CustomInput";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import { complexityOptions, statusOptions } from "../PrototypeOverview/PrototypeDisplay";
import TagSelection from "../../TagsFilter/TagSelection";
import { CategoryAndTag } from "../../TagsFilter/TagChip";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { addLog } from "../../../apis";

interface InputDescriptionProps {
    name: string;
    state: [string, React.Dispatch<React.SetStateAction<string>>];
    form: "input" | "textarea";
}

const InputDescription = ({ name, state, form }: InputDescriptionProps) => {
    return (
        <tr>
            <td className="font-bold select-none whitespace-nowrap w-32 text-gray-800">{name}</td>
            <td className="align-baseline text-gray-800" style={{ whiteSpace: "break-spaces" }}>
                <CustomInput state={state} form={form} containerClassName={`my-1`} />
            </td>
        </tr>
    );
};

interface JourneyEditProps {
    cancelEditing: () => void;
}
export interface JourneyEditHandle {
    saveProject: () => Promise<void>;
}

const JourneyEdit = forwardRef<JourneyEditHandle, JourneyEditProps>(({ cancelEditing }, ref) => {
    const [loading, setLoading] = useState(false);
    const { profile } = useCurrentUser();
    const prototype = useCurrentPrototype();
    // Initialize the tags state
    const [tags, setTags] = useState<CategoryAndTag[]>(prototype?.tags ?? []);
    const [inputSomething, setInputSomething] = useState("");

    // Update the tags state when the `prototype` changes
    useEffect(() => {
        setTags(prototype?.tags ?? []);
        // console.log("prototype changed" + prototype?.tags)
        // check if prototype and prototype.tags are defined
        // if (prototype?.tags) {
        //     prototype.tags.forEach((tag, index) => {
        //         console.log(`Tag ${index} category name: ${tag.tagCategoryName} tag name: ${tag.tag}`);
        //     });
        // }
    }, [prototype]);

    const States = {
        name: useState(""),
        problem: useState(""),
        says_who: useState(""),
        solution: useState(""),
        status: useState(""),
        complexity: useState(1),
        releaseState: useState(""),
    };

    const canEdit = useCurrentProtototypePermissions().canEdit();

    useEffect(() => {
        if (!canEdit) {
            cancelEditing();
        }
    }, [canEdit, cancelEditing]);

    useEffect(() => {
        States.name[1](prototype?.name ?? "");
        States.problem[1](prototype?.description.problem ?? "");
        States.says_who[1](prototype?.description.says_who ?? "");
        States.solution[1](prototype?.description.solution ?? "");
        States.status[1](prototype?.description.status ?? "");
        States.complexity[1](prototype?.complexity_level ?? 1);
        States.releaseState[1](prototype?.state ?? "development");
    }, [prototype?.id]);

    if (typeof prototype === "undefined") {
        return null;
    }

    const saveProject = async () => {
        setLoading(true);
        // console.log("complexity ", States.complexity[0])
        await updateDoc(doc(REFS.prototype, prototype.id), {
            name: States.name[0],
            description: {
                problem: States.problem[0],
                says_who: States.says_who[0],
                solution: States.solution[0],
                status: States.status[0],
            },
            state: States.releaseState[0],
            complexity_level: States.complexity[0],
        });
        setLoading(false);
        if (profile) {
            const username = profile.name || profile.name || "Anonymous";

            addLog(
                `User '${username}' update prototype journey with id '${prototype.id}'`,
                `User '${username}' update prototype journey with id '${prototype.id}'`,
                "update",
                profile.uid,
                null,
                prototype.id,
                "prototype",
                null
            );
        }
        window.location.href = `/model/${prototype.model_id}/library/prototype/${prototype.id}/view/journey`;
    };

    useImperativeHandle(ref, () => ({
        saveProject,
    }));

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex flex-col w-full h-full">
                <div className="flex mb-1.5 items-center">
                    <div className="w-32 font-bold select-none pr-4 whitespace-nowrap text-gray-800">Protoype Name</div>
                    <CustomInput state={States.name} />
                </div>
                <table className="table-auto leading-relaxed">
                    <InputDescription name="Problem" state={States.problem} form="input" />
                    <InputDescription name="Says who?" state={States.says_who} form="input" />
                    <InputDescription name="Solution" state={States.solution} form="textarea" />
                    <tr>
                        <td className="w-32 font-bold select-none pr-2 whitespace-nowrap align-top text-gray-800 pt-2">
                            Complexity
                        </td>
                        <td className="align-baseline pt-1" style={{ whiteSpace: "break-spaces" }}>
                            <CustomSelect
                                options={complexityOptions}
                                selectedValue={States.complexity[0]}
                                onValueChange={(value) => {
                                    if (typeof value === "number") {
                                        States.complexity[1](value);
                                    }
                                }}
                                customStyle="min-w-[9rem] h-8 px-1 py-1 rounded border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-gray-300 text-sm"
                                customDropdownContainerStyle="min-w-[9rem]"
                                customDropdownItemStyle="px-5 text-sm h-8"
                            />
                        </td>
                    </tr>

                    <tr>
                        <td className="font-bold select-none pr-2 whitespace-nowrap align-top text-gray-800 w-32 pt-2">
                            Status
                        </td>
                        <td className="align-baseline pt-2" style={{ whiteSpace: "break-spaces" }}>
                            <CustomSelect
                                options={statusOptions}
                                selectedValue={States.releaseState[0]}
                                onValueChange={(value) => {
                                    if (typeof value === "string") {
                                        States.releaseState[1](value);
                                    }
                                }}
                                customStyle="min-w-[9rem] h-8 px-1 py-1 rounded border border-gray-200 bg-white text-gray-500 shadow-sm  hover:border-gray-300 text-sm"
                                customDropdownContainerStyle="min-w-[9rem]"
                                customDropdownItemStyle="px-5 text-sm h-8"
                            />
                        </td>
                    </tr>

                    <tr>
                        <td className="font-bold select-none pt-3 pr-6 py-1 whitespace-nowrap align-top text-gray-800">
                            Tags
                        </td>
                        <td className="align-baseline pt-2" style={{ whiteSpace: "break-spaces" }}>
                            <TagSelection
                                selectedTagsState={[
                                    tags,
                                    async (dispatch) => {
                                        const newSelectedTags =
                                            typeof dispatch === "function" ? dispatch(tags) : dispatch;
                                        await updateDoc(doc(REFS.prototype, prototype.id), {
                                            tags: newSelectedTags,
                                        });
                                        setTags(newSelectedTags);
                                    },
                                ]}
                            />
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    );
});

export default JourneyEdit;
