import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import { Feature, User } from "../../src/apis/models/index";
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
            throw new Error("You must be a tenant admin to do this action.");
        }

        if (event.httpMethod != "POST" || !event.body) {
            throw "Invalid request!";
        }
        let req = JSON.parse(event.body || "{}");

        if (!req.features || !Array.isArray(req.features) || req.features.length == 0) {
            throw "Invalid request!";
        }

        let dbFeatures: any[] = [];
        let exist_features_obj: any = await db.collection("feature").where("tenant_id", "==", TENANT_ID).get();
        if (exist_features_obj && !exist_features_obj.empty) {
            exist_features_obj.forEach((feature) => {
                let f = <any>{
                    id: feature.id,
                    ...feature.data(),
                };
                dbFeatures.push(f);
            });
        }
        req.features.forEach(async (newFeature) => {
            let exist_feature = dbFeatures.find((f) => f.name == newFeature.name);
            if (!exist_feature) {
                await db.collection("feature").add({
                    ...newFeature,
                    tenant_id: TENANT_ID,
                    created_time: Timestamp.now(),
                });
            }
        });

        return {
            statusCode: 200,
            body: "Successful!",
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
