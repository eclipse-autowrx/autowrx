import { useEffect, useState } from "react";
import DisplayUserRow from "../Permissions/DisplayUserRow";
import SelectUserPopup from "../components/core/User/SelectUserPopup";
import Button from "../../reusable/Button";
import { TbUsersPlus, TbStar, TbStarFilled, TbSelector } from "react-icons/tb";
import { saveFeatureUids } from "./featureUtils";
import CustomModal from "../../reusable/Popup/CustomModal";
import { ENDUSER_FEATURES_KEYS } from ".";
import { supportFeatures } from "./featureUtils";

export interface FeatureDetailProps {
    feature: any;
    setLoading: (loading: boolean) => void;
    popupState: any;
    loadAllFeatures: () => void;
    data: any;
    users: any;
    showActiveUsers?: boolean;
}

const FeatureDetails = ({
    feature,
    setLoading,
    popupState,
    loadAllFeatures,
    data,
    users,
    showActiveUsers = false,
}: FeatureDetailProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const TIME_FILTER = ["All time", "Yesterday", "Last week", "Last month", "Last year"];
    const [timeFilter, setTimeFilter] = useState(TIME_FILTER[0]);
    const [isExpanded, setIsExpanded] = useState(false);

    const filterDataByTimeFrame = (data, timeFrame) => {
        // Check if data is an array
        if (!Array.isArray(data)) {
            console.error("Data is not an array:", data);
            return []; // Return an empty array or handle accordingly
        }

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        return data.filter((entry) => {
            const createdDate = new Date(entry.created_time);
            const timeDifference = now.getTime() - createdDate.getTime();
            const daysDifference = timeDifference / (24 * 60 * 60 * 1000); // milliseconds in a day

            switch (timeFrame) {
                case "Yesterday":
                    return createdDate.toDateString() === yesterday.toDateString();
                case "Last week":
                    return daysDifference <= 7;
                case "Last month":
                    return daysDifference <= 30;
                case "Last year":
                    return daysDifference <= 365;
                case "All time":
                default:
                    return true;
            }
        });
    };

    const countUserActivities = (data, type) => {
        return data.reduce((acc, entry) => {
            if (entry.type === type) {
                acc[entry.create_by] = (acc[entry.create_by] || 0) + 1;
            }
            return acc;
        }, {});
    };

    const userIdToNameMap = new Map(users.map((user) => [user.uid, user.name || "Unknown User"]));

    const getActiveUsers = (featureKey, timeFrame) => {
        let activityType = Object.keys(supportFeatures).find((key) => ENDUSER_FEATURES_KEYS[key] === featureKey);
        const filteredData = filterDataByTimeFrame(data, timeFrame);
        const activities = countUserActivities(filteredData, activityType);
        console.log("activities", activities);
        console.log("filteredData", filteredData);
        return Object.entries(activities)
            .map(([userId, count]) => ({
                name: userIdToNameMap.get(userId) || "Unknown User",
                count: count as number,
            }))
            .sort((a, b) => b.count - a.count);
    };

    if (feature) {
        return (
            <div className="flex w-full h-full p-2 ">
                <div className="pl-2 grow">
                    <div className="flex-col">
                        <div className="grow">
                            <div className="font-bold text-lg text-gray-700 leading-tight flex items-center">
                                <div className="grow leanding-none">{feature.name}</div>
                                {showActiveUsers && (
                                    <Button
                                        className="text-sm  font-normal mr-2"
                                        icon={TbStar}
                                        variant="white"
                                        onClick={() => setIsOpen(true)}
                                    >
                                        Usage Insights
                                    </Button>
                                )}
                                <Button
                                    className="text-sm font-normal"
                                    onClick={() => popupState[1](true)}
                                    variant="white"
                                    icon={TbUsersPlus}
                                    iconClassName="w-[1rem] h-auto"
                                >
                                    Add user
                                </Button>
                            </div>
                            <div className="text-[12px] pb-2">Users: {feature.uids.length}</div>
                            <div className="flex flex-col w-full max-h-[400px] overflow-auto scroll-gray">
                                <div className="w-full">
                                    {(feature.users ?? []).map((user: any) => (
                                        <DisplayUserRow
                                            key={user.uid}
                                            user={user}
                                            onRemove={async (user_id) => {
                                                setLoading(true);
                                                await saveFeatureUids(
                                                    feature.id,
                                                    feature.uids.filter((uid: any) => uid !== user_id)
                                                );
                                                await loadAllFeatures();
                                                setLoading(false);
                                            }}
                                        />
                                    ))}

                                    {!feature.uids ||
                                        (feature.uids.length == 0 && (
                                            <div className="py-2 px-4 text-center text-gray-400 bg-gray-50 rounded">
                                                No user be assigned
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex"></div>
                    </div>
                </div>

                <SelectUserPopup
                    popupState={popupState}
                    selectUser={async (uid: any) => {
                        if (feature) {
                            setLoading(true);
                            await saveFeatureUids(feature.id, [...feature.uids, uid]);
                            await loadAllFeatures();
                            setLoading(false);
                        }
                    }}
                    excludeUserIds={feature ? feature.uids : []}
                />

                <CustomModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    className="bg-white w-[450px] h-[400px] p-4 rounded-md overflow-hidden"
                >
                    <div className="flex h-full flex-col text-sm text-gray-600 select-none ">
                        <div className="flex w-full">
                            <div className="flex w-full font-bold text-lg pb-2 text-gray-800">Active users</div>
                            <div className="flex w-full justify-end relative">
                                <Button
                                    variant="white"
                                    className="flex bg-white justify-end hover:text-aiot-blue w-fit h-7"
                                    icon={TbSelector}
                                    onClick={() => {
                                        setIsExpanded(!isExpanded);
                                    }}
                                >
                                    {timeFilter}
                                </Button>
                                {isExpanded && (
                                    <div className="absolute flex flex-col top-8 right-0 bg-white z-10 rounded border border-gray-200 shadow-sm cursor-pointer">
                                        {TIME_FILTER.map((time) => (
                                            <div
                                                className="flex h-7 rounded hover:bg-gray-100 items-center text-gray-600 group justify-between px-2 py-1 m-1"
                                                key={time}
                                                onClick={() => {
                                                    setTimeFilter(time);
                                                    setIsExpanded(false);
                                                }}
                                            >
                                                <div className="flex text-sm mr-2">{time}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex h-full flex-col p-2  bg-gray-50 rounded">
                            <div className="flex text-gray-800 bg-gray-200/70 p-2 w-full rounded justify-between items-center">
                                <div>Name</div>
                                <div>Usage</div>
                            </div>
                            <div className="flex flex-col w-full max-h-[300px] overflow-y-auto scroll-gray">
                                {feature &&
                                    Object.values(ENDUSER_FEATURES_KEYS).includes(feature.key) &&
                                    getActiveUsers(feature.key, timeFilter).map((user, index) => (
                                        <div
                                            key={index}
                                            className="flex w-full pl-2 py-2 border-b border-gray-200 justify-between text-sm"
                                        >
                                            <div className="flex">
                                                <div className="font-bold">{index + 1}</div>
                                                <div className="whitespace-pre">{`.  ${user.name}`}</div>
                                            </div>
                                            <div className="pr-3">{user.count}</div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </CustomModal>
            </div>
        );
    } else {
        return (
            <div className="flex w-full h-full items-center justify-center font-bold text-gray-800">
                Select a feature
            </div>
        );
    }
};

export default FeatureDetails;
