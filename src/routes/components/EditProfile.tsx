import { updateDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { REFS } from "../../apis/firebase";
import Button from "../../reusable/Button";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Input from "../../reusable/Input/Input";
import InputContainer from "../../reusable/Input/InputContainer";
import SelectMedia from "./EditPrototype/SelectMedia";

import { updatePassword } from "@firebase/auth";
import { auth } from "../../apis/firebase";
import { HiLockClosed } from "react-icons/hi";

const EditProfile = () => {
    const { isLoggedIn, profile, user } = useCurrentUser();
    const inputPassword = useState("");
    const [displayError, setDisplayError] = useState<null | string>(null);
    const [message, setMessage] = useState<null | string>(null);
    const [loading, setLoading] = useState(false);
    const [showUpdatePwd, setShowUpdatePwd] = useState(false);
    const States = {
        Name: useState(""),
    };

    useEffect(() => {
        States.Name[1](profile?.name ?? "");
    }, [profile?.uid, profile?.name, profile?.email]);

    const tryUpdatePass = async () => {
        if (!user) return;
        setMessage("");
        setDisplayError("");
        if (!inputPassword[0] || inputPassword[0].length < 8) {
            setDisplayError("Error: password too short, at least 8 characters!");
        }
        try {
            await updatePassword(user, inputPassword[0]);
            setMessage("Set new password successful!");
            setTimeout(() => {
                setShowUpdatePwd(false);
            }, 3000);
        } catch (error) {
            if (!error) return;
            let errorCode = (error as any).code;
            switch (errorCode) {
                default:
                    setDisplayError(errorCode);
                    break;
            }
        }
    };

    return !isLoggedIn || profile === null || user === null ? (
        <div className="flex flex-col justify-center items-center h-full pb-36 select-none">
            <div className="text-9xl text-gray-400 leading-normal">404</div>
            <div className="text-5xl text-gray-400">Nothing found</div>
        </div>
    ) : (
        <div className="w-full h-full flex justify-center">
            <div className="flex max-w-[960px] w-full h-full p-5 mt-4">
                <div className=" flex h-full w-3/6 justify-center p-8">
                    <div className="relative">
                        <SelectMedia
                            trigger={
                                <div className="bg-white absolute top-4 right-4 rounded-full border w-8 h-8 hover:bg-gray-50 active:bg-gray-100 cursor-pointer">
                                    <HiPencil className="w-5 mx-auto h-full text-gray-500" />
                                </div>
                            }
                            selectMedia={async (media) => {
                                await updateDoc(doc(REFS.user, profile.uid), {
                                    image_file: media.imageUrl,
                                });
                                // console.log("selected image url", media.imageUrl);
                                window.location.reload();
                            }}
                        />
                        <img
                            src={profile.image_file || "/imgs/profile.png"}
                            alt={profile.name}
                            className="select-none w-full rounded-full"
                            style={{ width: 220, height: 220, objectFit: "cover" }}
                        />
                    </div>
                </div>
                <div className="flex flex-col h-full w-3/6 ">
                    <div>
                        {/* <InputContainer
                            label="Email"
                            input={<span >{profile.email}</span>}
                            /> */}
                        <div className="my-2 text-slate-400 text-[14px] flex">
                            <div className="w-[120px]">Email:</div> <b>{profile.email}</b>
                        </div>
                        <div className="my-2 text-slate-400 text-[14px] flex">
                            <div className="w-[120px]">Email verified:</div>{" "}
                            <b>{user.emailVerified ? "yes" : "not yet"}</b>
                        </div>

                        <InputContainer label="Name" input={<Input state={States.Name} />} />
                        <div>
                            <Button
                                variant="success"
                                className="py-1 w-fit ml-auto"
                                onClick={async () => {
                                    await updateDoc(doc(REFS.user, profile.uid), {
                                        name: States.Name[0],
                                    });
                                    window.location.reload();
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>

                    {user &&
                        user.providerData &&
                        user.providerData[0] &&
                        user.providerData[0].providerId === "password" && (
                            <div className="mt-12 pt-8 border-t border-slate-200">
                                <div className="flex items-center">
                                    <div className="grow">Do you want to change password?</div>
                                    {!showUpdatePwd && (
                                        <Button
                                            variant="alt"
                                            className="py-1 w-fit ml-auto"
                                            onClick={async () => {
                                                setShowUpdatePwd(true);
                                            }}
                                        >
                                            Change password
                                        </Button>
                                    )}
                                </div>
                                {showUpdatePwd && (
                                    <div className="mt-4">
                                        <div className="flex w-full mb-2">
                                            <Input
                                                state={inputPassword}
                                                type="password"
                                                placeholder="New Password"
                                                defaultValue=""
                                                Icon={HiLockClosed}
                                                iconBefore
                                            />
                                        </div>
                                        {displayError !== null && (
                                            <div className="text-red-500 text-sm mb-3 pl-1">{displayError}</div>
                                        )}
                                        {message !== null && (
                                            <div className="text-green-500 text-sm mb-3 pl-1">{message}</div>
                                        )}

                                        <div className="flex mt-8 items-center">
                                            <div className="grow"></div>
                                            <Button
                                                variant="neutral"
                                                className="py-1 mr-4 w-fit ml-auto"
                                                onClick={() => {
                                                    setShowUpdatePwd(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="success"
                                                className="py-1 w-fit ml-auto"
                                                onClick={tryUpdatePass}
                                            >
                                                Set new password
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
