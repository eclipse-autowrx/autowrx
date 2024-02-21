import { getUser } from "../../../apis";
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh";
import LinkWrap from "../../../reusable/LinkWrap";

interface UserProfilePureProps {
    user_uid: string;
    customStyle?: string;
}

const UserProfilePure = ({ user_uid, customStyle }: UserProfilePureProps) => {
    const { value: user, loading } = useAsyncRefresh(() => {
        return getUser(user_uid);
    }, [user_uid]);

    if (typeof user === "undefined") {
        return <div className="flex h-5 w-32 bg-gray-400/30"></div>;
    }

    return (
        <div className="flex flex-row items-center">
            <div className="mr-1.5">
                <img
                    src={user.image_file || "/imgs/profile.png"}
                    alt={user.email}
                    className="flex select-none w-4 h-auto rounded-full overflow-hidden"
                    style={{ objectFit: "cover" }}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null; // prevents looping
                        currentTarget.src = "/imgs/profile.png";
                    }}
                />
            </div>
            <div className={customStyle}>{user.name}</div>
        </div>
    );
};

interface UserProfileProps extends UserProfilePureProps {
    clickable: boolean;
    customStyle?: string;
}

const UserProfile = ({ user_uid, clickable, customStyle }: UserProfileProps) => {
    return clickable ? (
        <LinkWrap to={`/user/${user_uid}`}>
            <UserProfilePure customStyle={customStyle} user_uid={user_uid} />
        </LinkWrap>
    ) : (
        <UserProfilePure user_uid={user_uid} />
    );
};

export default UserProfile;
