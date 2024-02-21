import { Handler } from "@netlify/functions";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";

export const handler: Handler = async function (event, context) {
    try {
        let retModels = [] as any[];

        let models = await db
            .collection("model")
            .where("tenant_id", "==", TENANT_ID)
            .select("name", "visibility", "model_home_image_file", "created")
            .get();

        if (!models.empty) {
            models.forEach((model) => {
                retModels.push({
                    id: model.id,
                    visibility: model.data().visibility,
                    name: model.data().name,
                    created: model.data().created,
                    model_home_image_file: model.data().model_home_image_file,
                });
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify(retModels),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
