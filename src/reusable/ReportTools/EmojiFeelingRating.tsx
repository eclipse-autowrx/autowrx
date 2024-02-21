import React, { FC, useState, useEffect } from "react";
import CustomRating from "./CustomRating";
import { Bars } from "@agney/react-loading";

interface EmojiFeelingProps {
    setFeeling: (feeling: string) => void; // Pass value of selected rating to parent
    userThoughts?: string; // Passed from parent to EmojiFeelingRating for textarea value
    setUserThoughts?: (userThoughts: string) => void; // Pass value of textarea to parent
    className?: string;
    onSubmit: () => void;
    isLoading?: boolean; // prevent multiple click
    loadedImages: { [key: string]: HTMLImageElement };
}

const EmojiFeelingRating: FC<EmojiFeelingProps> = ({
    setFeeling,
    userThoughts,
    className,
    onSubmit,
    setUserThoughts = () => {},
    isLoading,
    loadedImages,
}) => {
    const [isFeelingSelected, setIsFeelingSelected] = useState(false);
    const [selectedRating, setSelectedRating] = useState("Unamused || Confused || Neutral || Good || Excited!");

    // Handle when user select Emoji
    const handleRatingSelection = (rating: string) => {
        setSelectedRating(rating);
        setFeeling(rating);
    };

    // Handle change in user thoughts textarea
    const handleUserThoughtChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserThoughts(e.target.value);
    };

    // Handle when user click submit button
    const handleOnSubmit = () => {
        onSubmit();
    };

    const feedbackTypes = {
        unamused: { type: "Negative", placeholder: "Could you tell us what made your experience less enjoyable?" },
        confused: { type: "Negative", placeholder: "What did you find confusing or unclear?" },
        neutral: { type: "Neutral", placeholder: "What can we do to make your next experience better?" },
        good: { type: "Positive", placeholder: "Great to hear! Any suggestions for further improvements?" },
        excited: { type: "Positive", placeholder: "Awesome! Could you share what you liked the most?" },
    };

    const selectedRatingKey = selectedRating.toLowerCase().replace("!", "");

    return (
        <div>
            <div>
                <div className={`flex flex-col w-full ${className}`}>
                    <div className="flex w-full justify-around mt-5 mb-5">
                        <CustomRating
                            ratingText="Unamused"
                            iconUrl={loadedImages["Unamused"]?.src}
                            isSelected={selectedRating === "Unamused"}
                            onSelect={() => {
                                handleRatingSelection("Unamused");
                                setIsFeelingSelected(true);
                            }}
                            title="I found it frustrating"
                        />
                        <CustomRating
                            ratingText="Confused"
                            iconUrl={loadedImages["Confused"]?.src}
                            isSelected={selectedRating === "Confused"}
                            onSelect={() => {
                                handleRatingSelection("Confused");
                                setIsFeelingSelected(true);
                            }}
                            title="I was a bit lost"
                        />
                        <CustomRating
                            ratingText="Neutral"
                            iconUrl={loadedImages["Neutral"]?.src}
                            isSelected={selectedRating === "Neutral"}
                            onSelect={() => {
                                handleRatingSelection("Neutral");
                                setIsFeelingSelected(true);
                            }}
                            title="It was okay"
                        />
                        <CustomRating
                            ratingText="Good"
                            iconUrl={loadedImages["Good"]?.src}
                            isSelected={selectedRating === "Good"}
                            onSelect={() => {
                                handleRatingSelection("Good");
                                setIsFeelingSelected(true);
                            }}
                            title="I had a good time"
                        />
                        <CustomRating
                            ratingText="Excited!"
                            iconUrl={loadedImages["Excited"]?.src}
                            isSelected={selectedRating === "Excited!"}
                            onSelect={() => {
                                handleRatingSelection("Excited!");
                                setIsFeelingSelected(true);
                            }}
                            title="I loved it"
                        />
                    </div>
                    {isFeelingSelected && (
                        <div className="pb-2">
                            <div className="flex">
                                <textarea
                                    value={userThoughts}
                                    onChange={handleUserThoughtChange}
                                    placeholder={feedbackTypes[selectedRatingKey].placeholder}
                                    className="flex-grow border-[0.068rem] text-[0.9rem] border-transparent text-gray-600 bg-gray-100 rounded p-2 text-sm outline-none focus:border-gray-300"
                                />
                            </div>
                            <button
                                className="w-full bg-aiot-blue hover:bg-aiot-blue/95 py-2 px-4 rounded mt-3 flex items-center justify-center text-white"
                                onClick={handleOnSubmit}
                            >
                                {isLoading ? (
                                    <div className="flex w-6 h-auto">
                                        <Bars></Bars>
                                    </div>
                                ) : (
                                    "Submit"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmojiFeelingRating;
