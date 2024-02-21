import axios from "axios";

const BREVO_API_KEY = "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";
const BREVO_API_HOST = "https://api.brevo.com/v3/smtp/email";

export const sendEmailByBrevo = async (to: any[], subject: string, htmlContent: string) => {
    let { data } = await axios.post(
        BREVO_API_HOST,
        {
            sender: {
                name: "digital.auto",
                email: "playground@digital.auto",
            },
            to: to,
            subject: subject,
            htmlContent: htmlContent,
        },
        {
            headers: {
                "api-key": BREVO_API_KEY,
            },
        }
    );

    return data;
};
