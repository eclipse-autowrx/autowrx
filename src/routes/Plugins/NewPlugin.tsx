import { doc, setDoc, Timestamp } from "firebase/firestore"
import { FC, useState } from "react"
import { HiSelector } from "react-icons/hi"
import { IoClose } from "react-icons/io5"
import { REFS } from "../../apis/firebase"
import { Model, Prototype } from "../../apis/models"
import { useCurrentModelPermissions } from "../../permissions/hooks"
import Button from "../../reusable/Button"
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import Input from "../../reusable/Input/Input"
import InputContainer from "../../reusable/Input/InputContainer"
import SideNav from "../../reusable/SideNav/SideNav"
import LoginPopup from "../components/LoginPopup"
import SelectPrototype from "./SelectPrototype"

interface NewPluginProps {
    trigger?: React.ReactElement
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}


const NewPlugin: FC<NewPluginProps> = ({state: statePassed, trigger}) => {
    const selfManaged = useState(false)
    const state = statePassed ?? selfManaged

    const { isLoggedIn, user } = useCurrentUser()
    const model = useCurrentModel() as Model
    const modelPermissions = useCurrentModelPermissions()

    const States = {
        Name: useState(""),
        Description: useState(""),
        JSCode: useState(""),
        Prototype: useState<Prototype | null>(null)
    }

    const createPlugin = async () => {
        if (user === null) {
            return
        }
        const newDocRef = doc(REFS.plugin);

        const updateObj: any = {
            id: newDocRef.id,
            created: {
                created_time: Timestamp.now(),
                user_uid: user.uid
            },
            description: States.Description[0],
            image_file: "",
            model_id: model.id,
            name: States.Name[0],
            js_code_url: States.JSCode[0],
        }

        if (States.Prototype[0] !== null) {
            updateObj.prototype_id = States.Prototype[0].id
        }

        await setDoc(
            newDocRef, 
            updateObj
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
                    <InputContainer label="Description" input={<Input state={States.Description} />} />
                    <InputContainer label="JS Code" input={<Input state={States.JSCode} />} />
                    {/* <InputContainer label="Linked Prototype" input={
                        <div className="flex text-gray-500 py-1 items-center">
                            <SelectPrototype
                            trigger={
                                <div className="flex items-center w-full text-gray-500 transition cursor-pointer">
                                    <div>{States.Prototype[0] === null ? "Select Prototype" : States.Prototype[0].name}</div>
                                    <HiSelector className="ml-auto text-lg" />
                                </div>
                            }
                            selectPrototype={async (prototype) => {
                                States.Prototype[1](prototype)
                            }}
                            />
                            {States.Prototype[0] !== null && (
                                <IoClose className="ml-2 cursor-pointer text-2xl" onClick={() => States.Prototype[1](null)} />
                            )}
                        </div>
                    } /> */}
                    <div className="mt-auto">
                        <Button className="py-1 w-fit ml-auto" variant="success" onClick={createPlugin}>Create</Button>
                    </div>
                </div>
            ) : (isLoggedIn ? (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>
                        You don't have the required permissions to create a prototype in this model.
                    </div>
                </div>
            ) : (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>
                        You must be <LoginPopup trigger={<span className="cursor-pointer text-aiot-green/80">logged in</span>}/> to create a prototype.
                    </div>
                </div>
            ))}

        </SideNav>
)
}

export default NewPlugin