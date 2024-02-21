// UserFeaturesContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { loadAllFeature } from "../../routes/ManageFeatures/featureUtils";

type UserFeature = string;

const GetUserFeaturesContext = createContext<{
    userFeatures: UserFeature[];
    hasAccessToFeature: (featureName: UserFeature) => boolean;
} | null>(null);

export const GetUserFeaturesProvider = ({ children, currentUser }: { children: React.ReactNode; currentUser: any }) => {
    const [userFeatures, setUserFeatures] = useState<UserFeature[]>([]);

    useEffect(() => {
        const loadUserFeatures = async () => {
            if (!currentUser || !currentUser.uid) {
                console.log("No currentUser or currentUser.uid");
                return;
            }

            try {
                const features = await loadAllFeature();
                // console.log("Fetched features:", features);
                const userAccess = features.filter((f) => f.uids.includes(currentUser.uid));
                // console.log("User access:", userAccess);
                setUserFeatures(userAccess.map((f) => f.key));
            } catch (error) {
                console.error("Error loading features:", error);
            }
        };

        loadUserFeatures();
    }, [currentUser]);

    const hasAccessToFeature = (featureName: UserFeature) => {
        return userFeatures.includes(featureName);
    };

    return (
        <GetUserFeaturesContext.Provider value={{ userFeatures, hasAccessToFeature }}>
            {children}
        </GetUserFeaturesContext.Provider>
    );
};

export const useGetUserFeatures = () => {
    const context = useContext(GetUserFeaturesContext);
    if (!context) {
        throw new Error("useGetUserFeatures must be used within a GetUserFeaturesProvider");
    }
    return context;
};
