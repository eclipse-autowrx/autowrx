import { Handler } from "@netlify/functions";
import { db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";

export const handler: Handler = async function (event, context) {
    try {
        const { masterType, masterId } = event.queryStringParameters as {
            masterType: string;
            masterId: string;
        };

        if (!masterType || !masterId) {
            return {
                statusCode: 400,
                message: "Missing type or refId",
                body: "Missing type or refId",
            };
        }

        let dbFeedbacks = await db
            .collection("feedback")
            .where("master_type", "==", masterType)
            .where("master_id", "in", masterId.split(","))
            .get();

        if (dbFeedbacks.empty) {
            return {
                statusCode: 200,
                message: "Successful!",
                body: JSON.stringify([]),
            };
        }

        let feedbacks = dbFeedbacks.docs.map((fb) => {
            return { id: fb.id, ...fb.data() };
        });

        let listOfUID = feedbacks.map((feedback: any) => feedback.created?.user_uid || null);

        let users = await db
            .collection("user")
            .where("uid", "in", [...new Set(listOfUID)])
            .get();
        users.docs.forEach((docUser) => {
            let usrName = docUser.data()?.name || "";
            feedbacks.forEach((feedback: any) => {
                if (feedback.created && feedback.created.user_uid == docUser.id) {
                    feedback.created.user_fullname = usrName;
                }
            });
        });

        return {
            statusCode: 200,
            message: "Successful!",
            body: JSON.stringify(feedbacks),
        };
    } catch (error) {
        return {
            statusCode: 400,
            message: error.toString(),
            body: error.toString(),
        };
    }
};
