import { useEffect, useState, useRef } from "react";
import CustomModal from "../../../reusable/Popup/CustomModal";
import Button from "../../../reusable/Button";
import { useAffectedRoute, createIssue, dataURLToBlob, getBrowserAndOS } from "./ReportFunctions";
import { VscClose } from "react-icons/vsc";
import { TbCameraExclamation, TbBoxAlignTopLeft } from "react-icons/tb";
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { Bars } from "@agney/react-loading";
import GeneralTooltip from "../../../reusable/ReportTools/GeneralTooltip";
import { CircularProgress } from "@mui/material";
import CustomInput from "../../../reusable/Input/CustomInput";
import { sendEmail } from "../../../utils/sendEmail";
import ImageModalContent from "../../../reusable/Carousel/ImageModalContent";
import { getUser } from "../../../apis";

interface InnerReportProps {
    onBeginHighlighting: () => void;
    onClose: () => void;
    onSubmit: () => void;
    screenshotDataUrl: string;
    isCompleteHighlighting: boolean;
    description: string;
    setDescription: (description: string) => void;
    onCloseButton: () => void;
    setIssueLink: (issueLink: string) => void;
}

const InnerReport: React.FC<InnerReportProps> = ({
    onBeginHighlighting,
    onClose,
    screenshotDataUrl,
    isCompleteHighlighting,
    onSubmit,
    description,
    setDescription,
    onCloseButton,
    setIssueLink,
}) => {
    const { affectedPath, affectedCluster, affectedComponent } = useAffectedRoute();
    const { isLoggedIn, profile, user } = useCurrentUser();
    const [isClusterHover, setIsClusterHover] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasEnoughWords, setHasEnoughWords] = useState(false);
    const DEVELOPER_ID = ["Z5hHcVvVW0bjW0bXa5lmZgsufoN2", "wkHWhHwLUQNiF3lg9rFxgmLoCWi1"];
    const [developerEmails, setDeveloperEmails] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Toggling Email Checkbox
    const handleEmailCheckboxChange = () => {
        setIsEmailOpen(!isEmailOpen);
        if (isLoggedIn) {
            if (profile) {
                setUserEmail(profile.email);
            }
        }
    };
    // When User input their email
    function handleUserEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
        setUserEmail(event.target.value);
    }

    // Collect reporter email by default - to distinguish Dirk from other users
    useEffect(() => {
        if (isLoggedIn) {
            if (profile) {
                setUserEmail(profile.email);
            }
        }
    }, [isLoggedIn, profile]);

    useEffect(() => {
        description.length > 0 ? setHasEnoughWords(true) : setHasEnoughWords(false);
    }, [description]);

    const handleSubmit = async () => {
        setIsLoading(true);
        const date = new Date();
        const formattedDate = `${date.getDate()}-${
            date.getMonth() + 1
        }-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}`;

        // convert dataURL to blob
        const blob = dataURLToBlob(screenshotDataUrl);

        // Create a new File object
        const file = new File([blob], `Issue_${formattedDate}.png`, {
            type: "image/png",
        });

        // Create new Issue on Firebase
        const issueId = await createIssue(
            file,
            description,
            affectedPath,
            affectedCluster,
            affectedComponent,
            userEmail
        );
        const issueUrl = `${window.location.origin}/issues/${issueId}`; // Get the issue URL
        // console.log("issueUrl:", issueUrl)
        setIssueLink(issueUrl);
        await sendEmailToMentionUsers(description, affectedPath, issueUrl);
        setIsLoading(false);
        setDescription("");
        onSubmit();
    };

    function handleCloseButton() {
        setDescription("");
        onCloseButton();
    }

    const sendEmailToMentionUsers = async (content: string, masterName: any, issueUrl) => {
        let userEmailTitle = "[digital.auto] Thank You for Your Report" + (masterName ? ` on ${masterName}` : "");
        let devEmailTitle = "[digital.auto] New Issue Reported" + (masterName ? ` on ${masterName}` : "");

        if (!profile) return;

        let userEmailContent = `
        Dear ${profile.name || "User"},<br/>
        <br/>
        Thank you for reporting an issue on digital.auto. Your feedback is invaluable in helping us improve our platform.<br/>
        <br/>
        We are currently reviewing the details you've provided. Our team will investigate the issue and take the necessary steps to resolve it. We appreciate your patience and understanding in this matter.<br/>
        <br/>
        You can track the status of your report or engage in further discussion at the following link:<br/>
        <a href="${issueUrl}"><u>View your report</u></a>
        <br/><br/>
        Thank you once again for helping us make digital.auto a better platform.<br/>
        <br/>
        Best Regards,<br/>
        <b>The digital.auto team</b>
    `;

        let devEmailContent = `
        Dear development team,<br/>
        <br/>
        A new issue has been reported on digital.auto${masterName ? ` regarding ${masterName}` : ""}.<br/>
        <br/>
        Issue details:<br/>
        <p style='white-space: pre-wrap;'>${content}</p>
        <br/>
        Please review the details and take the necessary steps for resolution. The issue can be tracked and discussed further at the following link:<br/>
        <a href="${issueUrl}"><u>View the reported issue</u></a>
        <br/><br/>
        Thank you for your prompt attention to this matter.<br/>
        <br/>
        Best Regards,<br/>
        <b>The digital.auto team</b>
    `;

        // Send email to the user
        if (profile) {
            sendEmail(
                [
                    {
                        name: profile.name,
                        email: profile.email,
                    },
                ],
                userEmailTitle,
                userEmailContent
            );
        }

        // Send email to the developer team
        sendEmail(
            developerEmails.map((email) => ({
                name: "digital.auto",
                email: email,
            })),
            devEmailTitle,
            devEmailContent
        );
    };

    useEffect(() => {
        DEVELOPER_ID.forEach((id) => {
            getUser(id).then((user) => {
                setDeveloperEmails((prev) => [...prev, user.email]);
            });
        });
    }, []);

    return (
        <div className="flex flex-col space-y-3 p-4 h-full">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-aiot-blue">Report Issues</h2>
                <div className="text-gray-400 hover:text-aiot-blue text-xs" onClick={handleCloseButton}>
                    <VscClose className="w-5 h-auto"></VscClose>
                </div>
            </div>

            <div className="flex flex-col">
                <p className="text-sm text-gray-600 text-justify mb-3 tracking-normal">
                    Your involvement is shaping the playground. Help us by highlighting issues directly on the
                    screenshot and describe the issues in detail.
                </p>

                <GeneralTooltip
                    space={20}
                    content={`${
                        isCompleteHighlighting
                            ? "Clear all areas and highlight again"
                            : "Click and drag to highlight issues areas"
                    }`}
                >
                    <Button
                        onClick={() => {
                            onBeginHighlighting();
                            onClose();
                        }}
                        variant="white"
                        className="mb-4 h-10"
                        icon={TbBoxAlignTopLeft}
                        iconClassName="w-4 h-4"
                    >
                        {isCompleteHighlighting ? "Highlight areas again?" : "Highlight areas"}
                    </Button>
                </GeneralTooltip>

                {isCompleteHighlighting && (
                    <div className="relative flex border border-gray-200 mb-4 rounded overflow-hidden">
                        {screenshotDataUrl ? (
                            <GeneralTooltip
                                content="Review your screenshot will be shared with us"
                                space={20}
                                delay={500}
                            >
                                <img
                                    src={screenshotDataUrl}
                                    className="w-fit object-cover cursor-pointer"
                                    onClick={() => setIsModalOpen(true)}
                                    onMouseEnter={() => setIsClusterHover(true)}
                                    onMouseLeave={() => setIsClusterHover(false)}
                                />
                            </GeneralTooltip>
                        ) : (
                            <div className="flex py-4 px-6 items-center justify-center w-full h-full text-gray-600 text-sm select-none">
                                <TbCameraExclamation className="w-12 h-12" strokeWidth={1.2} />
                                <div className="ml-1.5 text-center">
                                    Unable to capture screenshot. Please ensure you've granted the necessary permissions
                                    and try again
                                </div>
                            </div>
                        )}

                        <ImageModalContent
                            images={[screenshotDataUrl]}
                            currentImageIndex={0}
                            isVisible={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                        />

                        {isClusterHover && (
                            <div
                                className="absolute bottom-0 px-1 py-1 bg-white/70 w-full"
                                onMouseEnter={() => setIsClusterHover(true)}
                                onMouseLeave={() => setIsClusterHover(false)}
                            >
                                <div className="flex text-xs justify-center scale-90">
                                    <div className="text-aiot-blue font-bold flex-1">
                                        Affected Cluster:{" "}
                                        <span className="text-gray-500 font-normal capitalize">{affectedCluster}</span>
                                    </div>
                                    <div className="text-aiot-blue font-bold flex-1">
                                        Affected Component:{" "}
                                        <span className="text-gray-500 font-normal">{affectedComponent}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <CustomInput
                    placeholder="Describe issues in detail"
                    form="textarea"
                    state={[description, setDescription]}
                    className="text-sm pr-3"
                    containerClassName="shadow-sm border-gray-100"
                    defaultRows={2}
                />
            </div>

            {hasEnoughWords && (
                <div className="flex items-center cursor-pointer text-center" onClick={handleEmailCheckboxChange}>
                    {isEmailOpen ? (
                        <MdOutlineCheckBox className="text-aiot-blue w-5 h-auto" />
                    ) : (
                        <MdOutlineCheckBoxOutlineBlank className="text-gray-500 hover:text-aiot-blue w-5 h-auto" />
                    )}
                    <p className="ml-1 text-sm text-gray-600">Allow us to contact you about this report issues</p>
                </div>
            )}

            {isEmailOpen && hasEnoughWords && (
                <div className="flex">
                    <CustomInput
                        placeholder="Email"
                        state={[userEmail, setUserEmail]}
                        className="text-sm pr-3"
                        containerClassName="shadow-sm border-gray-100"
                    />
                </div>
            )}
            <GeneralTooltip
                content={`${hasEnoughWords ? "Submit your report issue" : "Please enter details to proceed"}`}
                space={20}
            >
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !hasEnoughWords}
                    className="h-10"
                    variant="blue"
                    showProgress={isLoading}
                    progressSize="1.2rem"
                >
                    Submit Issue
                </Button>
            </GeneralTooltip>
        </div>
    );
};

export interface InnerThankYouProps {
    onCloseButton: () => void;
    issueLink?: string;
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

const InnerThankYou = ({ onCloseButton, issueLink }: InnerThankYouProps) => {
    // Close InnerThankYou after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onCloseButton();
        }, 5000); // 5 seconds

        return () => clearTimeout(timer); // Clear the timer when the component is unmounted
    }, [onCloseButton]);

    // Inline styles for the progress bar animation
    const progressBarStyles = {
        animation: `progressBar 5s linear forwards`,
        height: "3px",
        backgroundColor: "#005072", // replace with your color code if different
        width: "100%",
        borderRadius: "0.25rem",
    };

    return (
        <div className="flex flex-col select-none">
            <div className="flex flex-col space-y-3 p-4 h-full ">
                <div className="flex justify-end w-full" onClick={onCloseButton}>
                    <VscClose className="w-5 h-auto text-gray-400 hover:text-aiot-blue text-xs flex justify-end0"></VscClose>
                </div>
                <div className="flex w-full items-center justify-center">
                    <img className="flex w-24 h-auto object-contain" src="/imgs/confetti.png"></img>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <p className="text-2xl text-aiot-blue mb-3 font-semibold">You're Awesome!</p>
                    <p className="text-sm text-gray-600 text-center mb-3 tracking-normal">
                        Thanks for improving our playground with your input
                    </p>
                    <div className="text-xs text-aiot-blue no-underline mb-5 hover:underline">
                        <a href={issueLink} target="_blank" rel="noopener noreferrer">
                            Track your impact's journey here.
                        </a>
                        .
                    </div>
                </div>
            </div>
            <div style={progressBarStyles}></div>
        </div>
    );
};

interface ReportPopupProps {
    isOpen: boolean; // Control by navigation.tsx
    onClose: () => void;
    onBeginHighlighting: () => void;
    onSubmit: () => void;
    onCloseButton: () => void;
    innerContent: string; // Control by navigation.tsx
    isCompleteHighlighting: boolean; // Control by navigation.tsx
    screenshotDataUrl: string;
}

const ReportPopup = ({
    isOpen,
    onClose,
    onBeginHighlighting,
    onSubmit,
    isCompleteHighlighting,
    screenshotDataUrl,
    innerContent,
    onCloseButton,
}: ReportPopupProps) => {
    const [description, setDescription] = useState("");
    const [issueLink, setIssueLink] = useState(""); // Added state for issueLink

    // When user click outside the modal, close the modal and reset the inner content
    const handleModalClose = () => {
        onClose();
    };

    const handleOnSubmit = () => {
        onSubmit();
        setDescription("");
    };

    // Preload the image
    useEffect(() => {
        const img = new Image();
        img.src = "/imgs/confetti.png";
    }, []);

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleModalClose}
            className="bg-white bottom-4 right-4 h-auto rounded-md overflow-hidden w-[450px]"
        >
            {innerContent === "thank" && <InnerThankYou onCloseButton={onCloseButton} issueLink={issueLink} />}

            {innerContent === "report" && (
                <InnerReport
                    onBeginHighlighting={onBeginHighlighting}
                    onClose={handleModalClose}
                    screenshotDataUrl={screenshotDataUrl}
                    isCompleteHighlighting={isCompleteHighlighting}
                    onSubmit={handleOnSubmit}
                    description={description}
                    setDescription={setDescription}
                    onCloseButton={onCloseButton}
                    setIssueLink={setIssueLink}
                />
            )}
        </CustomModal>
    );
};

export default ReportPopup;
