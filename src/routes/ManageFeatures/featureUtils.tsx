import axios from "axios";
import idTokenHeaders from "../../apis/idToken";
import { config } from "../../configs/config";

const supportFeatures = {
    GEN_AI_PYTHON: "Gen AI: Python",
    VIEW_USE_METRIX: "View: Use Metrix",
    VIEW_SYSTEM_LOGS: "View: System Logs",
    MANAGE_USERS: "Manage Users",
    UNLIMITED_MODEL_CREATION: "Unlimited Model Creation",
    DEPLOY_TO_DREAMKIT: "Deploy to DreamKit",
    DEPLOY_TO_VM: "Deploy to Virtual Machine",
    DEPLOY_TO_PILOT: "Deploy to Pilot Vehicle",
    VIEW_API_MAPPING: "View: VSS2CAN Mapping",
    // 'FREE_MODEL_CREATION': "Free model creation (3)",
    // 'FREE_PROTOTYPE_CREATION': "Free model creation (3)",
};

const initFeatureList = async () => {
    let listOfFeatures = [] as any[];
    for (const key in supportFeatures) {
        listOfFeatures.push({
            key: key,
            name: supportFeatures[key],
            uids: [],
        });
    }
    try {
        await axios.post(
            `/.netlify/functions/initFeatureList`,
            { features: listOfFeatures },
            {
                headers: await idTokenHeaders(),
            }
        );
    } catch (err) {}
};

const loadAllFeature = async () => {
    let res = await axios.get(`/.netlify/functions/listAllFeature`, {
        headers: await idTokenHeaders(),
    });
    if (res && res.data) {
        return res.data;
    }
    return [];
};

const saveFeatureUids = async (featureId: string, uids: string[]) => {
    try {
        await axios.put(
            `/.netlify/functions/updateFeature`,
            { id: featureId, uids },
            {
                headers: await idTokenHeaders(),
            }
        );
    } catch (err) {}
};

const fetchLog = async () => {
    try {
        const response = await axios.get(`${config.logBaseUrl}/?unlimited=1`);
        const data = response.data.data;
        const nonVisitData = data.filter((entry) => entry.type !== "visit");

        const featureCounts = nonVisitData.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});

        return { featureCounts, rawLogData: data };
    } catch (error) {
        console.error("Error fetching feature data:", error);
        return { featureCounts: {}, rawLogData: [] };
    }
};

export { supportFeatures, initFeatureList, loadAllFeature, saveFeatureUids, fetchLog };
