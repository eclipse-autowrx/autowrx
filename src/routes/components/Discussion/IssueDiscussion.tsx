import { useEffect, useState, useRef, Component } from "react";
import axios from "axios";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import LoadingPage from "../LoadingPage";
import { Discussion } from "../../../apis/models";
import DiscussionForm from "./DiscussionForm";
import { formatTimestamp } from "../Report/ReportFunctions";

interface DiscussionItemProps {
    discussion: Discussion;
}

const DiscusstionItem = ({ discussion }: DiscussionItemProps) => {
    const timestampSeconds = (discussion.created.created_time as any)._seconds;
    const dateFromTimestamp = new Date(timestampSeconds * 1000);
    const formattedTime = formatTimestamp(dateFromTimestamp);

    return (
        <div className="mt-1">
            {discussion.created && (
                <div className="pr-2 text-sm flex items-center">
                    <img
                        src={discussion?.created?.user_avatar || "/imgs/profile.png"}
                        alt={discussion?.created?.user_fullname}
                        className="select-none w-5 h-5 rounded-full overflow-hidden "
                        style={{ objectFit: "cover" }}
                        onError={({ currentTarget }) => {
                            currentTarget.onerror = null; // prevents looping
                            currentTarget.src = "/imgs/profile.png";
                        }}
                    />
                    <div className="flex w-full justify-between items-center">
                        <div className="pl-2 text font text-gray-600">
                            {discussion?.created?.user_fullname || "Anonymous"}
                        </div>
                        <div className="ml-4 text-slate-500 text-xs">{formattedTime}</div>
                    </div>
                </div>
            )}
            <div className="w-full mt-3 py-2 px-4 text-left mb-3 border-b text-slate-700 rounded">
                <div
                    className="whitespace-pre-wrap text-[13px] pb-3"
                    dangerouslySetInnerHTML={{ __html: discussion.content }}
                ></div>
            </div>
        </div>
    );
};

interface IssueDiscussionProps {
    issueID: string;
    issueTitle: string;
}

const IssueDiscussion = ({ issueID, issueTitle }) => {
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [usersLite, setUsersLite] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!issueID) {
            setDiscussions([]);
            return;
        }
        fetchDiscussions();
    }, [issueID]);

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
        if (!issueID) return;
        setLoading(true);
        setDiscussions([]);
        try {
            let res = await axios.get(`/.netlify/functions/listDiscussion?masterIds=${issueID}`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                // console.log("discussions", res.data)
                let discussion = res.data || [];
                discussion.forEach((review: any) => {
                    review.created_at = new Date(
                        review.created.created_time._seconds * 1000 + review.created.created_time._nanoseconds / 1000000
                    );
                });
                discussion = discussion.sort((a, b) => {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });
                setDiscussions(res.data);
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    };

    if (loading)
        return (
            <div className="flex flex-col justify-center items-center h-full w-full pb-36 select-none">
                <div
                    style={{
                        width: "25px",
                        height: "25px",
                        border: "3px solid #f3f3f3",
                        borderTop: "3px solid #005072",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                ></div>
                <div className="text text-gray-400 mt-2">Loading</div>
                <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            </div>
        );

    return (
        <div className="w-full flex justify-center">
            <div className="w-full">
                {(!discussions || discussions.length === 0) && (
                    <div className="w-full flex flex-col rounded items-center">
                        <img
                            className="flex w-16 py-3"
                            src="https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Design%2Fchat-box.png?alt=media&token=4cbb6e25-51db-442f-a5ca-e6977c819701"
                        ></img>
                        <div className="flex text-sm text-gray-700">Let's get the discussion started</div>
                    </div>
                )}
                {discussions.map((discussion, index) => (
                    <DiscusstionItem key={index} discussion={discussion} />
                ))}
                <div className="w-full h-auto flex mt-20 mb-4">
                    <DiscussionForm
                        masterId={issueID}
                        masterType="issue"
                        masterName={issueTitle}
                        users={usersLite}
                        onSuccess={() => {
                            fetchDiscussions();
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default IssueDiscussion;
