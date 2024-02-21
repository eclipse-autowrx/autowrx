import { Handler } from "@netlify/functions";
import { auth, db } from "../firebase";
import { User, Feature } from "../../src/apis/models/index";
import permissions from "../../src/permissions";

const getSingleUserProfile = async (uid: string) => {
    return (await db.collection("user").doc(uid).get()).data() as User;
};

export const handler: Handler = async function (event, context) {
    const idToken = event.headers["x-id-token"] ?? "";
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const profile = await getSingleUserProfile(decodedToken.uid);
        if (!permissions.TENANT(profile).canEdit()) {
            throw new Error("You must be a tenant admin to create users.");
        }

        if (event.httpMethod != "PUT" || !event.body) {
            throw "Invalid request!";
        }
        let req = JSON.parse(event.body || "{}");

        if (!req.id || !Array.isArray(req.uids)) {
            throw "Invalid request!";
        }

        await db.collection("feature").doc(req.id).update({ uids: req.uids });

        return {
            statusCode: 200,
            body: JSON.stringify("Update success!"),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
