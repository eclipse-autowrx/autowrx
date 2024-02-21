import { ImBooks } from "react-icons/im";
import { MdLogin, MdPerson, MdLogout } from "react-icons/md";
import LinkWrap from "../reusable/LinkWrap";
import Tab from "../reusable/Tabs/Tab";
import LoginPopup from "../routes/components/LoginPopup";
import Logo from "../assets/logo.png";
import BoschLogo from "../assets/Logos/Bosch.png";
import { Model } from "../apis/models";
import useCurrentUser from "../reusable/hooks/useCurrentUser";
import MoreMenu from "./MoreMenu";
import MainSearch from "./MainSearch";
import MainMenuLink from "./MainMenuLink";
import SelectModelLink from "./SelectModelLink";
import { VscListTree, VscFeedback } from "react-icons/vsc";
import Dropdown from "../reusable/Dropdown";
import { MenuItem } from "@mui/material";
import { auth } from "../apis/firebase";
import Button from "../reusable/Button";
import ReportPopup from "../routes/components/Report/ReportPopup";
import { useState, useEffect } from "react";
import HighlightScreenshot from "../reusable/ReportTools/HighlightScreenshot";
import { TbMessageReport } from "react-icons/tb";
import SurveyPopup from "../routes/components/Report/SurveyPopup";
import { useAffectedRoute } from "../routes/components/Report/ReportFunctions";
import { isSecureInstance } from "../permissions/general";

interface NavigationProps {
    model: Model | undefined;
}

const Navigation = ({ model }: NavigationProps) => {
    const { isLoggedIn, user, profile } = useCurrentUser();
    const [isReportPopupOpen, setIsReportPopupOpen] = useState(false); // For ReportPopup open/close state
    const [isSurveyPopupOpen, setIsSurveyPopupOpen] = useState(true); // For SurveyPopup open/close state
    const [isDrawingGlobal, setIsDrawingGlobal] = useState(false); // For HighlightingScreenshot open/close state
    const [isCompleteHighlighting, setIsCompleteHighlighting] = useState(false);
    const [screenshotDataUrl, setScreenshotDataUrl] = useState("");
    const [innerContent, setInnerContent] = useState<"default" | "report" | "thank">("report");
    const [renderLogo, setRenderLogo] = useState("");

    const { affectedPath } = useAffectedRoute();

    useEffect(() => {
        if (isSecureInstance()) {
            setRenderLogo(Logo);
        } else {
            setRenderLogo(Logo);
        }
    }, []);

    // Open the HighlightingScreenshot component and close the InnerReport modal
    const handleBeginHighlighting = () => {
        setIsDrawingGlobal(true);
        setIsReportPopupOpen(false);
        setIsCompleteHighlighting(false);
    };
    // Close the HighlightingScreenshot component then pass the screenshotURL and open the InnerReport modal
    const handleEndHighlighting = (dataUrl) => {
        setIsDrawingGlobal(false);
        setIsReportPopupOpen(true);
        setIsCompleteHighlighting(true);
        setScreenshotDataUrl(dataUrl);
    };
    // When press close button in HighlightingScreenshot component
    const handleOnCloseHighlighting = () => {
        setIsDrawingGlobal(false);
        setIsReportPopupOpen(false);
        setIsCompleteHighlighting(false);
    };

    // Always hide the Feedback button when modal is opened
    // useEffect(() => {
    //     console.log("isReportPopupOpen updated:", isReportPopupOpen);
    // }, [isReportPopupOpen]);

    return (
        <header className="flex">
            <LinkWrap to="/">
                <img src={renderLogo} alt="Logo" className="h-6 m-4 select-none" />
            </LinkWrap>
            <div className="flex flex-1">
                <div className="grow"></div>
                <MainSearch />
                <SelectModelLink model={model} className="ml-auto" />
                {model && (
                    <div className="flex">
                        <MainMenuLink
                            name="Vehicle APIs"
                            to={`/model/${model.id}/cvi`}
                            Icon={({ ...props }) => {
                                return <VscListTree {...props} className="mr-3" style={{ transform: "scale(1.2)" }} />;
                            }}
                        />
                        <MainMenuLink name="Prototypes" to={`/model/${model.id}/library`} Icon={ImBooks} />

                        {/* <MainMenuLink name="Portfolio" to={`/model/${model.id}/library/portfolio`} Icon={VscFeedback} /> */}
                    </div>
                )}
                <MoreMenu model={model} />

                {isLoggedIn ? (
                    <Dropdown
                        trigger={
                            <Tab
                                label={<MdPerson className="scale-110" />}
                                className="flex h-full text-xl items-center px-4 !w-fit"
                            />
                        }
                    >
                        <LinkWrap to="/edit-profile" activeClassName="!text-aiot-green" className="text-slate-500">
                            <MenuItem className="px-4 py-1 text-inherit" style={{ minHeight: 36 }}>
                                <MdPerson
                                    size={28}
                                    className="text-3xl"
                                    style={{ transform: "scale(0.6)", marginRight: "2px" }}
                                />
                                <div>User Profile</div>
                            </MenuItem>
                        </LinkWrap>
                        <MenuItem
                            className="px-4 py-1"
                            style={{ minHeight: 36 }}
                            onClick={async () => {
                                if (confirm("Confirm logout?")) {
                                    await auth.signOut();
                                    window.location.href = "/";
                                }
                            }}
                        >
                            <MdLogout
                                size={28}
                                className="text-3xl"
                                style={{ transform: "scale(0.6)", marginRight: "2px" }}
                            />
                            <div>Logout</div>
                        </MenuItem>
                    </Dropdown>
                ) : (
                    <LoginPopup
                        trigger={
                            <Tab
                                label={<div className="text-[16px] font-semi-bold hover:underline">Sign in</div>}
                                className="flex h-full text-xl items-center pl-1 pr-3 !w-fit"
                            />
                        }
                    />
                )}
                <ReportPopup
                    isOpen={isReportPopupOpen}
                    isCompleteHighlighting={isCompleteHighlighting}
                    onClose={() => {
                        setIsReportPopupOpen(false);
                        setInnerContent("report");
                    }} // onClose modal not button close the window
                    onCloseButton={() => {
                        setIsReportPopupOpen(false);
                        setInnerContent("report");
                        setIsCompleteHighlighting(false);
                    }}
                    onSubmit={() => {
                        setIsCompleteHighlighting(false), setInnerContent("thank");
                    }}
                    onBeginHighlighting={handleBeginHighlighting}
                    screenshotDataUrl={screenshotDataUrl}
                    innerContent={innerContent}
                />

                {/* <div className="fixed w-[27rem] bottom-[4.25rem] right-4 h-auto border-aiot-blue object-contain" style={{ zIndex: 9999 }}>
                    <SurveyPopup isOpen={isSurveyPopupOpen && isLoggedIn && profile?.email} onCloseButton={() => { setIsSurveyPopupOpen(false); }} email={profile?.email} />
                </div> */}

                {!isReportPopupOpen &&
                    !isDrawingGlobal &&
                    affectedPath !== "/model/:model_id/library/prototype/:prototype_id/view/run" && (
                        <button
                            onClick={() => setIsReportPopupOpen(true)}
                            className="fixed bottom-4 right-4 text-[0.7rem] px-[0.45rem] py-[0.25rem] bg-gray-200 border border-transparent hover:bg-gray-200 text-gray-500 hover:text-gray-700 font-bold items-center justify-center flex rounded"
                            style={{ zIndex: 10000 }}
                        >
                            <span>
                                <TbMessageReport className="w-4 h-4 mr-1" />
                            </span>
                            Report
                        </button>
                    )}

                <HighlightScreenshot
                    isDrawingGlobal={isDrawingGlobal}
                    onEndHighlighting={handleEndHighlighting}
                    onClose={handleOnCloseHighlighting}
                    className="fixed bottom-0 right-0"
                />
            </div>
        </header>
    );
};

export default Navigation;
