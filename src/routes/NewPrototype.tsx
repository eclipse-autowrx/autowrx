import { doc, setDoc, Timestamp } from "firebase/firestore"
import { FC, useState } from "react"
import { REFS } from "../apis/firebase"
import { Model } from "../apis/models"
import Button from "../reusable/Button"
import Input from "../reusable/Input/Input"
import InputContainer from "../reusable/Input/InputContainer"
import SideNav from "../reusable/SideNav/SideNav"
import useCurrentUser from "../reusable/hooks/useCurrentUser"
import { useCurrentModel } from "../reusable/hooks/useCurrentModel"
import LoginPopup from "./components/LoginPopup"
import { useCurrentModelPermissions, useCurrentProtototypePermissions } from "../permissions/hooks"

interface NewPrototypeProps {
    trigger?: React.ReactElement
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}


const NewPrototype: FC<NewPrototypeProps> = ({state: statePassed, trigger}) => {
    const selfManaged = useState(false)
    const state = statePassed ?? selfManaged

    const { isLoggedIn, user } = useCurrentUser()
    const model = useCurrentModel() as Model
    const modelPermissions = useCurrentModelPermissions()

    const States = {
        Name: useState(""),
        Problem: useState(""),
        SaysWho: useState(""),
        Solution: useState(""),
        Status: useState("")
    }

    const createPrototype = async () => {
        if (user === null) {
            return
        }
        const newDocRef = doc(REFS.prototype);
        await setDoc(
            newDocRef, 
            {
                id: newDocRef.id,
                apis: {
                    VSS: [],
                    VSC: []
                },
                code: "",
                created: {
                    created_time: Timestamp.now(),
                    user_uid: user.uid
                },
                description: {
                    problem: States.Problem[0],
                    says_who: States.SaysWho[0],
                    solution: States.Solution[0],
                    status: States.Status[0],
                },
                image_file: "",
                model_id: model.id,
                name: States.Name[0],
                portfolio: {
                    effort_estimation: 0,
                    needs_addressed: 0,
                    relevance: 0,
                },
                rated_by: {}
            }
        )
        window.location.reload()
    }

    return (
        <SideNav
        trigger={typeof trigger === "undefined" ? <></> : trigger}
        state={state}
        width="400px"
        className="h-full"
        >
            {modelPermissions.canEdit() ? (
                <div className="flex flex-col h-full w-full p-4">
                    <InputContainer label="Name" input={<Input state={States.Name} />} />
                    <div className="mb-3 text-sm font-bold text-gray-400">Description</div>
                    <InputContainer label="Problem" input={<Input state={States.Problem} />} />
                    <InputContainer label="Says who?" input={<Input state={States.SaysWho} />} />
                    <InputContainer label="Solution" input={<Input state={States.Solution} />} />
                    <InputContainer label="Status" input={<Input state={States.Status} />} />
                    <div className="mt-auto">
                        <Button className="py-1 w-fit ml-auto" variant="success" onClick={createPrototype}>Create</Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>
                        You don't have permissions <LoginPopup trigger={<span className="cursor-pointer text-aiot-green/80">logged in</span>}/> to create a prototype.
                    </div>
                </div>
            )}

        </SideNav>
)
}

export default NewPrototype