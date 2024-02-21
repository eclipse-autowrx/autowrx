import { useState, useEffect } from "react";
import clsx from "clsx";
import Popup from "../../../../reusable/Popup/Popup";
import axios from "axios";
import LoadingPage from "../../LoadingPage";
import Input from "../../../../reusable/Input/Input";
import { TbSearch } from "react-icons/tb";

const SelectUserPopup = ({ popupState, selectUser, excludeUserIds }) => {
    // const popupState = useState(false)
    const [users, setUsers] = useState<any>([]);
    const [renderUsers, setRenderUsers] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let res = await axios.get(`/.netlify/functions/listAllUserBasic`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                // console.log(res.data)
                setUsers(res.data);
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!users) {
            setRenderUsers([]);
            return;
        }
        let tmpUsers = users.filter((user) => !(excludeUserIds || []).includes(user.uid));
        if (search.trim() !== "") {
            tmpUsers = tmpUsers.filter(
                (user) =>
                    user.name.toLowerCase().includes(search.toLowerCase()) ||
                    user.email.toLowerCase().includes(search.toLowerCase())
            );
        }
        setRenderUsers(tmpUsers);
    }, [users, excludeUserIds, search]);

    return (
        <>
            <Popup state={popupState} trigger={<span></span>}>
                <div className="w-[540px] rounded select-none">
                    <div className="text-xl font-bold text-slate-700 border-b-2 border-slate-500 py-1 px-4 flex items-center">
                        <span>Select user</span>
                        <div className="grow"></div>
                        <div
                            className="px-2 hover:underline cursor-pointer text-md"
                            onClick={() => {
                                popupState[1](false);
                            }}
                        >
                            Close
                        </div>
                    </div>
                    {loading && <LoadingPage />}
                    {!loading && (
                        <div className="mt-2 px-2 max-h-[400px] min-h-[400px] overflow-auto">
                            <div>
                                <Input
                                    className="text-gray-600 text-sm placeholder-gray-500"
                                    containerClassName="bg-white border-gray-300 shadow-sm"
                                    state={[search, setSearch]}
                                    placeholder="Search"
                                    iconBefore
                                    Icon={TbSearch}
                                    iconSize={20}
                                    iconColor="#4b5563"
                                    IconOnClick={
                                        search === ""
                                            ? undefined
                                            : () => {
                                                  setSearch("");
                                              }
                                    }
                                />
                            </div>

                            {renderUsers &&
                                renderUsers.map((user: any) => (
                                    <div key={user.uid} className="border-b border-slate-200 flex">
                                        <div className="py-1 px-4 grow">
                                            <div className="font-semibold text-slate-600">{user.name}</div>
                                            <div className="text-slate-500 text-[12px] italic">
                                                {user.email}{" "}
                                                {user.provider && (
                                                    <span className="font-mono">via @{user.provider}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className="px-4 hover:opacity-60 cursor-pointer font-semibold grid place-items-center text-aiot-blue"
                                            onClick={() => {
                                                if (selectUser) {
                                                    selectUser(user.uid);
                                                }
                                                popupState[1](false);
                                            }}
                                        >
                                            Select
                                        </div>
                                    </div>
                                ))}

                            {search && renderUsers.length == 0 && (
                                <div className="py-2 px-4 text-center text-slate-400 bg-slate-50 rounded">
                                    No user match '{search}'
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Popup>
        </>
    );
};

export default SelectUserPopup;
