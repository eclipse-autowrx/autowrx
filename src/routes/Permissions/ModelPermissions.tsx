import { FieldPath, where } from "firebase/firestore";
import { FC, useState } from "react";
import { getUsers } from "../../apis";
import { REFS } from "../../apis/firebase";
import { Model, User } from "../../apis/models";
import Button from "../../reusable/Button";
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import triggerConfirmPopup from "../../reusable/triggerPopup/triggerConfirmPopup";
import triggerSnackbar from "../../reusable/triggerSnackbar";
import LoadingPage from "../components/LoadingPage";
import { addNewRole, changeVisibility, removeRole } from "./changePermissions";
import { TbUsersPlus } from "react-icons/tb";
import clsx from "clsx";
import DisplayUserRow from "./DisplayUserRow";
import SelectUserPopup from "../components/core/User/SelectUserPopup";

const ModelPermissions = () => {
    const model = useCurrentModel() as Model;
    const [refreshCounter, setRefreshCounter] = useState(0);
    const { user } = useCurrentUser();

    const roles = ["Contributor", "Member"];
    const [activeRole, setActiveRole] = useState("Contributor");
    const popupState = useState(false);

    const { value: results, loading } = useAsyncRefresh(
        async () => {
            return await Promise.all([
                getUsers(where(new FieldPath("roles", "model_contributor"), "array-contains", model.id)),
                getUsers(where(new FieldPath("roles", "model_member"), "array-contains", model.id)),
            ]);
        },
        [refreshCounter],
        null
    );

    const [contributors, members] = results ?? [[], []];

    const addNewRoleLocal = async (user_id: string, role: "model_member" | "model_contributor") => {
        await addNewRole(model, user_id, role);
        setRefreshCounter((counter) => counter + 1);
        if (user_id === user?.uid) {
            triggerSnackbar("Role added. Refresh to see new permissions.");
        }
    };

    const removeRoleLocal = async (user_id: string, role: "model_member" | "model_contributor") => {
        await removeRole(model, user_id, role);
        setRefreshCounter((counter) => counter + 1);
    };

    const changeVisibilityLocal = async (visibility: "public" | "private") => {
        await changeVisibility(model, visibility);
    };

    const visibility: "public" | "private" = model.visibility ?? "public";

    return loading ? (
        <LoadingPage />
    ) : (
        <div className="flex justify-center">
            <div className="w-full max-w-[1024px]">
                <div className="flex text-gray-500 px-4 py-1 bg-gray-50 items-center select-none rounded border border-gray-300">
                    <div className="mr-4">Visibility:</div>
                    <div className="font-bold w-20">{visibility}</div>
                    <div
                        className="hover:underline cursor-pointer ml-auto px-2 py-1 text-aiot-blue font-bold text-sm"
                        onClick={async () => {
                            if (
                                !confirm(
                                    `Confirm change model '${model.name}' visibility to ${
                                        visibility === "private" ? "public" : "private"
                                    }?`
                                )
                            )
                                return;
                            await changeVisibilityLocal(visibility === "private" ? "public" : "private");
                            window.location.reload();
                        }}
                    >
                        Change to {visibility === "private" ? "public" : "private"}
                    </div>
                    {/* <Button variant={visibility === "private" ? "failure" : "success"} className="capitalize py-1 text-sm" onClick={async () => {
                        await changeVisibilityLocal(visibility === "private" ? "public" : "private")
                        window.location.reload()
                    }}>{visibility}</Button> */}
                </div>
                <div className="flex mt-4 py-1 justify-between">
                    <div className="flex text-gray-400 text-sm space-x-2 select-none">
                        <div
                            onClick={() => {
                                setActiveRole("Contributor");
                            }}
                            className={clsx(
                                "py-1 px-1 cursor-pointer hover:bg-gray-100",
                                activeRole === "Contributor" && "font-bold border-b-2 border-aiot-blue text-aiot-blue"
                            )}
                        >
                            Contributor ({contributors?.length || 0})
                        </div>
                        <div
                            onClick={() => {
                                setActiveRole("Member");
                            }}
                            className={clsx(
                                "py-1 px-1 cursor-pointer hover:bg-gray-100",
                                activeRole === "Member" && "font-bold border-b-2 border-aiot-blue text-aiot-blue"
                            )}
                        >
                            Member ({members?.length || 0})
                        </div>
                    </div>
                    <Button
                        className="text-sm"
                        onClick={() => popupState[1](true)}
                        variant="blue"
                        icon={TbUsersPlus}
                        iconClassName="w-[1rem] h-auto"
                    >
                        Add user
                    </Button>
                </div>

                <div className="flex pt-2">
                    {activeRole == "Contributor" && (
                        <div className="w-full">
                            <div className="w-full max-h-[400px] overflow-auto">
                                {(contributors ?? []).map((user) => (
                                    <DisplayUserRow
                                        key={user.uid}
                                        user={user}
                                        onRemove={(user_id) => removeRoleLocal(user_id, "model_contributor")}
                                    />
                                ))}
                                {!contributors ||
                                    (contributors.length == 0 && (
                                        <div className="py-2 px-4 text-center text-gray-600 bg-gray-50 rounded">
                                            No user be assigned
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {activeRole == "Member" && (
                        <div className="w-full">
                            <div className="w-full max-h-[400px] overflow-auto">
                                {(members ?? []).map((user) => (
                                    <DisplayUserRow
                                        key={user.uid}
                                        user={user}
                                        onRemove={(user_id) => removeRoleLocal(user_id, "model_member")}
                                    />
                                ))}
                                {!members ||
                                    (members.length == 0 && (
                                        <div className="py-2 px-4 text-center text-gray-600 bg-gray-50 rounded">
                                            No user be assigned
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                    <SelectUserPopup
                        popupState={popupState}
                        selectUser={(userId) =>
                            addNewRoleLocal(userId, activeRole === "Contributor" ? "model_contributor" : "model_member")
                        }
                        excludeUserIds={
                            activeRole === "Contributor"
                                ? contributors.map((user) => user.uid)
                                : members.map((user) => user.uid)
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default ModelPermissions;
