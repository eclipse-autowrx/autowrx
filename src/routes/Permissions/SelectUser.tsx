import { Autocomplete } from "@mui/material"
import clsx from "clsx"
import { FC, useState } from "react"
import { HiCheck } from "react-icons/hi"
import { getUsers } from "../../apis"
import { User } from "../../apis/models"
import AutoCompleteInputRender from "../../reusable/AutoComplete"
import Button from "../../reusable/Button"
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh"
import styles from "./SelectUser.module.scss"

const SelectUser: FC<{
    onSelect: (userId: string) => void
    excludeUserIds?: string[]
}> = ({onSelect, excludeUserIds}) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const {value: users, loading} = useAsyncRefresh(() => getUsers(), [])

    const onConfirm = () => {
        if (selectedUser === null) {
            // Shouldn't be possible
            return
        }
        onSelect(selectedUser.uid)
    }

    const filteredUsers = (users ?? []).filter(user => !(excludeUserIds ?? []).includes(user.uid))

    return (
        <div className="flex w-full py-4">
            <Autocomplete
            className={clsx("!w-full", styles.SelectUser)}
            isOptionEqualToValue={(user, value) => user.uid === value.uid}
            getOptionLabel={(user) => user.name}
            options={filteredUsers}
            loading={loading}
            renderInput={(params) => <AutoCompleteInputRender loading={loading} label="Select User" {...params} /> }
            onChange={(event, newValue) => {
                setSelectedUser(newValue)
            }}
            />
            <Button className="ml-2" onClick={onConfirm} disabled={selectedUser === null}>
                <HiCheck className="text-aiot-blue" style={{transform: "scale(1.5)"}}/>
            </Button>
        </div>
    )
}

export default SelectUser