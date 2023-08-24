import clsx from "clsx"
import { FC } from "react"
import { Prototype } from "../../../apis/models"
import UserProfile from "../../components/PrototypeOverview/UserProfile"

const PrototypeSummaryDisplay: FC<{
    prototype: Prototype
    onClick?: () => void
}> = ({prototype, onClick}) => {
    return (
        <div className={clsx("w-full space-y-1 transition p-4 border-b", onClick && "cursor-pointer")} onClick={onClick}>
            <div className="text-xl">{prototype.name}</div>
            <UserProfile user_uid={prototype.created.user_uid} clickable={false} />
            <div>{prototype.description.problem}</div>
        </div>
    )
}

export default PrototypeSummaryDisplay