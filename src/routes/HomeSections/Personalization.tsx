import { useEffect, useState } from "react";
import { CachePrototype, getRecentPrototypes } from "../../apis/backend/prototypeApi";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Tabs, { TabType } from "../../reusable/Tabs/Tabs";
import PersonalizeRelevance from "./PersonalizeRelevance";
import PersonalizeTrending from "./PersonalizeTrending";
import RecentPrototypes from "./RecentPrototypes";

const Personalization = () => {
    const { profile } = useCurrentUser();
    const [recents, setRecents] = useState<CachePrototype[]>([]);
    const [loading, setLoading] = useState(false);
    const [tabs, setTabs] = useState<TabType[]>([]);

    useEffect(() => {
        if (profile) {
            (async () => {
                try {
                    setLoading(true);
                    const response = await getRecentPrototypes(profile);
                    setRecents(response.data);
                } catch (error) {
                    console.log("Get recent prototypes error:", error);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [profile]);

    useEffect(() => {
        if (profile) {
            setTabs([
                {
                    title: "Recent Prototypes",
                    component: <RecentPrototypes loading={loading} recents={recents} />,
                },

                {
                    title: "Popular Prototypes",
                    component: <PersonalizeTrending />,
                },
            ]);
        } else {
            setTabs([
                {
                    title: "Popular Prototypes",
                    component: <PersonalizeTrending />,
                },
            ]);
        }
    }, [loading, profile, recents]);

    return (
        <div className="px-14 py-3 w-full h-full flex flex-col max-w-[1920px]">
            {tabs.length > 0 && <Tabs tabs={tabs} />}
        </div>
    );
};

export default Personalization;
