import { useEffect, useState } from "react";
import permissions from "../../permissions";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import { initFeatureList, loadAllFeature, supportFeatures } from "./featureUtils";
import LoadingPage from "../components/LoadingPage";
import { getUsers } from "../../apis";
import FeatureDetails from "./FeatureDetails";
import { TbChevronRight, TbChartHistogram, TbStack2, TbLockAccess } from "react-icons/tb";
import Button from "../../reusable/Button";
// import FeatureAnalysis from "./FeatureAnalysis";
import { fetchLog } from "./featureUtils";

export const ENDUSER_FEATURES_KEYS = [
    "GEN_AI_PYTHON",
    "VIEW_API_MAPPING",
    "DEPLOY_TO_DREAMKIT",
    "DEPLOY_TO_VM",
    "DEPLOY_TO_PILOT",
];

type TabType = "Feature" | "Management" | "Analytics";

const ManageFeatures = () => {
    const { profile } = useCurrentUser();
    const [loading, setLoading] = useState(false);
    const [endUserFeature, setEndUserFeature] = useState<any[]>([]); // eg. genAI, apiMapping
    const [managementFeatures, setManagementFeatures] = useState<any[]>([]); //eg. manageUsers, viewMetrix
    const [users, setUsers] = useState<any[]>([]); // total user
    const popupState = useState(false);
    const [activeFeature, setActiveFeature] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>("Feature");
    const [featureData, setFeatureData] = useState<any>({});
    const [rawLogData, setRawLogData] = useState<any[]>([]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setActiveFeature(tab === "Feature" ? endUserFeature[0] : managementFeatures[0]); // Set the first feature as active when switching tabs
    };

    useEffect(() => {
        fetchLogData();
        loadAllFeatures();
    }, []);

    const fetchLogData = async () => {
        const { featureCounts, rawLogData } = await fetchLog();
        setFeatureData(featureCounts);
        setRawLogData(rawLogData);
    };

    const loadAllFeatures = async () => {
        setLoading(true);
        let tmpUses = users;
        if (!users || users.length === 0) {
            let dbUsers = await getUsers();
            tmpUses = dbUsers;
            setUsers(dbUsers);
        }

        try {
            let res = await loadAllFeature();
            if (res && res.length === 0) {
                await initFeatureList();
                res = await loadAllFeature();
            }

            res.forEach((feature: any) => {
                updateUserListForFeature(feature, tmpUses);
            });

            const featureTabFeatures = res.filter((feature: any) => ENDUSER_FEATURES_KEYS.includes(feature.key));
            const managementTabFeatures = res.filter((feature: any) => !ENDUSER_FEATURES_KEYS.includes(feature.key));

            setEndUserFeature(featureTabFeatures || []);
            setManagementFeatures(managementTabFeatures || []);

            // Re-select the active feature to update its state with the latest data
            if (activeFeature) {
                const updatedActiveFeature = res.find((f) => f.id === activeFeature.id);
                setActiveFeature(updatedActiveFeature || res[0]);
            } else if (res.length > 0) {
                // Set the first feature from the appropriate list as active if there is no active feature
                const firstFeature =
                    activeTab === "Feature" && featureTabFeatures.length > 0
                        ? featureTabFeatures[0]
                        : managementTabFeatures.length > 0
                          ? managementTabFeatures[0]
                          : null;
                setActiveFeature(firstFeature);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const updateUserListForFeature = (feature: any, tmpUsers: any[]) => {
        feature.users = [];
        feature.uids.forEach((uid: string) => {
            let user = tmpUsers.find((user: any) => user.uid === uid);
            if (user) {
                feature.users.push(user);
            }
        });
    };

    const handleReloadFeatures = async () => {
        await loadAllFeatures();
    };

    const handleFeatureClick = (feature) => {
        setActiveFeature(feature);
    };

    const FeatureList = ({ featureList, activeFeature, onFeatureClick }) => {
        return (
            <div className="flex flex-col w-[50%] min-w-fit h-full space-y-2 p-2 border-r select-none cursor-pointer overflow-y-auto scroll-gray">
                {featureList.map((feature: any) => (
                    <div
                        key={feature.id}
                        className={`flex p-2 min-w-fix hover:bg-gray-100 rounded justify-between border border-transparent !text-gray-800 ${
                            activeFeature && activeFeature.id === feature.id
                                ? "bg-gray-100 !border-gray-200"
                                : "bg-white !text-gray-500"
                        }`}
                        onClick={() => onFeatureClick(feature)}
                    >
                        <div>{feature.name}</div>
                        {activeFeature && activeFeature.id === feature.id && (
                            <TbChevronRight className="w-[1rem] h-auto" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full h-full py-4 items-center">
            {permissions.TENANT(profile).canEdit() ? (
                <>
                    {loading && <LoadingPage />}
                    {!loading && (
                        <div className="min-w-[960px] h-full max-h-[500px]">
                            <div className="flex items-center mb-4">
                                <div className="text-2xl font-bold text-gray-800 flex items-center">
                                    Feature Management{" "}
                                </div>
                                <div className="grow" />
                            </div>
                            <div className="flex mb-4 w-fit rounded bg-gray-100 text-base">
                                <Button
                                    className={`my-1 ml-1 mr-0.5 border ${
                                        activeTab === "Feature"
                                            ? "bg-white !text-gray-800  !border-gray-200"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                    onClick={() => handleTabChange("Feature")}
                                    icon={TbStack2}
                                >
                                    End-user features ({endUserFeature.length})
                                </Button>
                                <Button
                                    className={`my-1 ml-1 mr-0.5 border ${
                                        activeTab === "Management"
                                            ? "bg-white !text-gray-800  !border-gray-200"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                    onClick={() => handleTabChange("Management")}
                                    icon={TbLockAccess}
                                >
                                    Management features ({managementFeatures.length})
                                </Button>
                                <Button
                                    className={`my-1 ml-0.5 mr-1 border ${
                                        activeTab === "Analytics"
                                            ? "bg-white !text-gray-800  !border-gray-200"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                    onClick={() => handleTabChange("Analytics")}
                                    icon={TbChartHistogram}
                                >
                                    Analytics
                                </Button>
                            </div>
                            {activeTab === "Feature" && (
                                <div className="flex w-full h-full rounded border border-gray-100 shadow-sm">
                                    <FeatureList
                                        featureList={endUserFeature}
                                        activeFeature={activeFeature}
                                        onFeatureClick={handleFeatureClick}
                                    />
                                    <FeatureDetails
                                        feature={activeFeature}
                                        setLoading={setLoading}
                                        popupState={popupState}
                                        loadAllFeatures={handleReloadFeatures}
                                        data={rawLogData}
                                        users={users}
                                        showActiveUsers={true}
                                    />
                                </div>
                            )}
                            {activeTab === "Management" && (
                                <div className="flex w-full h-full rounded border border-gray-100 shadow-sm">
                                    <FeatureList
                                        featureList={managementFeatures}
                                        activeFeature={activeFeature}
                                        onFeatureClick={handleFeatureClick}
                                    />
                                    <FeatureDetails
                                        feature={activeFeature}
                                        setLoading={setLoading}
                                        popupState={popupState}
                                        loadAllFeatures={handleReloadFeatures}
                                        data={rawLogData}
                                        users={users}
                                    />
                                </div>
                            )}
                            {/* {activeTab === "Analytics" && (
                                <div className="flex w-full h-full rounded border border-gray-100 shadow-sm">
                                    <FeatureAnalysis data={featureData} rawLogData={rawLogData} />
                                </div>
                            )} */}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex w-full justify-center items-center mt-16 select-none">
                    <div className="text-xl text-gray-500">You need to be an admin to manage endUserFeature.</div>
                </div>
            )}
        </div>
    );
};

export default ManageFeatures;
