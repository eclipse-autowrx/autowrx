import axios from "axios";

export const sendEmail = async (to: any[], subject: string, htmlContent: string) => {
    if (!to || !subject || !htmlContent) throw "Missing to or subject or htmlContent";
    await axios.post(`/.netlify/functions/sendEmail`, {
        to: to,
        subject: subject,
        htmlContent: htmlContent,
    });
};
