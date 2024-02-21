import { Handler } from "@netlify/functions";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";

export const handler: Handler = async function (event, context) {
    try {
        const { name, email, image_file, uid, provider } = event.queryStringParameters as {
            uid: string;
            email: string;
            name: string;
            image_file?: string;
            provider?: string;
        };
        // const password = Buffer.from(randomUUID()).toString("base64").slice(0, 16)

        let user = await db.collection("user").doc(uid).get();
        if (user.exists) {
            // console.log("user exists")
            return {
                statusCode: 200,
                body: JSON.stringify({
                    existed: true,
                    email: user.data()?.email,
                    name: user.data()?.name,
                }),
            };
        }

        let res = await db
            .collection("user")
            .doc(uid)
            .set({
                tenant_id: TENANT_ID,
                uid: uid,
                roles: {},
                name: (name || email) ?? "",
                email,
                image_file: image_file ?? "",
                provider: provider ?? "",
                created_time: Timestamp.now(),
            });

        // console.log("res", res)

        return {
            statusCode: 200,
            body: JSON.stringify({
                existed: false,
                email,
                name,
            }),
        };
    } catch (error) {
        // console.log(error)
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
