import { useState, useEffect } from "react";
import { HiStar } from "react-icons/hi";
import Rating from "react-rating";
import Button from "../../../reusable/Button";
import { Prototype } from "../../../apis/models";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { REFS } from "../../../apis/firebase";
import { setDoc, doc, Timestamp } from "@firebase/firestore";
import Input from "../../../reusable/Input/Input";
import { Bars } from "@agney/react-loading";
import { addLog } from "../../../apis";

interface FeedbackFormProps {
    prototype: Prototype;
    requestClose?: () => void;
}

const PrototypeFeedbackForm = ({ prototype, requestClose }: FeedbackFormProps) => {
    const RatingComponent = Rating as any;
    const [loading, setLoading] = useState(false);
    const [readOnly, serReadOnly] = useState(false);
    const { isLoggedIn, user, profile } = useCurrentUser();
    const [needAddress, setNeedAddress] = useState(0);
    const [relevance, setRelevance] = useState(0);
    const [easyToUse, setEasyToUse] = useState(0);
    // const [question, setQuestion] = useState("")
    // const [recommendation, setRecommendation] = useState("")
    const intervieweeState = useState(profile?.name || "");
    const intervieweeFromState = useState("");
    const recommendationState = useState("");
    const questionState = useState("");

    const [displayError, setDisplayError] = useState<null | string>(null);

    const submitTestFeedback = async () => {
        if (!user || !prototype) {
            return;
        }

        if (!intervieweeState[0]) {
            setDisplayError("Error: Interviewee name is required!");
            return;
        }

        try {
            setDisplayError("");
            const newFeebackRef = doc(REFS.feedback);
            await setDoc(newFeebackRef, {
                id: newFeebackRef.id,
                model_id: prototype.model_id,
                master_id: prototype.id,
                master_type: "Prototype",
                created: {
                    created_time: Timestamp.now(),
                    user_uid: user.uid,
                },
                interviewee: {
                    name: intervieweeState[0],
                    org: intervieweeFromState[0],
                },
                description: "",
                question: questionState[0],
                recommendation: recommendationState[0],
                avg_score: Math.round((10 * (needAddress + relevance + easyToUse)) / 3) / 10,
                score: {
                    needAddress,
                    relevance,
                    easyToUse,
                },
            });

            // Add feedback log
            if (profile) {
                const username = profile.name || profile.name || "Anonymous";

                await addLog(
                    `User '${username}' submit feedback with id ${newFeebackRef.id}`,
                    `User '${username}' submit feedback with id ${newFeebackRef.id} of prototype with id '${prototype.id}'`,
                    "create",
                    profile.uid,
                    null,
                    newFeebackRef.id,
                    "feedback",
                    null
                );
            }
            if (requestClose) requestClose();
        } catch (err) {
            setDisplayError("Error on submit feedback!");
            console.log("error on submit feedback", err);
        }
    };

    if (!user || !prototype) {
        return <div className="p-6">Please login to give feedback!</div>;
    }

    return (
        <div className="w-full text-gray-500 px-2">
            <div className="flex justify-center items-center">
                <p className="inline-block text-center text-2xl mt-4 mb-10 font-bold text-aiot-blue uppercase">
                    End user give feedback
                </p>
            </div>

            {displayError !== null && <div className="text-red-500 text-sm my-2">{displayError}</div>}

            <form className="w-[540px] m-auto relative pb-2 font-semibold text-sm text-gray-700">
                <div className="flex w-full justify-between mb-3 ">
                    <p className="w-[180px]">Interviewee?</p>
                    <div className="grow">
                        <div className="mb-3">
                            <Input
                                state={intervieweeState}
                                disabled={loading}
                                type="text"
                                placeholder="Fullname *"
                                defaultValue=""
                                className=" text-gray-600 font-normal"
                            />
                        </div>
                        <div>
                            <Input
                                state={intervieweeFromState}
                                disabled={loading}
                                type="text"
                                placeholder="From organization"
                                defaultValue=""
                                className=" text-gray-600 font-normal"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex w-full justify-between mb-3 ">
                    <p className="w-[180px]">Needs addressed?</p>
                    <div className="grow">
                        <RatingComponent
                            emptySymbol={<HiStar className="text-slate-300" size={24} />}
                            initialRating={needAddress}
                            onChange={setNeedAddress}
                            fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                        />
                    </div>
                </div>
                <div className="flex w-full justify-between mb-3">
                    <p className="w-[180px]">Relevance?</p>
                    <div className="grow">
                        <RatingComponent
                            emptySymbol={<HiStar className="text-slate-300" size={24} />}
                            initialRating={relevance}
                            onChange={setRelevance}
                            fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                        />
                    </div>
                </div>
                <div className="flex w-full justify-between mb-3">
                    <p className="w-[180px]">Ease of use</p>
                    <div className="grow">
                        <RatingComponent
                            emptySymbol={<HiStar className="text-slate-300" size={24} />}
                            initialRating={easyToUse}
                            onChange={setEasyToUse}
                            fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                        />
                    </div>
                </div>
                <div className="flex w-full justify-between mb-3">
                    <div className="min-w-[180px]  w-[180px]">Questions</div>
                    <div className="grow">
                        <Input
                            state={questionState}
                            disabled={loading}
                            form="input"
                            type="text"
                            placeholder="Write your questions..."
                            defaultValue=""
                            className="h-20 text-sm text-gray-600 font-normal"
                        />
                    </div>
                </div>
                <div className="flex w-full justify-between mb-3">
                    <div className="min-w-[180px] w-[180px]">Recommendations</div>
                    <div className="grow">
                        <Input
                            state={recommendationState}
                            disabled={loading}
                            form="textarea"
                            type="text"
                            placeholder="Write your recommendations..."
                            defaultValue=""
                            className="h-10 text-sm text-gray-600 font-normal"
                            containerClassName="h-auto"
                        />
                    </div>
                </div>
                <div className="flex justify-end items-center mt-10">
                    <Button
                        disabled={loading}
                        className="mr-5"
                        onClick={() => {
                            if (requestClose) requestClose();
                        }}
                    >
                        <div className="text-gray-500 hover:text-gray-700">Cancel</div>
                    </Button>
                    {!readOnly && (
                        <Button
                            variant="alt"
                            className="justify-center w-15 h-7 items-center text-xs"
                            disabled={loading}
                            onClick={async () => {
                                setLoading(true);
                                await submitTestFeedback();
                                setLoading(false);
                            }}
                        >
                            {loading ? (
                                <div className="flex mx-2 py-0.5 w-5 h-5">
                                    <Bars></Bars>
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

export default PrototypeFeedbackForm;
