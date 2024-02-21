import { Handler } from "@netlify/functions";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import { sendPasswordResetEmail } from "firebase/auth";
import axios from "axios";
import { sendEmailByBrevo } from "../brevo";

export const handler: Handler = async function (event, context) {
    try {
        if (event.httpMethod != "POST" || !event.body) {
            throw "Invalid request!";
        }
        let req = JSON.parse(event.body || "{}");
        if (!req.email || !req.captchaValue) {
            throw "Invalid request!";
        }
        let { data } = await axios(
            `https://google.com/recaptcha/api/siteverify?secret=${process.env["RECAPTCHA_SECRET_KEY"]}&response=${req.captchaValue}`
        );
        if (!data || !data.success) {
            throw "Invalid captcha";
        }
        let userQuery = await db
            .collection("user")
            .where("tenant_id", "==", TENANT_ID)
            .where("email", "==", req.email)
            // .where("provider", "==", "Email")
            .get();
        if (!userQuery || userQuery.empty) {
            throw "No user with provided email";
        }
        let user = userQuery.docs[0].data();
        if (user.provider && user.provider != "Email") {
            throw `This email is registered with ${user.provider} account, please login by ${user.provider}!`;
        }
        //await auth.sendPass
        let resetLink = await auth.generatePasswordResetLink(req.email, {
            url: req.returnURL || null,
        });
        console.log(`resetLink`, resetLink);
        let brevoReturn = await sendEmailByBrevo(
            [
                {
                    name: user.name || "user",
                    email: user.email,
                },
            ],
            `[digital.auto] Reset your password`,
            `
            <p>Hello ${user.name || "user"}},</p>

            <p>Follow this link to reset your <b>digital.auto</b> password for ${user.email} account.</p>

            <p><a href="${resetLink}">${resetLink}</a></p>
            
            <p>If you didn’t ask to reset your password, you can ignore this email.</p>

            <p>Thanks,</p>
            <p><b>digital.auto team</b></p>
        `
        );
        // console.log("brevo return data", data)
        return {
            statusCode: 200,
            body: JSON.stringify({
                email: req.email,
            }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
