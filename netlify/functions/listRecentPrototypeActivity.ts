import { Handler } from "@netlify/functions";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import { Prototype } from "../../src/apis/models/index";

export const handler: Handler = async function (event, context) {
    try {
        // Fetch prototypes recommended based on recent activity
        const visiblePrototypes = await fetchTrendingPrototypes();

        return {
            statusCode: 200,
            body: JSON.stringify(visiblePrototypes),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Request failed", error: error.toString() }),
        };
    }
};

// Fetch trending prototypes based on user interactions in the last 7 days
async function fetchTrendingPrototypes(): Promise<Prototype[]> {
    const from = Timestamp.fromDate(dayjs().subtract(7, "day").toDate());
    const to = Timestamp.fromDate(dayjs().toDate());

    // Fetch activity within the last 7 days, considering the prototypes with the highest activity
    const prototypeActivity = await db
        .collection("activity_log")
        .where("ref_type", "==", "prototype")
        .where("created_time", ">=", from)
        .where("created_time", "<=", to)
        .limit(1000)
        .get();

    let prototypeCounts = new Map<string, number>();
    // Accumulate counts of prototype references to determine 'trending' status
    prototypeActivity.forEach((activity) => {
        const refId = activity.data().ref_id;
        prototypeCounts.set(refId, (prototypeCounts.get(refId) || 0) + 1);
    });
    // console.log("Prototype counts:", prototypeCounts);
    // Sort prototype IDs by activity count to prioritize those with most user interaction
    let sortedPrototypeIds = Array.from(prototypeCounts.keys()).sort(
        (a, b) => prototypeCounts.get(b)! - prototypeCounts.get(a)!
    );

    // Select the top 15 for further processing to ensure a good pool of candidates
    let prototypes = await fetchPrototypesDetails(sortedPrototypeIds.slice(0, 30));
    return prototypes;
}

// Fetch details for a list of prototype IDs from the 'project' collection
async function fetchPrototypesDetails(prototypeIds: string[]): Promise<Prototype[]> {
    // Query the database for prototypes using a batch of IDs
    let query = db.collection("project").where("id", "in", prototypeIds);
    let snapshot = await query.get();
    // Map the document snapshots to Prototype interface
    return snapshot.docs.map((doc) => doc.data() as Prototype);
}
