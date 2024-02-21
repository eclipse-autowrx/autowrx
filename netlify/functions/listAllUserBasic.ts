import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import { User } from "../../src/apis/models/index";
import permissions from "../../src/permissions";

export const handler: Handler = async function (event, context) {
    try {
        let retUsers = [] as any[];

        let users = await db.collection("user").where("tenant_id", "==", TENANT_ID).get();

        if (!users.empty) {
            users.forEach((user) => {
                retUsers.push({
                    id: user.id,
                    uid: user.data().uid,
                    email: user.data().email,
                    name: user.data().name,
                    provider: user.data().provider,
                    image_file: user.data().image_file,
                    created_time: user.data().created_time,
                });
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
