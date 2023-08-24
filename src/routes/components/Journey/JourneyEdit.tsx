import { doc, updateDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { REFS } from "../../../apis/firebase"
import useCurrentPrototype from "../../../hooks/useCurrentPrototype"
import { useCurrentProtototypePermissions } from "../../../permissions/hooks"
import Button from "../../../reusable/Button"
import Input from "../../../reusable/Input/Input"

interface InputDescriptionProps {
    name: string
    state: [string, React.Dispatch<React.SetStateAction<string>>]
    form: "input" | "textarea"
}

const InputDescription = ({name, state, form}: InputDescriptionProps) => {
    return (
        <tr>
            <td className="font-bold select-none pr-2 whitespace-nowrap align-top">{name}</td>
            <td className="align-baseline" style={{whiteSpace: "break-spaces"}}>
                <Input
                state={state}
                form={form}
                className={form === "input" ? "" : "h-7"}
                containerClassName="py-1"
                />
            </td>
        </tr>
    )
}

interface JourneyEditProps {
    cancelEditing: () => void
}

const JourneyEdit = ({cancelEditing}: JourneyEditProps) => {
    const [loading, setLoading] = useState(false)
    const prototype = useCurrentPrototype()

    const States = {
        name: useState(""),
        problem: useState(""),
        says_who: useState(""),
        solution: useState(""),
        status: useState(""),
    }

    const canEdit = useCurrentProtototypePermissions().canEdit()
    
    useEffect(() => {
        if (!canEdit) {
            cancelEditing()
        }
    }, [canEdit, cancelEditing])

    useEffect(() => {
        States.name[1](prototype?.name ?? "")
        States.problem[1](prototype?.description.problem ?? "")
        States.says_who[1](prototype?.description.says_who ?? "")
        States.solution[1](prototype?.description.solution ?? "")
        States.status[1](prototype?.description.status ?? "")
    }, [prototype?.id])

    if (typeof prototype === "undefined") {
        return null
    }

    const saveProject = async () => {
        setLoading(true)
        await updateDoc(doc(REFS.prototype, prototype.id), {
            name: States.name[0],
            description: {
                problem: States.problem[0],
                says_who: States.says_who[0],
                solution: States.solution[0],
                status: States.status[0],
            }
        })
        setLoading(false)
        window.location.href = (`/model/${prototype.model_id}/library/prototype/${prototype.id}/view/journey`)
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-col w-full h-full">
                <div className="flex flex-col mb-3">
                    <Input state={States.name} containerClassName="py-2" />
                </div>
                <table className="table-auto leading-relaxed">
                    <InputDescription name="Problem" state={States.problem} form="input" />
                    <InputDescription name="Says who?" state={States.says_who} form="input" />
                    <InputDescription name="Solution" state={States.solution} form="textarea" />
                    <InputDescription name="Status" state={States.status} form="input" />
                </table>
                {loading ? (
                    <Button className="w-fit p-1 ml-auto mt-2" disabled>
                        Loading
                    </Button>
                ) : (
                    <div className="flex">
                        <Button className="w-fit p-1 ml-auto mt-2" onClick={cancelEditing} variant="failure">
                            Cancel
                        </Button>
                        <Button className="w-fit p-1 ml-2 mt-2" onClick={saveProject} variant="success">
                            Save
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default JourneyEdit