import { Handler } from "@netlify/functions";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import { sendEmailByBrevo } from "../brevo";

export const handler: Handler = async function (event, context) {
    try {
        if (event.httpMethod != "POST" || !event.body) {
            throw "Invalid request!";
        }
        let req = JSON.parse(event.body || "{}");

        if (!req.subject || !req.htmlContent || !req.to || !Array.isArray(req.to)) {
            throw "Invalid request!";
        }

        let data = await sendEmailByBrevo(req.to, req.subject, req.htmlContent);
        // console.log("brevo return data", data)

        return {
            statusCode: 200,
            body: "Send email done!",
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
