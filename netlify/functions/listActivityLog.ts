import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import permissions from "../../src/permissions";
import dayjs from "dayjs";

export const handler: Handler = async function (event, context) {
    try {
        const { fromDate, toDate, logType, create_by } = event.queryStringParameters as {
            fromDate?: string;
            toDate?: string;
            logType?: string;
            create_by?: string;
        };

        let from = Timestamp.fromDate(dayjs().startOf("month").toDate());
        let to = Timestamp.fromDate(dayjs().endOf("month").toDate());

        if (fromDate) from = Timestamp.fromDate(dayjs(fromDate).toDate());
        if (toDate) to = Timestamp.fromDate(dayjs(toDate).toDate());

        let retData = [] as any[];

        let visits: any = null;

        if (!logType) {
            if (create_by) {
                visits = await db
                    .collection("activity_log")
                    .where("create_by", "==", create_by)
                    .where("created_time", ">=", from)
                    .where("created_time", "<=", to)
                    .get();
            } else {
                visits = await db
                    .collection("activity_log")
                    .where("created_time", ">=", from)
                    .where("created_time", "<=", to)
                    .get();
            }
        } else {
            visits = await db
                .collection("activity_log")
                .where("created_time", ">=", from)
                .where("created_time", "<=", to)
                .where("type", "==", logType)
                .get();
        }

        if (visits && !visits.empty) {
            visits.forEach((visit) => {
                let v = <any>{
                    id: visit.id,
                    ...visit.data(),
                };
                v.created_time = v.created_time.toDate();
                retData.push(v);
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
