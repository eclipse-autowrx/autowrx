import { FieldPath, where } from "firebase/firestore"
import { FC, useState } from "react"
import { HiMinus } from "react-icons/hi"
import { getUsers } from "../../apis"
import { REFS } from "../../apis/firebase"
import { Model, User } from "../../apis/models"
import Button from "../../reusable/Button"
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh"
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel"
import useCurrentUser from "../../reusable/hooks/useCurrentUser"
import triggerConfirmPopup from "../../reusable/triggerPopup/triggerConfirmPopup"
import triggerSnackbar from "../../reusable/triggerSnackbar"
import LoadingPage from "../components/LoadingPage"
import { addNewRole, changeVisibility, removeRole } from "./changePermissions"
import SelectUser from "./SelectUser"

const DisplayUserRow: FC<{
    user: User
    onRemove: (user_id: string) => void
}> = ({user, onRemove}) => {
    return (
        <div className="flex py-2">
            <div className="flex flex-col w-full">
                <div className="font-bold">{user.name}</div>
                <div className="text-gray-600">{user.email}</div>
            </div>
            <Button onClick={() => {
                triggerConfirmPopup(
                    "Are you sure you want to remove this user?",
                    () => onRemove(user.uid)
                )
            }}>
                <HiMinus style={{transform: "scale(1.4)"}}/>
            </Button>
        </div>
    )
}

const ModelPermissions = () => {
    const model = useCurrentModel() as Model
    const [refreshCounter, setRefreshCounter] = useState(0)
    const {user} = useCurrentUser()

    const {value: results, loading} = useAsyncRefresh(async () => {
        return await Promise.all([
            getUsers(where(new FieldPath("roles", "model_contributor"), "array-contains", model.id)),
            getUsers(where(new FieldPath("roles", "model_member"), "array-contains", model.id))
        ])
    }, [refreshCounter], null)

    const [contributors, members] = results ?? [[], []]

    const addNewRoleLocal = async (user_id: string, role: "model_member" | "model_contributor") => {
        await addNewRole(model, user_id, role)
        setRefreshCounter(counter => counter + 1)
        if (user_id === user?.uid) {
            triggerSnackbar("Role added. Refresh to see new permissions.")            
        }
    }

    const removeRoleLocal = async (user_id: string, role: "model_member" | "model_contributor") => {
        await removeRole(model, user_id, role)
        setRefreshCounter(counter => counter + 1)
    }

    const changeVisibilityLocal = async (visibility: "public" | "private") => {
        await changeVisibility(model, visibility)
    }

    const visibility: "public" | "private" = model.visibility ?? "public"

    return loading ? <LoadingPage/> : (
        <div className="flex flex-col py-3">
            <div className="flex w-fit px-6 text-gray-500 items-center select-none ml-auto">
                <div className="font-bold mr-2">Visibility:</div>
                <Button variant={visibility === "private" ? "failure" : "success"} className="capitalize py-1 text-sm" onClick={async () => {
                    await changeVisibilityLocal(visibility === "private" ? "public" : "private")
                    window.location.reload()
                }}>{visibility}</Button>
            </div>
            <div className="flex p-3">
                <div className="flex flex-col w-1/2 px-3">
                    <div className="text-gray-500 font-bold text-sm mb-2">CONTRIBUTOR</div>
                    {(contributors ?? []).map(user => (
                        <DisplayUserRow user={user} onRemove={user_id => removeRoleLocal(user_id, "model_contributor")} />
                    ))}
                    <SelectUser
                    onSelect={(userId) => addNewRoleLocal(userId, "model_contributor")}
                    excludeUserIds={contributors.map(user => user.uid)}
                    />
                </div>
                <div className="flex flex-col w-1/2 px-3">
                    <div className="text-gray-500 font-bold text-sm mb-2">MEMBER</div>
                    {(members ?? []).map(user => (
                        <DisplayUserRow user={user} onRemove={user_id => removeRoleLocal(user_id, "model_member")} />
                    ))}
                    <SelectUser
                    onSelect={(userId) => addNewRoleLocal(userId, "model_member")}
                    excludeUserIds={members.map(user => user.uid)}
                    />
                </div>
            </div>
        </div>
    )
}

export default ModelPermissions