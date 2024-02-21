import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import permissions from "../../src/permissions";
import dayjs from "dayjs";

export const handler: Handler = async function (event, context) {
    try {
        const { fromDate, toDate } = event.queryStringParameters as {
            fromDate?: string;
            toDate?: string;
        };

        let from = Timestamp.fromDate(dayjs().startOf("month").toDate());
        let to = Timestamp.fromDate(dayjs().endOf("month").toDate());

        if (fromDate) from = Timestamp.fromDate(dayjs(fromDate).toDate());
        if (toDate) to = Timestamp.fromDate(dayjs(toDate).toDate());

        let retData = {
            users: [] as any[],
            models: [] as any[],
            prototypes: [] as any[],
        };

        // query users created this month
        let users = await db
            .collection("user")
            .where("tenant_id", "==", TENANT_ID)
            .where("created_time", ">=", from)
            .where("created_time", "<=", to)
            .select("uid", "email", "name", "provider", "image_file", "created_time")
            .get();
        if (!users.empty) {
            users.forEach((user) => {
                retData.users.push({
                    id: user.id,
                    uid: user.data().uid,
                    email: user.data().email,
                    name: user.data().name,
                    provider: user.data().provider,
                    image_file: user.data().image_file,
                    created_time: user.data().created_time.toDate(),
                });
            });
        }

        let models = await db
            .collection("model")
            .where("tenant_id", "==", TENANT_ID)
            .where("created.created_time", ">=", from)
            .where("created.created_time", "<=", to)
            .select("name", "model_home_image_file", "created")
            .get();
        if (!models.empty) {
            models.forEach((model) => {
                retData.models.push({
                    id: model.id,
                    name: model.data().name,
                    tenant_id: model.data().tenant_id,
                    image_file: model.data().model_home_image_file,
                    created_time: model.data().created.created_time.toDate(),
                    created_by: model.data().created.user_uid,
                });
            });
        }

        let prototypes = await db
            .collection("project")
            .where("created.created_time", ">=", from)
            .where("created.created_time", "<=", to)
            .select("name", "model_home_image_file", "created")
            .get();
        if (!prototypes.empty) {
            prototypes.forEach((prototype) => {
                retData.prototypes.push({
                    id: prototype.id,
                    name: prototype.data().name,
                    image_file: prototype.data().model_home_image_file,
                    created_time: prototype.data().created.created_time.toDate(),
                    created_by: prototype.data().created.user_uid,
                });
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify(retData),
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
