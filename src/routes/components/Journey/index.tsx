import { deleteDoc, doc, updateDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { VscEdit, VscTrash } from "react-icons/vsc"
import { useNavigate } from "react-router-dom"
import { REFS } from "../../../apis/firebase"
import { Model } from "../../../apis/models"
import useCurrentPrototype from "../../../hooks/useCurrentPrototype"
import { useCurrentProtototypePermissions } from "../../../permissions/hooks"
import Button from "../../../reusable/Button"
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel"
import triggerConfirmPopup from "../../../reusable/triggerPopup/triggerConfirmPopup"
import triggerSnackbar from "../../../reusable/triggerSnackbar"
import { CategoryAndTag } from "../../TagsFilter/TagChip"
import TagDisplay from "../../TagsFilter/TagDisplay"
import TagSelection from "../../TagsFilter/TagSelection"
import DisplayJourneyImage from "./DisplayJourneyImage"
import DisplayPrototypeImage from "./DisplayPrototypeImage"
import JourneyEdit from "./JourneyEdit"

interface DisplayDescriptionProps {
    name: string
    value?: string
}

const DisplayDescription = ({name, value}: DisplayDescriptionProps) => {
    return (
        <tr>
            <td className="font-bold select-none pr-2 whitespace-nowrap align-top">{name}</td>
            <td className="align-baseline" style={{whiteSpace: "break-spaces"}}>{value}</td>
        </tr>
    )
}

const Journey = () => {
    const prototype = useCurrentPrototype()
    const canEdit = useCurrentProtototypePermissions().canEdit()
    const [editing, setEditing] = useState(false)

    const navigate = useNavigate()
    const model = useCurrentModel() as Model

    if (typeof prototype === "undefined") {
        return null
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex p-3">
                <div className="flex w-2/6 px-2">
                    <DisplayPrototypeImage/>
                </div>
                <div className="flex flex-col relative w-4/6 px-2">
                    {editing ? (
                        <JourneyEdit cancelEditing={() => setEditing(false)} />
                    ) : (
                        <>
                            {canEdit && (
                                <div className="flex absolute top-3 right-3 z-10">
                                    <Button className="mr-1 pl-2 pr-2 py-1.5" onClick={() => {
                                        triggerConfirmPopup("Are you sure you want to delete this prototype?", async () => {
                                            await deleteDoc(doc(REFS.prototype, prototype.id))
                                            navigate(`/model/${model.id}/library`)
                                        })
                                    }} variant="failure">
                                        <VscTrash className="mx-auto"/>
                                    </Button>
                                    <Button className="mr-2 pl-2 pr-2 py-1.5" onClick={() => setEditing(true)}>
                                        <VscEdit className="mx-auto"/>
                                    </Button>
                                </div>
                            )}
                            <div className="text-2xl mb-3">{prototype.name}</div>
                            <table className="table-auto leading-relaxed">
                                <DisplayDescription name="Problem" value={prototype.description.problem} />
                                <DisplayDescription name="Says who?" value={prototype.description.says_who} />
                                <DisplayDescription name="Solution" value={prototype.description.solution} />
                                <DisplayDescription name="Status" value={prototype.description.status} />
                            </table>
                            <div className="flex flex-col mt-3">
                                <div className="text-xl select-none">Tags</div>
                                {(Object.keys(prototype.tags ?? {}).length === 0 && !canEdit) && (
                                    <div className="mt-2 select-none">No tags</div>
                                )}
                                {canEdit ? (
                                    <TagSelection
                                    selectedTagsState={[prototype.tags ?? [], async (dispatch) => {
                                        const newSelectedTags = typeof dispatch === "function" ? dispatch(prototype.tags ?? []) : dispatch
                                        await updateDoc(doc(REFS.prototype, prototype.id), {
                                            tags: newSelectedTags
                                        })
                                        triggerSnackbar("Updated Tags")
                                        window.location.reload()
                                    }]}
                                    />
                                ) : (
                                    <TagDisplay categoryAndTags={prototype.tags ?? []} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <DisplayJourneyImage/>
        </div>
    )
}

export default Journey