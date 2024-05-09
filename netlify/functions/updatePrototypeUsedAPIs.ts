import { Handler } from "@netlify/functions";
import { db } from "../firebase";

export interface API {
    description: string;
    name: string;
    parent: string;
    shortName: string;
    type: string;
    isWishlist: boolean;
    uuid: string;
}

const handler: Handler = async (event, context) => {
    const { id, usedAPIs } = JSON.parse(event.body || "") as { id: string; usedAPIs: API[] };

    if (!id || !usedAPIs) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "id and usedAPIs are required." }),
        };
    }

    try {
        let prototypeDoc = await db.collection("project").doc(id).get();

        if (!prototypeDoc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Prototype not found." }),
            };
        }
        const useApiNames = usedAPIs.map((api) => api.name);
        await db.collection("project").doc(id).update({ "apis.VSS": useApiNames });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Successfully updated prototype used APIs." }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: String(error) }),
        };
    }
};

export { handler };
