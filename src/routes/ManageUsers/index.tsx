import axios from "axios";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
import { REFS } from "../../apis/firebase";
import idTokenHeaders from "../../apis/idToken";
import { TENANT_ID } from "../../constants";
import permissions from "../../permissions";
import Button from "../../reusable/Button";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Input from "../../reusable/Input/Input";
import InputContainer from "../../reusable/Input/InputContainer";
import SideNav from "../../reusable/SideNav/SideNav";
import TriggerPopup from "../../reusable/triggerPopup/triggerPopup";
import { HiPlus } from "react-icons/hi";
import Popup from "../../reusable/Popup/Popup";
import { HiOutlineSearch } from "react-icons/hi";
import { VscEdit, VscTrash } from "react-icons/vsc";
import triggerConfirmPopup from "../../reusable/triggerPopup/triggerConfirmPopup";

const ManageUsers = () => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([] as any[]);
    const [displayUsers, setDisplayUsers] = useState([] as any[]);
    const searchStringState = useState("");
    const popupState = useState(false);
    const [popupMode, setPopupMode] = useState("create");
    const State = {
        uid: useState(""),
        email: useState(""),
        image_file: useState("/imgs/profile.png"),
        name: useState(""),
        users: useState([] as any[]),
    };

    const { profile } = useCurrentUser();

    useEffect(() => {
        listAllUsers();
    }, []);

    useEffect(() => {
        let searchStrLower = searchStringState[0].toLowerCase();
        setDisplayUsers(
            users
                .filter(
                    (user) =>
                        user.email.toLowerCase().includes(searchStrLower) ||
                        user.name.toLowerCase().includes(searchStrLower)
                )
                .sort((a, b) => a.name.localeCompare(b.name))
        );
    }, [searchStringState[0], users]);

    const listAllUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/.netlify/functions/listAllUser`, {
                headers: await idTokenHeaders(),
            });
            setUsers(res.data || []);
        } catch (err) {
            console.log("err", (err as any).message);
        }
        setLoading(false);
    };

    const createProfile = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/.netlify/functions/createUser?email=${State.email[0]}&name=${State.name[0]}&image_file=${State.image_file[0]}`,
                {
                    headers: await idTokenHeaders(),
                }
            );
            const { email, password } = response.data;

            TriggerPopup(
                <div className="flex flex-col">
                    <div className="text-sm mb-2">
                        <strong className="select-none">Email:</strong> {email}
                    </div>
                    <div className="text-sm mb-2">
                        <strong className="select-none">Password:</strong> {password}
                    </div>
                </div>,
                "!w-fit !min-w-fit"
            );
        } catch (error) {
            TriggerPopup(
                <div className="flex flex-col">
                    <div className="text-sm mb-2">{(error as any).response.data}</div>
                </div>,
                "!w-fit !min-w-fit"
            );
        } finally {
            setLoading(false);
            popupState[1](false);
        }
    };

    const updateProfile = async () => {
        setLoading(true);
        try {
            await axios.get(
                `/.netlify/functions/updateUser?uid=${State.uid[0]}&email=${State.email[0]}&name=${State.name[0]}&image_file=${State.image_file[0]}`,
                {
                    headers: await idTokenHeaders(),
                }
            );
        } catch (error) {
            TriggerPopup(
                <div className="flex flex-col">
                    <div className="text-sm mb-2">{(error as any).response.data}</div>
                </div>,
                "!w-fit !min-w-fit"
            );
        } finally {
            setLoading(false);
            popupState[1](false);
        }
    };

    return (
        <div className="flex flex-col w-full px-8 py-4 items-center">
            {permissions.TENANT(profile).canEdit() ? (
                <>
                    <Popup state={popupState} trigger={<span></span>}>
                        <div className="flex flex-col w-[520px]">
                            <div className="text-xl font-bold mb-2">
                                {popupMode === "create" ? "Create New User" : "Update User"}
                            </div>
                            <div className="flex flex-col w-full p-4">
                                <InputContainer label="Name" input={<Input state={State.name} />} />
                                <InputContainer
                                    label="Email"
                                    input={<Input state={State.email} disabled={popupMode !== "create"} />}
                                />
                                <InputContainer
                                    label="Avatar"
                                    input={<Input form="textarea" state={State.image_file} />}
                                />
                            </div>
                            <div className="flex mt-auto w-full h-fit p-4">
                                <div className="grow" />
                                <Button
                                    variant="neutral"
                                    className="py-1 mr-6"
                                    onClick={() => popupState[1](false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="success"
                                    className="py-1"
                                    onClick={async () => {
                                        if (popupMode === "create") {
                                            await createProfile();
                                        } else {
                                            await updateProfile();
                                        }
                                        await listAllUsers();
                                    }}
                                    disabled={loading}
                                >
                                    {popupMode === "create" ? "Create" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </Popup>

                    <div className="min-w-[960px]">
                        <div className="flex items-center mb-4">
                            <div className="text-2xl font-bold text-slate-700 flex items-center ">
                                Users: <div className="ml-2">{users.length}</div>
                            </div>
                            <div
                                onClick={() => {
                                    popupState[1](true);
                                    setPopupMode("create");
                                }}
                                className="ml-4  flex items-center px-2 py-1 cursor-pointer text-aiot-blue select-none hover:underline hover:font-bold"
                            >
                                <HiPlus size={16} className="text-xl mr-1" />
                                Create New User
                            </div>
                            <div className="grow" />
                            <div className="p-2 w-[320px]">
                                <Input
                                    state={searchStringState}
                                    placeholder="Search name or email"
                                    iconBefore
                                    Icon={HiOutlineSearch}
                                    iconSize={28}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto h-full max-h-[680px] pr-2">
                            {displayUsers &&
                                displayUsers.map((user: any) => (
                                    <div
                                        key={user.id}
                                        className="flex bg-slate-50 rounded mb-3 py-1 px-2 hover:bg-slate-100"
                                    >
                                        <img
                                            src={user.image_file || "/imgs/profile.png"}
                                            alt={user.email}
                                            className="select-none w-16 h-16 rounded-lg overflow-hidden "
                                            style={{ objectFit: "cover" }}
                                            onError={({ currentTarget }) => {
                                                currentTarget.onerror = null; // prevents looping
                                                currentTarget.src = "/imgs/profile.png";
                                            }}
                                        />
                                        <div className="pl-4 grow">
                                            <div className="flex">
                                                <div className="grow">
                                                    <div
                                                        className="font-bold text-lg text-slate-700 leading-tight"
                                                        onClick={() => {
                                                            console.log("user", user.name, user.uid);
                                                        }}
                                                    >
                                                        {user.name}
                                                    </div>
                                                    <div className="text-[12px]">Email: {user.email}</div>
                                                </div>
                                                <div className="flex">
                                                    <div
                                                        className="mx-1 flex pl-1 pr-1 justify-center items-center 
                                                        w-fit text-gray-600 hover:bg-gray-200 
                                                        active:bg-gray-200 transition cursor-pointer ml-auto"
                                                        onClick={() => {
                                                            State.uid[1](user.uid);
                                                            State.email[1](user.email);
                                                            State.image_file[1](user.image_file);
                                                            State.name[1](user.name);
                                                            popupState[1](true);
                                                            setPopupMode("edit");
                                                        }}
                                                    >
                                                        <VscEdit className="mx-1" />
                                                    </div>
                                                    <div
                                                        className="flex pl-1 pr-1 justify-center items-center 
                                                        w-fit text-red-500 hover:bg-red-100 
                                                        active:bg-red-100 transition cursor-pointer ml-auto"
                                                        onClick={() =>
                                                            triggerConfirmPopup(
                                                                `Are you sure you want to delete user'${user.name}'?`,
                                                                async () => {
                                                                    await axios.delete(
                                                                        `/.netlify/functions/deleteUser?uid=${user.uid}`,
                                                                        {
                                                                            headers: await idTokenHeaders(),
                                                                        }
                                                                    );
                                                                    await listAllUsers();
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <VscTrash className="mx-1" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[12px] mt-1 flex">
                                                <div className="flex items-center">
                                                    {user.roles && (
                                                        <>
                                                            <div>Role: </div>
                                                            {Array.isArray(user.roles.tenant_admin) &&
                                                                user.roles.tenant_admin.length > 0 && (
                                                                    <div className="ml-2 px-2 rounded-full bg-slate-300">
                                                                        Admin
                                                                    </div>
                                                                )}
                                                            {Array.isArray(user.roles.model_contributor) &&
                                                                user.roles.model_contributor.length > 0 && (
                                                                    <div className="ml-2 px-2 rounded-full bg-slate-300">
                                                                        Model Contributor
                                                                    </div>
                                                                )}
                                                            {Array.isArray(user.roles.model_member) &&
                                                                user.roles.model_member.length > 0 && (
                                                                    <div className="ml-2 px-2 rounded-full bg-slate-300">
                                                                        Model Member
                                                                    </div>
                                                                )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="grow"></div>
                                                {user.provider && user.provider != "Email" && (
                                                    <div>Provider: {user.provider}</div>
                                                )}
                                                <div className="text-slate-500 ml-4">
                                                    <i>
                                                        Created at:{" "}
                                                        {new Date(
                                                            user.created_time._seconds * 1000 +
                                                                user.created_time._nanoseconds / 1000000
                                                        ).toLocaleString()}
                                                    </i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex w-full justify-center items-center mt-16 select-none">
                    <div className="text-xl text-gray-500">You need to be an admin to manage users.</div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
