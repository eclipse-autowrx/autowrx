import { useState, useEffect } from "react";
import Button from "../../../reusable/Button";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { REFS } from "../../../apis/firebase";
import { setDoc, doc, Timestamp } from "@firebase/firestore";
import Input from "../../../reusable/Input/Input";
import { Bars } from "@agney/react-loading";
import { MentionsInput, Mention } from "react-mentions";
import mentionsInputStyle from "./mentionsInputStyle";
import mentionStyle from "./mentionStyle";
import { sendEmail } from "../../../utils/sendEmail";
import { addLog } from "../../../apis";

interface DiccussionFormProps {
    requestClose?: () => void;
    onSuccess?: () => void;
    masterId: string;
    masterType: string;
    parent_id?: string;
    masterName?: string;
    users: string[];
}

const takeMentionsUser = (content: string) => {
    if (!content) return [];

    return [];
};

const takeHashtags = (content: string) => {
    if (!content) return [];

    return [];
};

const DiscussionForm = ({
    masterId,
    masterType,
    requestClose,
    onSuccess,
    parent_id,
    users,
    masterName,
}: DiccussionFormProps) => {
    const [loading, setLoading] = useState(false);
    const [readOnly, serReadOnly] = useState(false);
    const { isLoggedIn, user, profile } = useCurrentUser();
    const contentState = useState("");
    const contentPlain = useState("");

    const [displayError, setDisplayError] = useState<null | string>(null);

    const [mentioneds, setMentioneds] = useState<any[]>([]);

    const submitDiscussion = async () => {
        if (!user || !masterId) {
            return;
        }

        if (!contentState[0]) {
            setDisplayError("Error: Empty content! Please add your discussion content!");
            return;
        }

        try {
            setDisplayError("");
            setLoading(true);
            const newDiscussionRef = doc(REFS.discussion);

            let discussion = {
                id: newDiscussionRef.id,
                master_id: masterId,
                master_type: masterType || "prototype",
                created: {
                    created_time: Timestamp.now(),
                    user_uid: user.uid,
                },
                content: contentPlain[0],
                mentions: mentioneds,
                hashtags: [],
                images: [],
                parent_id: parent_id || null,
            };
            // console.log("discussion", discussion)
            await setDoc(newDiscussionRef, discussion);
            // console.log("mentioneds", mentioneds)
            await sendEmailToMentionUsers(mentioneds, contentPlain[0], masterName);

            if (profile) {
                const username = profile.name || profile.name || "Anonymous";
                const replyInfo = parent_id ? `, reply to discussion with id ${parent_id}` : "";

                addLog(
                    `User '${username}' submit discussion with id '${discussion.id}'` + replyInfo,
                    `User '${username}' submit discussion with id '${discussion.id}'` + replyInfo,
                    "create",
                    profile.uid,
                    null,
                    discussion.id,
                    "discussion",
                    parent_id
                );
            }
            if (onSuccess) onSuccess();
            if (requestClose) requestClose();
        } catch (err) {
            setDisplayError("Error on submit discussion content!");
            console.log("error on discussion content", err);
        }
        setLoading(false);
    };

    const sendEmailToMentionUsers = async (mentioneds: any[], content: string, masterName: any) => {
        if (!mentioneds || mentioneds.length === 0) return;
        let emailTitle =
            "[digital.auto] You are mentioned in a discussion" + (masterName ? ` about ${masterName}` : "");
        mentioneds.forEach((mentioned: any) => {
            let matchUser: any = users.find((u: any) => u.id == mentioned);
            // console.log("matchUser", matchUser)
            if (matchUser && matchUser.email) {
                let emailContent = `
                    Hi ${matchUser.name || ""},<br/>
                    <br/>
                    You are mentioned in a discussion${masterName ? ` about ${masterName}` : ""} on digital.auto.<br/>
                    <br/>
                    <p style='white-space: pre-wrap;'>${content}</p>
                    </br>

                    <a href="${window.location.href}"><u>View discussion</u></a>

                    <br/></br>
                    <b>digital.auto Team</b>
                `;
                sendEmail(
                    [
                        {
                            name: matchUser.name,
                            email: matchUser.email,
                        },
                    ],
                    emailTitle,
                    emailContent
                );
                // console.log('send email')
                // console.log({
                //     name: matchUser.name,
                //     email: matchUser.email
                // })
                // console.log(emailTitle)
            }
        });
    };

    if (!user || !masterId) {
        return <div className="p-6">Please login to submit disscussion!</div>;
    }

    return (
        <div className="w-full text-gray-500">
            {displayError !== null && <div className="text-red-500 text-sm my-2">{displayError}</div>}

            <form className="w-full m-auto relative pb-2 font-semibold text-aiot-blue-m">
                <div className="flex w-full justify-between mb-3">
                    <div className="grow">
                        {/* <Input
                            state={contentState}
                            disabled={loading}
                            form="textarea"
                            type="text"
                            placeholder="Share your thinking..."
                            defaultValue=""
                            className="h-20 text-[13px] leading-tight"
                        /> */}
                        <MentionsInput
                            value={contentState[0]}
                            placeholder={"Share your thinking, mention people using '@'"}
                            a11ySuggestionsListLabel={"Suggested mentions"}
                            style={mentionsInputStyle}
                            onChange={(e, newValue, newPLainTextValue, mentions) => {
                                let content = e.target.value;
                                if (content && content.length > 0) {
                                    content = content.split("@@@__").join('<a href="/user/preview/');
                                    content = content.split("^^__").join('"><b>@');
                                    content = content.split("@@@^^^").join("</b></a>");
                                }
                                // console.log('content', content)

                                contentPlain[1](content);
                                contentState[1](e.target.value);
                                setMentioneds(mentions.map((m: any) => m.id));
                            }}
                        >
                            <Mention
                                trigger="@"
                                data={users}
                                style={mentionStyle}
                                markup="@@@____id__^^____display__@@@^^^"
                            />
                        </MentionsInput>
                    </div>
                </div>
                <div className="flex justify-start items-center pt-3">
                    {requestClose && (
                        <Button
                            disabled={loading}
                            className="mr-5"
                            onClick={() => {
                                if (requestClose) requestClose();
                            }}
                        >
                            Cancel
                        </Button>
                    )}

                    {!readOnly && (
                        <Button
                            variant="success"
                            className="justify-center items-center w-15 h-10 py-2 px-5"
                            disabled={loading}
                            onClick={() => {
                                submitDiscussion();
                            }}
                        >
                            {loading ? (
                                <div className="w-15 h-10 py-2 px-5">
                                    <Bars />
                                </div>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default DiscussionForm;
