import axios from "axios";

export async function deployToEPAM (prototype_id: string, code: string) {
    try {
        const response = await axios.post(
            `https://rztjtrois0.execute-api.eu-central-1.amazonaws.com/Prod/project/${prototype_id}/single_file_source`,
            code,
            {
                headers: {
                    "X-ApiKey": "$EPAM_API-KEY",
                },
            }
        );
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (err: any) {
        return {
            statusCode: 400,
            body: err.toString(),
        };
    }
};
