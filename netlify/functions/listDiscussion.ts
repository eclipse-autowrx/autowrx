import { Handler } from "@netlify/functions";
import { db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";

export const handler: Handler = async function (event, context) {
    try {
        const { masterIds } = event.queryStringParameters as {
            masterIds: string;
        };

        if (!masterIds) {
            return {
                statusCode: 400,
                message: "Missing masterIds",
                body: "Missing masterIds",
            };
        }

        let dbDiscussions = await db.collection("discussion").where("master_id", "in", masterIds.split(",")).get();

        if (dbDiscussions.empty) {
            return {
                statusCode: 200,
                message: "Successful!",
                body: JSON.stringify([]),
            };
        }

        let discussions = dbDiscussions.docs.map((fb) => {
            return { id: fb.id, ...fb.data() };
        });

        // console.log('discussions', discussions)

        let listOfUID = discussions.map((discussion: any) => discussion.created?.user_uid || null);

        let users = await db
            .collection("user")
            .where("uid", "in", [...new Set(listOfUID)])
            .get();
        users.docs.forEach((docUser) => {
            discussions.forEach((discussion: any) => {
                if (discussion.created && discussion.created.user_uid == docUser.id) {
                    discussion.created.user_fullname = docUser.data()?.name || "";
                    discussion.created.user_avatar = docUser.data()?.image_file || "";
                }
            });
        });

        return {
            statusCode: 200,
            message: "Successful!",
            body: JSON.stringify(discussions),
        };
    } catch (error) {
        console.log("BE: error on list discussion", error);
        return {
            statusCode: 400,
            message: error.toString(),
            body: error.toString(),
        };
    }
};
