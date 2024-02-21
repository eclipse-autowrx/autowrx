import axios from "axios";
import { Buffer } from "buffer";
import { Branch } from "../core/Model/VehicleInterface/Spec";

const getLoginCode = () => {
    return new Promise<string>((resolve, reject) => {
        const url = new URLSearchParams({
            client_id: import.meta.env.VITE_GITHUB_CLIENT_ID ?? "",
            scope: "user public_repo repo notifications gist read:org",
        });
        const newTab = window.open(`https://github.com/login/oauth/authorize?${url.toString()}`, "", "");
        const intervalId = setInterval(() => {
            try {
                const params = new URLSearchParams(newTab?.location.search ?? "");
                if (newTab?.window === null) {
                    clearInterval(intervalId);
                    const error = new Error(params.get("error") ?? "");
                    (error as any).error = params.get("error");
                    (error as any).error_description = params.get("error_description");
                    (error as any).error_uri = params.get("error_uri");
                    reject();
                } else if (params.get("code") !== null) {
                    clearInterval(intervalId);
                    resolve(params.get("code") ?? "");
                    newTab?.close();
                } else if (params.get("error") !== null) {
                    const error = new Error(params.get("error") ?? "");
                    (error as any).error = params.get("error");
                    (error as any).error_description = params.get("error_description");
                    (error as any).error_uri = params.get("error_uri");
                    clearInterval(intervalId);
                    reject(error);
                    newTab?.close();
                }
            } catch (error) {}
        }, 500);
    });
};

export const loginToGithub = async () => {
    const code = await getLoginCode();
    const response = await axios.get(`/.netlify/functions/getGithubAccessToken?code=${code}`);
    const accessToken = response.data.access_token;
    const user = (
        await axios.get(`https://api.github.com/user`, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${accessToken}`,
            },
        })
    ).data;

    user.orgs = [user.login];
    try {
        const orgs = (
            await axios.get(`https://api.github.com/user/orgs`, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${accessToken}`,
                },
            })
        ).data;
        if (orgs && Array.isArray(orgs)) {
            user.orgs = user.orgs.concat(orgs.map((org) => org.login));
            user.orgs = [...user.orgs];
        }
    } catch (err) {}

    return {
        user: user,
        accessToken: accessToken,
    };
};

const encodeToBase64 = (code: string) => {
    return Buffer.from(code).toString("base64");
};

const publishToGithub = async (params: {
    accessToken: string;
    user_login: string;
    code: string;
    repo: string;
    vss_payload: {
        [key: string]: Branch;
    };
}) => {
    const { ProjectGenerator } = await import("@eclipse-velocitas/velocitas-project-generator");
    const generator = new ProjectGenerator(params.user_login, params.repo, params.accessToken);

    const appName = params.repo.replace(/[^a-zA-Z0-9]/gi, "");

    const payload = encodeToBase64(JSON.stringify(params.vss_payload));

    await generator.runWithPayload(encodeToBase64(params.code), appName, payload);
};

export default publishToGithub;
