import LinkWrap from "../../../reusable/LinkWrap"
import UserProfile from "./UserProfile"
import clsx from "clsx"
import { Prototype } from "../../../apis/models"
import TagSelection from "../../TagsFilter/TagSelection"
import TagDisplay from "../../TagsFilter/TagDisplay"

interface PrototypeOverviewProps {
    prototype: Prototype
    active: boolean
}

const PrototypeOverview = ({prototype, active}: PrototypeOverviewProps) => {
    return (
        <LinkWrap to={`/model/:model_id/library/prototype/${prototype.id}`}>
            <div className={clsx("w-full space-y-1 transition p-4 border-b", active && "bg-aiot-blue text-white border-transparent")}>
                <div className="text-xl">{prototype.name}</div>
                <UserProfile user_uid={prototype.created.user_uid} clickable={false} />
                <div>{prototype.description.problem}</div>
                <div className="pt-0">
                    <TagDisplay categoryAndTags={prototype.tags ?? []} />
                </div>
            </div>
        </LinkWrap>
    )
}

export default PrototypeOverview