import { useState, useEffect } from "react";
import EmojiFeelingRating from "../../../reusable/ReportTools/EmojiFeelingRating";
import { VscClose } from "react-icons/vsc";
import { createOrUpdateSurvey } from "./ReportFunctions";
import { getDoc, doc, Timestamp } from "firebase/firestore";
import { REFS } from "../../../apis/firebase";
import { Survey } from "../../../apis/models";

export interface SurveyPopupProps {
    isOpen: boolean;
    onCloseButton: () => void;
    email: string;
}

// style for the progress bar animation
const styleSheet = document.styleSheets[0];
const progressBarKeyframes = `
  @keyframes progressBar {
    from {
      width: 100%;
    }
    to {
      width: 0;
    }
  }
`;
styleSheet.insertRule(progressBarKeyframes, styleSheet.cssRules.length);

const SurveyPopup = ({ isOpen, onCloseButton, email }) => {
    const [feeling, setFeeling] = useState<string | undefined>(undefined);
    const [userThoughts, setUserThoughts] = useState("");
    const [isSubmittedLately, setIsSubmittedLately] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isInitiallyLoaded, setIsInitiallyLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isImgReady, setIsImgReady] = useState(false);
    const [isRatingSelected, setIsRatingSelected] = useState(false);
    const [showProgressBar, setShowProgressBar] = useState(false);
    const [preloadedImage, setPreloadedImage] = useState<HTMLImageElement | null>(null);
    const [loadedImages, setLoadedImages] = useState<{ [key: string]: HTMLImageElement }>({});

    const imageUrlsObj = {
        Unamused:
            "https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2FUnamused%20Face.png?alt=media&token=7ea5ecc1-cd73-4cee-8f04-afabed484ba0",
        Confused:
            "https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2FThinking%20Face.png?alt=media&token=d1bafaa8-716c-48e8-8353-57b85273d7a1",
        Neutral:
            "https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2FNeutral%20Face.png?alt=media&token=1cf2fd6a-c654-4f62-b0b5-22a037ae64ce",
        Good: "https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2FGrinning%20Face%20with%20Smiling%20Eyes.png?alt=media&token=ad976a00-2a3c-48bd-b835-79524ea88239",
        Excited:
            "https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2FStar-Struck.png?alt=media&token=b0b6d50f-d6a6-48ec-85e7-b101e78a57cb",
    };

    // Retrieve the images from the imageUrlsObj
    useEffect(() => {
        let loadedCount = 0;
        let tempImages: { [key: string]: HTMLImageElement } = {};

        Object.entries(imageUrlsObj).forEach(([key, url]) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                tempImages[key] = img;
                if (loadedCount === Object.keys(imageUrlsObj).length) {
                    setLoadedImages(tempImages);
                    setIsImgReady(true);
                }
            };
            img.src = url;
        });
    }, []);

    const timestampToDate = (timestamp: Timestamp): Date => {
        return timestamp.toDate(); // Convert to JS Date
    };

    const isWithinDuration = (timestamp: Timestamp, durationMs: number): boolean => {
        if (!timestamp) {
            console.error("Invalid timestamp provided.");
            return false;
        }
        const givenDate = timestampToDate(timestamp);
        const currentDate = new Date();
        return currentDate.getTime() - givenDate.getTime() < durationMs;
    };

    // Constants for duration in milliseconds
    const TENSECS = 10 * 1000;
    const AMONTH = 1 * 30 * 24 * 60 * 60 * 1000;
    const THREEMONTH = 3 * 30 * 24 * 60 * 60 * 1000;

    // Waiting for checking if the user has submitted a survey or closed the popup lately
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitiallyLoaded(true);
        }, 10000); // 10 second delay

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const thankImg = new Image();
        thankImg.onload = () => {
            setPreloadedImage(thankImg);
        };
        thankImg.src =
            "https://firebasestorage.googleapis.com/v0/b/playground-vndev.appspot.com/o/Feedback%2Fconfetti.png?alt=media&token=40c019a9-1429-4474-8dfa-b2841cbda2ca";
    }, []); // Empty dependency array ensures this runs once on mount ( Load the confeti icon )

    // Check if the user has submitted a survey or closed the popup lately
    useEffect(() => {
        // Fetch the survey for the specific user based on their email
        const fetchUserSurvey = async () => {
            try {
                if (!email) return;
                const userDocRef = doc(REFS.survey, email);
                if (userDocRef === undefined) return;
                const userDocSnapshot = await getDoc(userDocRef);

                if (userDocSnapshot.exists()) {
                    const userData: Survey = userDocSnapshot.data() as Survey;
                    if (userData.lastSurveyTimestamp && isWithinDuration(userData.lastSurveyTimestamp, THREEMONTH)) {
                        // console.log('User has submitted a survey lately.');
                        setIsSubmittedLately(true);
                    } else if (userData.lastClosedTimestamp && isWithinDuration(userData.lastClosedTimestamp, AMONTH)) {
                        // console.log('User has closed the popup lately.');
                        setIsSubmittedLately(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user's survey: ", error);
            }
        };

        fetchUserSurvey();
    }, [email]); // Add email to dependency array to ensure the useEffect runs if email changes.

    // Submit the survey
    const handleOnSubmit = async () => {
        setIsLoading(true);
        setIsLoading(false);
        setIsSubmitted(true);
        setShowProgressBar(true);
        await createOrUpdateSurvey(feeling, userThoughts, email, undefined, Timestamp.now());
    };
    // Close the survey 2 situations: 1. User has select  feeling but lazy to fill the reason  2. User has closed the popup.
    const handleOnClose = async () => {
        onCloseButton();
        if (isRatingSelected) {
            await createOrUpdateSurvey(feeling, userThoughts, email, undefined, Timestamp.now());
        } else {
            await createOrUpdateSurvey(undefined, undefined, email, Timestamp.now(), undefined);
        }
    };

    // Show the progress bar for 5 seconds after the user has submitted the survey
    useEffect(() => {
        let timer;
        if (isSubmitted) {
            timer = setTimeout(() => {
                setShowProgressBar(false); // Stop showing the progress bar after 5 seconds
                handleOnClose(); // Close the thank you message
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [isSubmitted]);

    // Inline styles for the progress bar animation
    const progressBarStyles = {
        animation: `progressBar 5s linear forwards`,
        height: "3px",
        backgroundColor: "#005072", // replace with your color code if different
        width: "100%",
        borderRadius: "0.25rem",
    };

    return (
        isInitiallyLoaded &&
        !isSubmittedLately &&
        isOpen &&
        isImgReady && (
            <div className="bg-white rounded shadow-lg border-[0.07rem] border-gray-200 items-center w-full h-full object-contain">
                {isSubmitted ? (
                    <div className="flex flex-col">
                        <div className="flex flex-col space-y-3 p-4 h-full">
                            <div className="flex justify-end w-full" onClick={handleOnClose}>
                                <VscClose className="w-6 h-auto text-gray-400 hover:text-aiot-blue text-xs flex justify-end0"></VscClose>
                            </div>
                            <div className="flex justify-center">
                                {preloadedImage && (
                                    <img className="w-24 h-auto object-contain" src={preloadedImage.src} />
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-2xl text-aiot-blue mb-3 font-semibold">You're Awesome!</p>
                                <p className="text-sm text-gray-600 text-center mb-3 tracking-normal">
                                    Thanks for improving the playground with your input
                                </p>
                            </div>
                        </div>
                        {showProgressBar && <div style={progressBarStyles}></div>}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-around w-full py-2 px-4">
                            <div className="w-full text-aiot-blue font-bold pt-2">
                                How was your playground journey today?
                            </div>
                            <div className="flex justify-end" onClick={handleOnClose}>
                                <VscClose className="w-6 h-auto text-gray-400 hover:text-aiot-blue text-xs flex justify-end0"></VscClose>
                            </div>
                        </div>
                        <div className="w-full pb-2 px-4">
                            <EmojiFeelingRating
                                setFeeling={(selectedFeeling) => {
                                    setFeeling(selectedFeeling);
                                    setIsRatingSelected(true);
                                }}
                                userThoughts={userThoughts}
                                setUserThoughts={setUserThoughts}
                                onSubmit={handleOnSubmit}
                                isLoading={isLoading}
                                loadedImages={loadedImages}
                            />
                        </div>
                    </>
                )}
            </div>
        )
    );
};

export default SurveyPopup;
