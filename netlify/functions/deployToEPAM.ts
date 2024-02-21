import axios from "axios";
import { Handler } from "@netlify/functions";
import { db } from "../firebase";
import { Prototype } from "../../src/apis/models/index";
import indentString from "indent-string";
import dedent from "dedent";

const transformCodeForEPAM = (code: string) => {
    const indentedCode = indentString(code, 2, {
        indent: "    ",
    });

    const wrappedCode = dedent(`
    import asyncio
    
    async def main():
${indentedCode}
    
    asyncio.get_event_loop().run_until_complete(main())
    `);

    return wrappedCode;
};

export const handler: Handler = async function (event, context) {
    try {
        const { prototype_id } = event.queryStringParameters as any;
        const prototype = (await db.collection("project").doc(prototype_id).get()).data() as Prototype;

        if (typeof prototype === "undefined") {
            throw new Error(`Prototype Id ${prototype_id} doesn't exist.`);
        }

        const response = await axios.post(
            `https://rztjtrois0.execute-api.eu-central-1.amazonaws.com/Prod/project/${prototype_id}/single_file_source`,
            prototype.code,
            {
                headers: {
                    "X-ApiKey": "ZVdcg4AOwy84KDIZhY0EV2b646ataHOV4aZJYeUA",
                },
            }
        );
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (err) {
        return {
            statusCode: 400,
            body: err.toString(),
        };
    }
};
