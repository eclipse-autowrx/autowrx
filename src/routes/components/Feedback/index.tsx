import React, { useEffect, useState } from "react";
import Paginate from "../../../reusable/Paginate/Paginate";
import Starss from "../../../reusable/Stars";
import Rating from "react-rating";
import { HiStar } from "react-icons/hi";
import { TbPlus, TbChartDots, TbX } from "react-icons/tb";
import PrototypeFeedbackForm from "./PrototypeFeedbackForm";
import Button from "../../../reusable/Button";
import axios from "axios";
import Popup from "../../../reusable/Popup/Popup";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import { Model } from "../../../apis/models";
import LinkWrap from "../../../reusable/LinkWrap";

interface UserReview {
    id: string;
    interviewee: {
        name: string;
        org?: string;
    };
    recommendation: string;
    question: string;
    model_id: string;
    score: {
        easyToUse?: number;
        needAddress?: number;
        relevance?: number;
    };
    created: {
        created_time: {
            _seconds: number;
            _nanoseconds: number;
        };
        user_id: string;
        user_fullname: string;
    };
}

interface UserReviewsProps {
    prototype_id: string | null;
}

const mockRecommendation = () => {
    <div className="text-sm">
        <div>
            "I had the opportunity to test this prototype, and it left a positive impression on me. The user interface
            is clean, modern, and intuitive. It requires minimal effort to navigate through different sections, and the
            learning curve is practically non-existent. The prototype is easy to use, even for individuals with limited
            technical expertise. In terms of relevance, this prototype ticks all the boxes. It aligns perfectly with our
            organization's requirements and effectively addresses our needs. However, I feel that some additional
            features could be incorporated to better handle specific scenarios.", question: "Would you recommend this
            prototype to others?"
        </div>
    </div>;
};

const UserReviews = ({ prototype_id }: UserReviewsProps) => {
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [itemsOffset, setItemsOffset] = useState(0);
    const RatingComponent = Rating as any;
    const itemsPerPage = 5;
    const feedbackPopupState = useState(false); // for popup
    const prototype = useCurrentPrototype(); // fetch current prototype to add user feedback

    const [rating, setRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);

    const model = useCurrentModel() as Model;

    if (typeof prototype === "undefined") {
        return null;
    }

    const currentItems = reviews.slice(itemsOffset, itemsOffset + itemsPerPage);

    useEffect(() => {
        if (!prototype_id) return;
        fetchFeedbackInfo();
    }, [prototype_id]);

    const fetchRatingInfo = async (prototypeId: string) => {
        if (!prototypeId) return;
        setRatingCount(0);
        setRating(0);
        try {
            let res = await axios.get(`/.netlify/functions/listFeedback?masterType=Prototype&&masterId=${prototypeId}`);
            // console.log("listFeedback", res.data)
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                let rateValue =
                    res.data.map((f: any) => f.avg_score).reduce((partialSum, a) => partialSum + a, 0) /
                    res.data.length;
                setRatingCount(res.data.length);
                setRating(rateValue);
            } else {
                setRatingCount(0);
                setRating(0);
            }
            // console.log(res.data)
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (!prototype) {
            setRating(0);
            setRatingCount(0);
        }
        fetchRatingInfo(prototype.id);
    }, [prototype]);

    const fetchFeedbackInfo = async () => {
        let reviews = [] as any[];
        try {
            let res = await axios.get(
                `/.netlify/functions/listFeedback?masterType=Prototype&&masterId=${prototype_id}`
            );
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                reviews = res.data;
            }
        } catch (err) {
            console.log(err);
        }
        console.log(reviews);
        reviews.forEach((review: any) => {
            review.created_at = new Date(
                review.created.created_time._seconds * 1000 + review.created.created_time._nanoseconds / 1000000
            );
        });
        reviews = reviews.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setItemsOffset(0);
        setReviews(reviews);
    };

    // Refresh the page when user submit feedback
    const [refreshCounter, setRefreshCounter] = useState<number>(0);
    useEffect(() => {
        if (refreshCounter !== 0) {
            window.location.reload();
        }
    }, [refreshCounter]);

    // Total number of feedbacks
    const totalFeedback = reviews.length;

    // Avarage rating of this prototype
    const avarageFeedbackRating = rating;

    return (
        <div className="w-full bg-white h-screen overflow-y-auto">
            <div className="flex flex-col items-center justify-center mb-3 mt-10">
                {/* <div className="text-2xl mb-3 bg-red-500">{prototype.name}</div>
        <div className="text-2xl mb-3 bg-blue-500">{prototype.id}</div> */}
                <div className="w-36"></div>
                <div className="inline-flex justify-between items-center w-full max-w-[1024px]">
                    <p className="text-3xl font-bold text-aiot-blue">END-USER FEEDBACK</p>
                    <div className="flex w-fit">
                        <Popup
                            state={feedbackPopupState}
                            trigger={
                                <Button variant="white" icon={TbPlus} className="mr-3">
                                    Add Feedback
                                </Button>
                            }
                        >
                            <PrototypeFeedbackForm
                                prototype={prototype}
                                requestClose={() => {
                                    feedbackPopupState[1](false);
                                    fetchRatingInfo(prototype.id);
                                    setRefreshCounter(refreshCounter + 1);
                                }}
                            />
                        </Popup>
                        <LinkWrap to={`/model/${model.id}/library/portfolio`}>
                            <Button variant="white" icon={TbChartDots}>
                                View Portfolio
                            </Button>
                        </LinkWrap>
                    </div>
                </div>
                {/* Avarage rating of this prototype */}
                <div className="inline-flex items-center w-full max-w-[1024px]">
                    <div className="flex items-center text-l font-semibold text-gray-600 ">Overall: </div>
                    <RatingComponent
                        className="pl-2 pt-1"
                        readonly
                        emptySymbol={<HiStar className="text-gray-300" size={24} />}
                        initialRating={avarageFeedbackRating}
                        fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                    />
                    <div className=" pl-1 text-sm text-gray-400">({totalFeedback})</div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center">
                {currentItems.map((review) => (
                    <div
                        key={review.id}
                        className="w-full max-w-[1024px] bg-white p-5 m-3 rounded-md border shadow border-aiot-blue-ml/20 text-gray-600 text-sm"
                    >
                        <div className="inline-flex items-end justify-end">
                            <h3 className="text-xl text-aiot-blue font-bold">
                                {review.interviewee?.name || "Anonymous"}
                            </h3>
                            {review.interviewee && review.interviewee.org && (
                                <h4 className="text-xs ml-3 mb-1 text-aiot-blue">@{review.interviewee.org}</h4>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">
                            {review.created &&
                                new Date(
                                    review.created.created_time._seconds * 1000 +
                                        review.created.created_time._nanoseconds / 1000000
                                ).toLocaleString()}
                        </p>
                        <div className="flex mt-5">
                            <div className="font-semibold min-w-[250px]">
                                <div className="flex">
                                    <div className="flex-1">Need Address: </div>
                                    <RatingComponent
                                        readonly
                                        emptySymbol={<HiStar className="text-gray-300" size={24} />}
                                        initialRating={review.score?.needAddress || 0}
                                        fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                                    />
                                </div>
                                <div className="flex">
                                    <div className="flex-1">Relevance:</div>
                                    <RatingComponent
                                        readonly
                                        emptySymbol={<HiStar className="text-gray-300" size={24} />}
                                        initialRating={review.score?.relevance || 0}
                                        fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                                    />
                                </div>
                                <div className="flex">
                                    <div className="flex-1">Ease of use:</div>
                                    <RatingComponent
                                        readonly
                                        emptySymbol={<HiStar className="text-gray-300" size={24} />}
                                        initialRating={review.score?.easyToUse || 0}
                                        fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
                                    />
                                </div>
                            </div>
                            <div className="pl-44 font-semibold grow">
                                <div className="flex">
                                    <div className="min-w-[160px]">Question:</div>
                                    <div className="grow font-normal whitespace-pre-wrap text-gray-600">
                                        {review.question}
                                    </div>
                                </div>
                                <div className="flex  pt-5">
                                    <div className="min-w-[160px]">Recommendation:</div>
                                    <div className="grow font-normal whitespace-pre-wrap text-gray-600">
                                        {review.recommendation}
                                    </div>
                                </div>

                                <div className="flex  pt-5">
                                    <div className="min-w-[160px]">Interviewer:</div>
                                    <div className="grow font-normal text-gray-600">
                                        {review.created?.user_fullname}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {reviews.length > itemsPerPage && (
                <div className="mt-3 mb-5">
                    <Paginate itemsPerPage={itemsPerPage} items={reviews} setItemsOffset={setItemsOffset} />
                </div>
            )}
        </div>
    );
};

export default UserReviews;
