import { useState, useEffect, useMemo } from "react";
import { Issue, Survey } from "../../../apis/models";
import CustomModal from "../../../reusable/Popup/CustomModal";
import { fetchIssuesAndSurveys } from "./ReportFunctions";
import ReportManagement from "./ReportManagement";
import IssueDiscussion from "../Discussion/IssueDiscussion";
import CustomPaginate from "../../../reusable/Paginate/CustomPaginate";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import { TbChevronsDown, TbChevronsUp, TbChevronDown } from "react-icons/tb";
import { LiaGripLinesSolid } from "react-icons/lia";
import ImageModalContent from "../../../reusable/Carousel/ImageModalContent";
import { useNavigate } from "react-router-dom";
// import { useParamsX } from "../../../reusable/hooks/useUpdateNavigate";
import { useParams } from "react-router-dom";
import permissions from "../../../permissions";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";

const Report: React.FC = () => {
    const { issues, surveys } = fetchIssuesAndSurveys();
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [selectedIssueTitle, setSelectedTitle] = useState<string | null>(null);

    const [openIssues, setOpenIssues] = useState<Issue[]>([]);
    const [closedIssues, setClosedIssues] = useState<Issue[]>([]);
    const [resolvedIssues, setResolvedIssues] = useState<Issue[]>([]);
    const [inProgressIssues, setInProgressIssues] = useState<Issue[]>([]);

    const { isLoggedIn, user, profile } = useCurrentUser();
    const isAdmin = permissions.TENANT(profile).canEdit();

    const navigate = useNavigate();
    const { issue_id = "" } = useParams();

    // Featch status issues
    useEffect(() => {
        setOpenIssues(issues.filter((issue) => issue.status === "Open"));
        setClosedIssues(issues.filter((issue) => issue.status === "Closed"));
        setResolvedIssues(issues.filter((issue) => issue.status === "Resolved"));
        setInProgressIssues(issues.filter((issue) => issue.status === "In Progress"));
    }, [issues]);

    const TIMESTAMP_OPTIONS = [
        { value: "Latest", label: "Latest" },
        { value: "Oldest", label: "Oldest" },
    ];

    const STATUS_OPTIONS = [
        { value: "Open", label: "Open" },
        { value: "In Progress", label: "In Progress" },
        { value: "Resolved", label: "Resolved" },
        { value: "Closed", label: "Closed" },
    ];

    const PRIORITY_OPTIONS = [
        { value: "High", label: "High", icon: <TbChevronsUp className="w-4 h-4 text-red-500" /> },
        { value: "Medium", label: "Medium", icon: <LiaGripLinesSolid className="w-4 h-4 text-yellow-500" /> },
        { value: "Low", label: "Low", icon: <TbChevronDown className="w-4 h-4 text-blue-500" /> },
        { value: "Lowest", label: "Lowest", icon: <TbChevronsDown className="w-4 h-4 text-blue-500" /> },
    ];

    const defaultOption = { value: "Open", label: "Open" }; // Set default filter to 'Open'
    const [selectedFilter, setSelectedFilter] = useState<string | undefined>("Open");

    const combinedFilterOptions = [
        defaultOption,
        ...STATUS_OPTIONS.filter((option) => option.value !== defaultOption.value),
        ...PRIORITY_OPTIONS,
        ...TIMESTAMP_OPTIONS,
        { value: "", label: "Select a filter option" },
    ];
    function filterIssues(issues: Issue[], selectedFilter: string | undefined): Issue[] {
        let filteredIssues = [...issues]; // Shallow copy of issues

        // Filter by status
        const isStatusFilter = STATUS_OPTIONS.some((option) => option.value === selectedFilter);
        if (isStatusFilter) {
            filteredIssues = filteredIssues.filter((issue) => issue.status === selectedFilter);
        }
        // Sort by creation time
        filteredIssues.sort((a, b) => {
            const aTime = a.timestamp && a.timestamp.created_time ? a.timestamp.created_time.toDate().getTime() : 0;
            const bTime = b.timestamp && b.timestamp.created_time ? b.timestamp.created_time.toDate().getTime() : 0;
            return selectedFilter === "Oldest" ? aTime - bTime : bTime - aTime;
        });
        // Sort by priority
        const isPriorityFilter = PRIORITY_OPTIONS.some((option) => option.value === selectedFilter);
        if (isPriorityFilter) {
            filteredIssues = filteredIssues.filter((issue) => issue.priority === selectedFilter);
        }

        return filteredIssues;
    }

    function selectIssue(issue: Issue) {
        setSelectedIssue(issue);
        setSelectedIssueId(issue.id);
        const selectedIssueTitle = selectedIssue
            ? `${selectedIssue.affectedCluster}-${selectedIssue.orderNumber}`
            : null;
        setSelectedTitle(selectedIssueTitle);
    }

    function openModal(imageUrl: string) {
        setSelectedImage([imageUrl]);
        setModalIsOpen(true);
    }

    const [itemsOffset, setItemsOffset] = useState(0);
    const ITEMS_PER_PAGE = 14;

    const filteredIssues = useMemo(() => {
        return filterIssues(issues, selectedFilter);
    }, [issues, selectedFilter]);

    const currentIssues = useMemo(() => {
        return filteredIssues.slice(itemsOffset, itemsOffset + ITEMS_PER_PAGE);
    }, [filteredIssues, itemsOffset]);

    useEffect(() => {
        setItemsOffset(0); // Reset pagination when filter changes
    }, [selectedFilter]);

    // Set selected issue when issue_id changes
    useEffect(() => {
        // console.log("issues", issues)
        // console.log("issue_id", issue_id)
        if (issue_id) {
            const issue = issues.find((issue) => issue.id === issue_id);
            if (issue) {
                selectIssue(issue);
            }
        }
    }, [issue_id, issues]);

    const statusClasses =
        "flex px-2 py-1 h-fit bg-gray-50 border border-gray-200 shadow-sm rounded text-sm text-gray-600";

    return (
        <div className="flex h-full w-full overflow-hidden">
            {isAdmin ? (
                <div id="ReportIssue_Container" className="w-full inline-flex flex-col">
                    <div className="flex w-full border-b justify-between p-3 select-none items-center">
                        <div className="flex flex-col">
                            <div className="text-xl font-bold uppercase text-aiot-blue ">Reported Issues</div>
                            <div className="flex text-xs text-gray-400">Total Issues: {issues.length}</div>
                        </div>
                        <div className="flex space-x-2 rounded">
                            <div className={`${statusClasses}`}>Open: {openIssues.length}</div>
                            <div className={`${statusClasses}`}>In Progress: {inProgressIssues.length}</div>
                            <div className={`${statusClasses}`}>Resolved: {resolvedIssues.length}</div>
                            <div className={`${statusClasses}`}>Closed: {closedIssues.length}</div>
                        </div>
                    </div>
                    <div className="flex w-full h-full border-r overflow-y-hidden">
                        <div className="flex flex-col w-1/6 h-full border-r border-gray-300">
                            <div className="flex w-full">
                                <div className="flex w-full justify-between p-2">
                                    {/* <div className="text-gray-500 text">Filter:</div> */}
                                    <CustomSelect
                                        customStyle="px-1 py-1 rounded border border-gray-200 bg-white text-gray-500 shadow-none hover:border-gray-300 text-xs w-48 select-none"
                                        customDropdownContainerStyle="w-40 text-xs select-none"
                                        options={combinedFilterOptions}
                                        selectedValue={selectedFilter}
                                        onValueChange={(value) => {
                                            if (typeof value === "string" || typeof value === "undefined") {
                                                setSelectedFilter(value);
                                            }
                                        }}
                                        fullWidth={true}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col w-full h-full overflow-auto scroll-gray select-none">
                                {currentIssues.map((issue, i) => (
                                    <div
                                        key={i}
                                        className={`border-b text-xs flex justify-between hover:bg-aiot-blue/5 cursor-pointer ${
                                            selectedIssue && selectedIssue.id === issue.id
                                                ? "bg-aiot-blue/10 border-transparent"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            selectIssue(issue);
                                            navigate(
                                                window.location.pathname.split("issues")[0] + "issues/" + issue.id
                                            );
                                        }}
                                    >
                                        <div
                                            className={`flex w-full items-center py-2 ${
                                                selectedIssue && selectedIssue.id === issue.id
                                                    ? " border-l-4 border-aiot-blue "
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex pl-2 text-aiot-blue">{i + 1}</div>
                                            <div className="flex flex-col pl-2 pr-3 w-full overflow-x-hidden">
                                                <div className="inline-flex items-center">
                                                    <div className="text-xs text-aiot-blue cursor-pointer ml-1 w-full truncate">
                                                        <span className="uppercase">{issue.affectedCluster}</span>-
                                                        {issue.orderNumber}
                                                    </div>
                                                </div>
                                                <p className="pl-1 capitalize text-gray-500 truncate overflow-x-hidden">
                                                    {issue.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Paginator at the Bottom */}
                            <div className="flex px-1 pt-2 justify-center overflow-hidden">
                                <CustomPaginate
                                    customCssStyle={{ transform: "scale(0.7)" }}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    items={filteredIssues}
                                    setItemsOffset={setItemsOffset}
                                />
                            </div>
                        </div>
                        <div className="flex w-5/6 h-full overflow-auto scroll-gray">
                            {selectedIssue ? (
                                <div className="flex flex-col h-full w-full p-4">
                                    <div className="w-full h-full pb-5">
                                        <ReportManagement issue={selectedIssue} openModal={openModal} />
                                    </div>
                                    <div className="flex pt-3 pb-16 w-[65%] h-auto text-xs shrink-0">
                                        <div className="flex flex-col w-full  text-gray-800">
                                            <h4 className="w-full text-[1rem] text-aiot-blue mb-4 mt-1 font-semibold">
                                                Discussion
                                            </h4>
                                            <IssueDiscussion
                                                issueID={selectedIssueId}
                                                issueTitle={selectedIssueTitle}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className=" p-4 text-sm text-gray-600 uppercase select-none">
                                    Select an issue from the left panel to view its details.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col w-full h-full p-4 overflow-auto scroll-gray">
                    <div className="w-full h-full pb-5">
                        {selectedIssue ? (
                            <div className="pointer-event-none">
                                <div className="text-xl font-bold uppercase text-aiot-blue overflow-auto">
                                    Reported Issue
                                </div>
                                <ReportManagement issue={selectedIssue} openModal={openModal} canEdit={false} />
                            </div>
                        ) : (
                            <div>Issue Not Found</div>
                        )}
                    </div>
                    {/* <div className="flex pt-3 pb-16 w-[65%] h-auto text-xs shrink-0">
                        <div className="flex flex-col w-full  text-gray-800">
                            <h4 className="w-full text-[1rem] text-aiot-blue mb-4 mt-1 font-semibold">Discussion</h4>
                            <IssueDiscussion issueID={selectedIssueId} issueTitle={selectedIssueTitle} />
                        </div>
                    </div> */}
                </div>
            )}
            <ImageModalContent
                images={selectedImage}
                currentImageIndex={0}
                isVisible={modalIsOpen}
                onClose={() => setModalIsOpen(false)}
            />
        </div>
    );
};

export default Report;
