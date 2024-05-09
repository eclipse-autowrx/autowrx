import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import { Prototype } from "../../apis/models";
import PrototypeCard from "./PrototypeCard";

// Store data in local storage with expiry
const setWithExpiry = (key: string, data: any, ttl: number) => {
    const now = new Date();
    const item = {
        value: data,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
};

// Retrieve data from local storage with expiry
const getWithExpiry = (key: string) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
};

interface RecommendedPrototype {
    prototype: Prototype;
    commonApiCount: number;
}

const PersonalizeRelevance = () => {
    const { profile } = useCurrentUser();
    const [allPrototypes, setAllPrototypes] = useState<Prototype[]>([]);
    const [recommendedPrototypes, setRecommendedPrototypes] = useState<RecommendedPrototype[]>([]);

    const getModelVisibility = () => {
        const visibilityData = localStorage.getItem("modelVisibility");
        return visibilityData ? JSON.parse(visibilityData) : {};
    };

    // Fetch data from server or local storage, filtering by model visibility
    const fetchData = useCallback(async (key: string, apiPath: string) => {
        const cachedData = getWithExpiry(key);

        if (cachedData && cachedData.length > 0) {
            // console.log(`Fetched ${key} from cache`, cachedData);
            return cachedData;
        }

        try {
            // Fetch all prototypes or trending prototypes from api
            const response = await axios.get(apiPath);
            const modelVisibility = getModelVisibility();
            // Filter prototypes with VSS APIs and model visibility
            const prototypes = response.data.filter(
                (proto: Prototype) =>
                    proto.apis &&
                    proto.apis.VSS.length > 0 &&
                    modelVisibility[proto.model_id] === "public" &&
                    proto.image_file // A complete prototype should have an image
            );
            setWithExpiry(key, prototypes, 604800000); // 1 week
            // console.log(`Fetched from ${key}`, prototypes);
            return prototypes;
        } catch (error) {
            console.error(`Error fetching ${key}:`, error);
            return [];
        }
    }, []);

    // Fetch all and trending prototypes
    useEffect(() => {
        fetchData("prototypes", "/.netlify/functions/listAllPrototypes").then(setAllPrototypes);
    }, [fetchData]);

    // Compute recommended prototypes
    useEffect(() => {
        if (!profile || allPrototypes.length === 0) return;

        // Filter prototypes associated with the user's model_contributor roles
        const userAssociatedPrototypes = allPrototypes.filter((proto) =>
            profile.roles.model_contributor.includes(proto.model_id)
        );
        // Collect all APIs associated with the user's prototypes
        const userApis = new Set(userAssociatedPrototypes.flatMap((proto) => proto.apis.VSS));

        // Compute recommendations based on common APIs
        const recommendations = allPrototypes
            .filter((proto) => !userAssociatedPrototypes.includes(proto)) // Exclude user's prototypes -> Only recommend new ones that share common APIs
            .map((proto) => ({
                prototype: proto,
                commonApiCount: proto.apis.VSS.filter((api) => userApis.has(api)).length, // Count common APIs
            }))
            .filter((item) => item.commonApiCount > 0) // Exclude prototypes with no common APIs
            .sort((a, b) => b.commonApiCount - a.commonApiCount); // Sort the most common APIs first

        setRecommendedPrototypes(recommendations.slice(0, 8)); // Display 4 most relevant prototypes
        // console.log("Recommended Prototypes", recommendations);
    }, [profile, allPrototypes]);

    return (
        <div className=" flex flex-col w-full h-full max-w-[1920px]">
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 min-h-0 max-h-[calc(100vh-100px)]">
                    {recommendedPrototypes.slice(0, 8).map((recommendPrototype) => (
                        <div key={recommendPrototype.prototype.id} className="w-full h-full relative">
                            <PrototypeCard data={recommendPrototype.prototype} />
                        </div>
                    ))}
                </div>
            </>
        </div>
    );
};

export default PersonalizeRelevance;
