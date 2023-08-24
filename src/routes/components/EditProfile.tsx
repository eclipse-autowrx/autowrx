import { updateDoc, doc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { HiPencil } from "react-icons/hi"
import { REFS } from "../../apis/firebase"
import Button from "../../reusable/Button"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import Input from "../../reusable/Input/Input"
import InputContainer from "../../reusable/Input/InputContainer"
import SelectMedia from "./EditPrototype/SelectMedia"

const EditProfile = () => {
    const {isLoggedIn, profile, user} = useCurrentUser()

    const States = {
        Name: useState(""),
    }

    useEffect(() => {
        States.Name[1](profile?.name ?? "")
    }, [profile?.uid, profile?.name, profile?.email])
    
    return (!isLoggedIn || profile === null || user === null) ? (
        <div className="flex flex-col justify-center items-center h-full pb-36 select-none">
            <div className="text-9xl text-gray-400 leading-normal">404</div>
            <div className="text-5xl text-gray-400">Nothing found</div>
        </div>
    ) : (
        <div className="flex w-full h-full p-5">
            <div className="flex h-full w-2/6 justify-center p-8">
                <div className="relative">
                    <SelectMedia
                    trigger={
                        <div className="bg-white absolute top-4 right-4 rounded-full border w-8 h-8 hover:bg-gray-50 active:bg-gray-100 cursor-pointer">
                            <HiPencil className="w-5 mx-auto h-full text-gray-500" />
                        </div>
                    }
                    selectMedia={async (media) => {
                        await updateDoc(doc(REFS.user, profile.uid), {
                            image_file: media.imageUrl
                        })
                        window.location.reload()
                    }}
                    />
                    <img
                    src={profile.image_file}
                    alt={profile.email}
                    className="select-none w-full rounded-full"
                    style={{width: 220, height: 220, objectFit: "cover"}}
                    />
                </div>
            </div>
            <div className="flex flex-col h-full w-4/6">
                <InputContainer
                label="Email"
                input={<span >{profile.email}</span>}
                />
                <InputContainer
                label="Name"
                input={<Input state={States.Name} />}
                />
                <div>
                    <Button
                    variant="success"
                    className="py-1 w-fit ml-auto"
                    onClick={async () => {
                        await updateDoc(doc(REFS.user, profile.uid), {
                            name: States.Name[0]
                        })
                        window.location.reload()
                    }}
                    >Save</Button>
                </div>
            </div>
        </div>
    )
}

export default EditProfile