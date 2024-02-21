import axios from "axios";
import { Handler } from "@netlify/functions";

export const handler: Handler = async function (event, context) {
    try {
        const { code } = event.queryStringParameters as any;
        // console.log('------------------------------')
        // console.log(process.env.VITE_GITHUB_CLIENT_ID )
        // console.log(process.env.GITHUB_CLIENT_SECRET)
        // console.log(code)
        // console.log('-------------------------------')
        const response = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.VITE_GITHUB_CLIENT_ID ?? "",
                client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
                code,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/vnd.github+json",
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
