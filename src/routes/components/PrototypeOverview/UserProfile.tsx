import { getUser } from "../../../apis"
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh"
import LinkWrap from "../../../reusable/LinkWrap"

interface UserProfilePureProps {
    user_uid: string
}

const UserProfilePure = ({user_uid}: UserProfilePureProps) => {
    const {value: user, loading} = useAsyncRefresh(() => {
        return getUser(user_uid)
    }, [user_uid])

    if (typeof user === "undefined") {
        return <div className="flex h-5 w-32 bg-gray-400/30"></div>
    }
    
    return (
        <div className="flex flex-row items-center">
            <div className="mr-1.5">
                <img
                src={user.image_file}
                alt={user.email}
                className="select-none w-5 h-5 rounded-full overflow-hidden "
                style={{objectFit: "cover"}}
                />
            </div>
            <div>{user.name}</div>
        </div>
    )
}

interface UserProfileProps extends UserProfilePureProps {
    clickable: boolean
}

const UserProfile = ({user_uid, clickable}: UserProfileProps) => {
    return clickable ? (
        <LinkWrap to={`/user/${user_uid}`}>
            <UserProfilePure user_uid={user_uid} />
        </LinkWrap>
    ) : (
        <UserProfilePure user_uid={user_uid} />
    )
}

export default UserProfile