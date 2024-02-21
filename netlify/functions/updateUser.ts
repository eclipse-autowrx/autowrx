import { Handler } from "@netlify/functions";
import { auth, db } from "../firebase";
import { User } from "../../src/apis/models/index";
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

        const { name, email, image_file, uid } = event.queryStringParameters as {
            email?: string;
            name?: string;
            image_file?: string;
            uid: string;
        };

        if (!uid) {
            throw new Error("uid is required");
        }

        let querys = await db.collection("user").where("uid", "==", uid).limit(1).get();
        if (querys.empty) {
            throw new Error("uid not found");
        }
        const user = querys.docs[0];
        let tmp = user.data();
        tmp.name = name || tmp.name;
        tmp.email = email || tmp.email;
        tmp.image_file = image_file || tmp.image_file;
        await user.ref.update(tmp);

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
