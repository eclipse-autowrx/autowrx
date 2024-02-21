import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import { User } from "../../src/apis/models/index";
import permissions from "../../src/permissions";
import { Buffer } from "buffer";

const getSingleUserProfile = async (uid: string) => {
    return (await db.collection("user").doc(uid).get()).data() as User;
};

export const handler: Handler = async function (event, context) {
    const idToken = event.headers["x-id-token"] ?? "";
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const profile = await getSingleUserProfile(decodedToken.uid);
        if (!permissions.TENANT(profile).canEdit()) {
            throw new Error("You must be a tenant admin to list users.");
        }

        let retUsers = [] as any[];

        let users = await db.collection("user").where("tenant_id", "==", TENANT_ID).get();

        if (!users.empty) {
            users.forEach((user) => {
                retUsers.push({ id: user.id, ...user.data() });
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify(retUsers),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
