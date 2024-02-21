import { useEffect, useState } from "react";
import { Discussion } from "../../../apis/models";

import { BsReply } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

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

export default DiscusstionItem;
