import { useEffect, useState } from "react";
import axios from "axios";
import LoadingPage from "../LoadingPage";
import DiscussionForm from "./DiscussionForm";
import Popup from "../../../reusable/Popup/Popup";
import DiscusstionItem from "./DiscussionItem";

const ApiDiscussion = ({ api, onDiscussionLoaded }) => {
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const [usersLite, setUsersLite] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activeDiscussion, setActiveDiscussion] = useState<any>(null);
    const popupState = useState(false);

    useEffect(() => {
        if (!api) {
            setDiscussions([]);
            return;
        }
        fetchDiscussions();
    }, [api]);

    useEffect(() => {
        console.log("ApiDiscussion loaded");
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
        if (!api) return;
        setLoading(true);
        setDiscussions([]);
        try {
            let res = await axios.get(`/.netlify/functions/listDiscussion?masterIds=${api}`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
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
                if (onDiscussionLoaded) onDiscussionLoaded(res.data.length);
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
                <div className="text-2xl border-b border-slate-100 pb-2 text-slate-600">
                    Discussion ({discussions.length})
                </div>
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

                {api && (
                    <DiscussionForm
                        masterId={api}
                        masterType="API"
                        masterName={api}
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
                                    masterId={api}
                                    parent_id={activeDiscussion.id}
                                    masterType="API"
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

export default ApiDiscussion;
