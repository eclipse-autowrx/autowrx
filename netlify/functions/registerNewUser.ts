import { Handler } from "@netlify/functions";
import { Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../firebase";
import { TENANT_ID } from "../../src/constants/index";
import { Buffer } from "buffer";
import axios from "axios";
import { sendEmailVerification, createUserWithEmailAndPassword } from "firebase/auth";

export const handler: Handler = async function (event, context) {
    // console.log(event.httpMethod)

    try {
        if (event.httpMethod != "POST" || !event.body) {
            throw "Invalid request!";
        }
        let req = JSON.parse(event.body || "{}");

        if (!req.email || !req.pwd || !req.name || !req.captcha) {
            throw "Invalid request!";
        }

        // const { email, pwd, name, captcha } = event.queryStringParameters as {
        //     email: string
        //     pwd: string
        //     name: string
        //     captcha: string
        // };

        // if(!req.captcha) {
        //     throw "Missing captcha"
        // }

        let { data } = await axios(
            `https://google.com/recaptcha/api/siteverify?secret=${process.env["RECAPTCHA_SECRET_KEY"]}&response=${req.captcha}`
        );
        if (!data || !data.success) {
            throw "Captcha invalid!";
        }

        let dbUsers = await db
            .collection("user")
            .where("tenant_id", "==", TENANT_ID)
            .where("email", "==", req.email)
            .where("provider", "==", "Email")
            .get();

        if (!dbUsers.empty) {
            console.log("here");
            throw "User is existed! PLease login!";
        }

        const userRecord = await auth.createUser({
            email: req.email,
            emailVerified: false,
            password: req.pwd,
        });

        // console.log("ok");

        await db
            .collection("user")
            .doc(userRecord.uid)
            .set({
                tenant_id: TENANT_ID,
                uid: userRecord.uid,
                roles: {},
                name: req.name ?? "",
                email: req.email,
                provider: "Email",
                image_file: "/imgs/profile.png",
                created_time: Timestamp.now(),
            });

        // sendEmailVerification(res.user, {
        //     url: `${callFrom}/account-verification-success?email=${email}`,
        // })

        return {
            statusCode: 200,
            body: JSON.stringify({
                uid: userRecord.uid,
                email: req.email,
                name: req.name,
            }),
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 400,
            body: error.toString(),
        };
    }
};
