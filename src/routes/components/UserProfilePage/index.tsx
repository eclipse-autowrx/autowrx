import permissions from "../../../permissions";
import { useCurrentTenantModels } from "../../../reusable/hooks/useCurrentTenantModels";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";

const UserProfilePage = () => {
    const { profile } = useCurrentUser();
    const models = useCurrentTenantModels();

    if (profile === null) {
        return null;
    }

    return (
        <div className="flex w-full h-full p-5">
            <div className="flex h-full w-2/6 justify-center p-8">
                <div className="relative">
                    <img
                        src={profile.image_file}
                        alt={profile.email}
                        className="select-none w-full rounded-full"
                        style={{ width: 220, height: 220, objectFit: "cover" }}
                    />
                </div>
            </div>
            <div className="flex flex-col h-full w-4/6">
                <div className="text-4xl">{profile.name}</div>
                <div className="mt-2 bg-purple-600 w-fit text-white px-2 font-bold text-sm rounded-sm select-none">
                    {permissions.TENANT(profile).canEdit() && "Admin"}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
