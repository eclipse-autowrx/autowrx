import axios from "axios"
import { doc, setDoc, Timestamp } from "firebase/firestore"
import { useState } from "react"
import { REFS } from "../../apis/firebase"
import idTokenHeaders from "../../apis/idToken"
import { TENANT_ID } from "../../constants"
import permissions from "../../permissions"
import Button from "../../reusable/Button"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import Input from "../../reusable/Input/Input"
import InputContainer from "../../reusable/Input/InputContainer"
import SideNav from "../../reusable/SideNav/SideNav"
import TriggerPopup from "../../reusable/triggerPopup/triggerPopup"

const ManageUsers = () => {
    const [loading, setLoading] = useState(false)
    const State = {
        uid: useState(""),
        email: useState(""),
        image_file: useState("https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/users%2Fperson.png?alt=media&token=df7759f6-37d2-4d57-a684-5463b9e4e86c"),
        name: useState("")
    }

    const {profile} = useCurrentUser()

    const createProfile = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`/.netlify/functions/createUser?email=${State.email[0]}&name=${State.name[0]}&image_file=${State.image_file[0]}`, {
                headers: await idTokenHeaders()
            })
            const {email, password} = response.data
    
            TriggerPopup(
                <div className="flex flex-col">
                    <div className="text-sm mb-2"><strong className="select-none">Email:</strong> {email}</div>
                    <div className="text-sm mb-2"><strong className="select-none">Password:</strong> {password}</div>
                </div>,
                "!w-fit !min-w-fit"
            )
        } catch (error) {
            TriggerPopup(
                <div className="flex flex-col">
                    <div className="text-sm mb-2">{(error as any).response.data}</div>
                </div>,
                "!w-fit !min-w-fit"
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col w-full p-4">
            {permissions.TENANT(profile).canEdit() ? (
                <div className="flex flex-col w-full h-full">
                    <div className="text-xl font-bold mb-2">Create New User</div>
                    <div className="flex flex-col w-full p-4">
                        <InputContainer label="name" input={<Input state={State.name} />} />
                        <InputContainer label="email" input={<Input state={State.email} />} />
                        <InputContainer label="image_file" input={<Input state={State.image_file} />} />
                    </div>
                    <div className="flex mt-auto w-full h-fit p-4">
                        <Button variant="success" className="py-1 ml-auto" onClick={createProfile} disabled={loading}>
                            Create
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex w-full justify-center items-center mt-16 select-none">
                    <div className="text-xl text-gray-500">You need to be an admin to manage users.</div>
                </div>
            )}
        </div>
    )
}

export default ManageUsers