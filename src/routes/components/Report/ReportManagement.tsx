import React, { useState, useEffect } from "react";
import { Issue } from "../../../apis/models";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import CollapseButton from "../../../reusable/CollapseButton";
import { AiFillEdit } from "react-icons/ai";
import { formatTimestamp } from "./ReportFunctions";
import { UpdateCreateStatus, UpdateCreatePriority, UpdateCreateAssignee } from "./ReportFunctions";
import { TbChevronsDown, TbChevronsUp, TbChevronDown } from "react-icons/tb";
import { LiaGripLinesSolid } from "react-icons/lia";
import { REFS } from "../../../apis/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface ReportManagementProps {
    issue: Issue;
    openModal: (imageUrl: string) => void;
    canEdit?: boolean;
}

const ReportManagement: React.FC<ReportManagementProps> = ({ issue, openModal, canEdit = true }) => {
    const [isExpandedContext, setIsExpandedContext] = useState(true);
    const [isExpandedEnvironment, setIsExpandedEnvironment] = useState(true);
    const [isExpandedDate, setIsExpandedDate] = useState(true);
    const [editHover, setEditHover] = useState(false);
    const [assignee, setAssignee] = useState(issue.assignee ?? "");

    function handleAssigneeInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        setAssignee(event.target.value);
    }

    function onAssignClick() {
        UpdateCreateAssignee(issue.id, assignee);
    }

    const statusOptions = [
        { value: "Open", label: "Open" },
        { value: "In Progress", label: "In Progress" },
        { value: "Resolved", label: "Resolved" },
        { value: "Closed", label: "Closed" },
    ];
    const [status, setStatus] = useState(issue.status || statusOptions[0].value);

    const priorityOptions = [
        { value: "High", label: "High", icon: <TbChevronsUp className="w-4 h-4 text-red-500" /> },
        { value: "Medium", label: "Medium", icon: <LiaGripLinesSolid className="w-4 h-4 text-yellow-500" /> },
        { value: "Low", label: "Low", icon: <TbChevronDown className="w-4 h-4 text-blue-500" /> },
        { value: "Lowest", label: "Lowest", icon: <TbChevronsDown className="w-4 h-4 text-blue-500" /> },
    ];
    const [priority, setPriority] = useState(issue.priority || priorityOptions[0].value);

    useEffect(() => {
        async function fetchIssue() {
            try {
                const issueRef = doc(REFS.issue, issue.id);
                const docSnapshot = await getDoc(issueRef);

                if (docSnapshot.exists()) {
                    const updatedIssue = docSnapshot.data() as Issue;

                    // Update status and priority
                    setStatus(updatedIssue.status || "Open");
                    setPriority(updatedIssue.priority || "");
                    setAssignee(updatedIssue.assignee || "");
                }
            } catch (error) {
                console.error("Error fetching the issue:", error);
            }
        }

        fetchIssue();
    }, [issue.id]); // Only trigger this when issue.id changes

    function handleStatusChange(newStatus) {
        setStatus(newStatus);
        UpdateCreateStatus(issue.id, newStatus); // Firebase update || create
    }

    function handlePriorityChange(newPriority) {
        setPriority(newPriority);
        UpdateCreatePriority(issue.id, newPriority); // Firebase update || create
    }

    function toggleContextDetails() {
        setIsExpandedContext((prev) => !prev);
    }

    function toggleEnvironmentDetails() {
        setIsExpandedEnvironment((prev) => !prev);
    }

    function toggleDateDetails() {
        setIsExpandedDate((prev) => !prev);
    }

    // raw timestamp from firebase

    return (
        <div className={`w-auto h-full ${canEdit ? "" : "pointer-events-none cursor-not-allowed select-none"}`}>
            {/* Render details for issue */}
            <div className="flex w-full justify-between items-center  mb-2">
                <h3 className="flex-grow text-[1rem] font-semibold text-aiot-blue">
                    <span className="uppercase">{issue.affectedCluster}</span>-{issue.orderNumber}
                </h3>
                <div className="flex-shrink-0">
                    <CustomSelect
                        customStyle="px-2 py-1 bg-gray-100 font-bold border border-gray-200/70 min-w-[7rem]"
                        options={statusOptions}
                        selectedValue={status}
                        onValueChange={handleStatusChange}
                    />
                </div>
            </div>

            <div className="w-full h-full flex">
                <div className="text-sm w-auto flex text-gray-700">
                    <div>
                        <div className="mt-4 space-y-3">
                            <p>
                                <span className="text-gray-500">Description:</span>{" "}
                                <span className="ml-1">{issue.description}</span>
                            </p>
                            <div className="flex w-full justify-around items-center pb-5 ">
                                <div className="flex w-full items-center">
                                    <span className="text-gray-500 pr-3">Priority: </span>
                                    <CustomSelect
                                        hideIndicator={true}
                                        options={priorityOptions}
                                        selectedValue={priority}
                                        onValueChange={handlePriorityChange}
                                        customStyle="px-2 py-1.5 rounded border border-transparent bg-white text-gray-500 shadow-none hover:border-gray-300 text-xs"
                                        customDropdownContainerStyle="text-xs"
                                        customDropdownItemStyle="hover:bg-gray-100 border-slate-200 px-2 py-1.5"
                                    />
                                </div>
                                <p className="flex w-full whitespace-nowrap">
                                    <span className="text-gray-500 pr-2">Reporter Email:</span> {issue.email}
                                </p>
                                <span className="text-gray-500 ml-10">Assignee: </span>
                                <div
                                    className="flex w-full"
                                    onMouseEnter={() => setEditHover(true)}
                                    onMouseLeave={() => setEditHover(false)}
                                >
                                    <input
                                        onChange={handleAssigneeInputChange}
                                        value={assignee}
                                        className={`border ml-2 h-6 outline-none ${
                                            editHover ? "border-gray-300" : "border-transparent"
                                        }`}
                                        defaultValue=""
                                    />
                                    {editHover && (
                                        <div
                                            onClick={onAssignClick}
                                            className="w-6 h-6 flex bg-gray-300  items-center justify-center"
                                        >
                                            <AiFillEdit className="w-4 h-4 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex justify-start border shadow-sm rounded w-auto"
                            style={{ maxWidth: "100rem" }}
                        >
                            {issue.imageUrl && (
                                <img
                                    loading="lazy"
                                    src={issue.imageUrl}
                                    onClick={() => openModal(issue.imageUrl)}
                                    className="flex h-full w-auto rounded-sm aspect-video object-fill cursor-pointe"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex w-full">
                        <div className="flex flex-col w-auto space-y-5 pl-10">
                            {/* Issue Context */}
                            <div className="flex flex-col space-y-3 w-full ">
                                <CollapseButton
                                    label="Issue Context"
                                    isExpanded={isExpandedContext}
                                    onClick={toggleContextDetails}
                                />
                                {isExpandedContext && (
                                    <div className="pl-5 space-y-3">
                                        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-3">
                                            <span className="text-gray-500 w-full" title="Affected Path">
                                                Affected Path:
                                            </span>
                                            <span title={issue.affectedPath} className="truncate w-full">
                                                {issue.affectedPath}
                                            </span>
                                            <span className="text-gray-500">Affected Cluster:</span>
                                            <span className="capitalize">{issue.affectedCluster}</span>
                                            <span className="text-gray-500">Affected Component:</span>
                                            <span>{issue.affectedComponent}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reporter Environment */}
                            <div className="flex flex-col space-y-3 w-full">
                                <CollapseButton
                                    label="Reporter Environment"
                                    isExpanded={isExpandedEnvironment}
                                    onClick={toggleEnvironmentDetails}
                                />
                                {isExpandedEnvironment && (
                                    <div className="pl-5 space-y-3">
                                        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-3">
                                            <span className="text-gray-500">Platform:</span>
                                            <span>{issue.os}</span>
                                            <span className="text-gray-500">Browser:</span>
                                            <span>{issue.browserName}</span>
                                            <span className="text-gray-500">Browser Version:</span>
                                            <span>{issue.browserVersion}</span>
                                            <span className="text-gray-500">Canvas Size:</span>
                                            <span>{issue.canvas_size}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Date Information */}
                            <div className="flex flex-col space-y-3 w-full">
                                <CollapseButton label="Date" isExpanded={isExpandedDate} onClick={toggleDateDetails} />
                                {isExpandedDate && (
                                    <div className="pl-5 space-y-3">
                                        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-3">
                                            <span className="text-gray-500">Created:</span>
                                            <span>{formatTimestamp(issue.timestamp.created_time)}</span>
                                            <span className="text-gray-500">Updated:</span>
                                            <span>{formatTimestamp(issue.timestamp.lastUpdated_time)}</span>
                                            <span className="text-gray-500">Resolved:</span>
                                            <span>{formatTimestamp(issue.timestamp.resolved_time)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportManagement;
