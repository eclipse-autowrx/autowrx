import axios from "axios";
import config from "../config";

export const certivityAxios = axios.create({
    baseURL: config.certivityBaseUrl,
    headers: {
        token: config.certivityToken,
    },
});
