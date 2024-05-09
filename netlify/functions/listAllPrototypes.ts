import { Handler } from "@netlify/functions";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";

export const handler: Handler = async function (event, context) {
    try {
        let retPrototypes = [] as any[];

        let prototypes = await db
            .collection("project")
            .select("description", "name", "model_id", "image_file", "tags", "apis", "rated_by")
            .get();

        if (!prototypes.empty) {
            prototypes.forEach((prototype) => {
                retPrototypes.push({
                    id: prototype.id,
                    description: prototype.data().description,
                    name: prototype.data().name,
                    model_id: prototype.data().model_id,
                    image_file: prototype.data().image_file,
                    tags: prototype.data().tags,
                    apis: prototype.data().apis,
                    rated_by: prototype.data().rated_by,
                });
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify(retPrototypes),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
