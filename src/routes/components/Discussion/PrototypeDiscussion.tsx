import { useEffect, useState } from "react";
import axios from "axios";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { Prototype } from "../../../apis/models";
import LoadingPage from "../LoadingPage";
import { Discussion } from "../../../apis/models";
import DiscussionForm from "./DiscussionForm";
import { BsReply } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import Popup from "../../../reusable/Popup/Popup";

interface DiscussionItemProps {
    discussion: Discussion;
    showReplyForm?: any;
    children?: Discussion[];
}

const DiscusstionItem = ({ discussion, showReplyForm, children }: DiscussionItemProps) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    return (
        <div className="mb-6">
            {discussion.created && (
                <div className="pr-2 text-sm flex items-center">
                    <img
                        src={discussion?.created?.user_avatar || "/imgs/profile.png"}
                        alt={discussion?.created?.user_fullname}
                        className="select-none w-8 h-8 rounded-md overflow-hidden "
                        style={{ objectFit: "cover" }}
                        onError={({ currentTarget }) => {
                            currentTarget.onerror = null; // prevents looping
                            currentTarget.src = "/imgs/profile.png";
                        }}
                    />
                    <div className="pl-2 text-lg font-bold">{discussion?.created?.user_fullname || "Anonymous"}</div>
                    <div className="ml-4 text-slate-500 text-xs">
                        {new Date(
                            discussion.created.created_time._seconds * 1000 +
                                discussion.created.created_time._nanoseconds / 1000000
                        ).toLocaleString()}
                    </div>
                </div>
            )}
            <div className="w-full mt-1 py-2 px-4 text-left bg-slate-100 text-slate-700 rounded">
                <div
                    className="whitespace-pre-wrap text-[13px] max-h-[200px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: discussion.content }}
                ></div>
            </div>

            <div className="flex items-center">
                <div className="grow"></div>

                {children && children.length > 0 && (
                    <div className="flex items-center">
                        <div className="text-slate-400 text-[14px] mr-2">Reply ({children.length})</div>
                        {collapsed && (
                            <div
                                className="flex items-center text-slate-600 px-2 py-1 cursor-pointer hover:bg-slate-200 text-[14px] rounded"
                                onClick={() => {
                                    setCollapsed(false);
                                }}
                            >
                                Expand
                                <MdExpandMore size={18} className="ml-0.5" />
                            </div>
                        )}
                        {!collapsed && (
                            <div
                                className="flex items-center text-slate-600 px-2 py-1 cursor-pointer hover:bg-slate-200 text-[14px] rounded"
                                onClick={() => {
                                    setCollapsed(true);
                                }}
                            >
                                Collapse
                                <MdExpandLess size={18} className="ml-0.5" />
                            </div>
                        )}
                    </div>
                )}

                {!discussion.parent_id && (
                    <div
                        className="ml-1 flex items-center text-slate-600 px-2 py-1 cursor-pointer hover:bg-slate-200 text-[14px] rounded"
                        onClick={() => {
                            if (showReplyForm) showReplyForm();
                        }}
                    >
                        <BsReply className="mr-1" size={18} />
                        Reply
                    </div>
                )}
            </div>

            {!collapsed && children && children.length > 0 && (
                <div className="ml-12">
                    {children.map((child, index) => (
                        <DiscusstionItem key={index} discussion={child} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface PrototypeDiscussionProps {
    setDiscussionCount?: (count: number) => void;
}

const PrototypeDiscussion = ({ setDiscussionCount }: PrototypeDiscussionProps) => {
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const prototype = useCurrentPrototype() as Prototype;

    const [usersLite, setUsersLite] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activeDiscussion, setActiveDiscussion] = useState<any>(null);
    const popupState = useState(false);

    useEffect(() => {
        // Log number of discussions
        // console.log("Number of discussions:", discussions.length);
        // Notify the parent about the number of discussions
        if (setDiscussionCount) {
            setDiscussionCount(discussions.length);
        }
    }, [discussions]);

    useEffect(() => {
        if (!prototype) {
            setDiscussions([]);
            return;
        }
        fetchDiscussions();
    }, [prototype]);

    useEffect(() => {
        loadUsersBasic();
    }, []);

    const loadUsersBasic = async () => {
        try {
            setUsers([]);
            setUsersLite([]);
            let res = await axios.get(`/.netlify/functions/listAllUserBasic`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                let resUsers = res.data || [];
                resUsers = resUsers.filter((u: any) => u.name && u.name != "null");
                resUsers.sort((a: any, b: any) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                });
                setUsers(resUsers);
                setUsersLite(
                    resUsers.map((u: any) => {
                        return {
                            id: u.uid,
                            display: u.name,
                            email: u.email,
                        };
                    })
                );
            }
        } catch (err) {
            console.log(err);
        }
    };

    const fetchDiscussions = async () => {
        if (!prototype || !prototype.id) return;
        setLoading(true);
        setDiscussions([]);
        try {
            let res = await axios.get(`/.netlify/functions/listDiscussion?masterIds=${prototype.id}`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                // console.log("discussions", res.data)
                let discussion = res.data || [];
                discussion.forEach((review: any) => {
                    review.created_at = new Date(
                        review.created.created_time._seconds * 1000 + review.created.created_time._nanoseconds / 1000000
                    );
                });
                discussion = discussion.sort((b, a) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setDiscussions(res.data);
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="w-full px-4 pt-6 flex justify-center">
            <div className="max-w-[960px] w-full">
                <div className="text-2xl border-b border-slate-100 pb-2 text-slate-600">Discussion</div>
                {(!discussions || discussions.length === 0) && (
                    <div className="w-full mt-8 py-6 text-center bg-slate-100 text-slate-400 rounded">
                        No discussions, be the first to start one!
                    </div>
                )}
                {discussions
                    .filter((d) => !d.parent_id)
                    .map((discussion, index) => (
                        <DiscusstionItem
                            key={index}
                            discussion={discussion}
                            children={discussions.filter((d) => d.parent_id === discussion.id)}
                            showReplyForm={() => {
                                setActiveDiscussion(discussion);
                                popupState[1](true);
                            }}
                        />
                    ))}

                <div className="mt-8"></div>

                {prototype && (
                    <DiscussionForm
                        masterId={prototype.id}
                        masterType="prototype"
                        masterName={prototype.name}
                        users={usersLite}
                        onSuccess={() => {
                            fetchDiscussions();
                        }}
                    />
                )}

                <Popup state={popupState} trigger={<span></span>} width="800px">
                    <div>
                        {activeDiscussion && (
                            <div>
                                <div className="mb-4">
                                    <div className="text-[18px] text-slate-600 mb-2">Reply to:</div>
                                    <div className="text-lg font-bold">
                                        {activeDiscussion.created?.user_fullname || "Anonymous"}
                                    </div>
                                    <div className="w-full mt-1 py-2 px-4 text-left bg-slate-100 text-slate-700 rounded">
                                        <div
                                            className="whitespace-pre-wrap text-[13px] italic max-h-[100px] overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: activeDiscussion.content }}
                                        ></div>
                                    </div>
                                </div>

                                <DiscussionForm
                                    masterId={prototype.id}
                                    parent_id={activeDiscussion.id}
                                    masterType="prototype"
                                    users={usersLite}
                                    onSuccess={() => {
                                        setActiveDiscussion(null);
                                        popupState[1](false);
                                        fetchDiscussions();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </Popup>
            </div>
        </div>
    );
};

export default PrototypeDiscussion;
