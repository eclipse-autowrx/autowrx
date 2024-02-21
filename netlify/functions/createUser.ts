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
            throw new Error("You must be a tenant admin to create users.");
        }

        const { name, email, image_file } = event.queryStringParameters as {
            email?: string;
            name?: string;
            image_file?: string;
        };
        const password = Buffer.from(randomUUID()).toString("base64").slice(0, 16);

        const { uid } = await auth.createUser({
            email,
            emailVerified: true,
            password,
        });

        await db
            .collection("user")
            .doc(uid)
            .set({
                tenant_id: TENANT_ID,
                uid: uid,
                roles: {},
                name: name ?? "",
                email,
                image_file: image_file ?? "",
                created_time: Timestamp.now(),
            });

        return {
            statusCode: 200,
            body: JSON.stringify({
                email,
                password,
            }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
