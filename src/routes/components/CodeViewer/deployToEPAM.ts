import axios from "axios";

const deployToEPAM = async (prototype_id: string, code: string) => {
    const response = await axios.get(`/.netlify/functions/deployToEPAM?prototype_id=${prototype_id}`);
    return response.data;
};

export default deployToEPAM;
