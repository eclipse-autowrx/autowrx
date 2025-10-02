import axios from 'axios';

/**
 * Configuration for the frontend API calls.
 * In a real React app, you might get this from environment variables.
 */
export const config = {
    serverUrl: "https://bos.app.semantha.cloud",
    tokenUrl: "https://bos.app.semantha.cloud/tt-idp/realms/semantha/protocol/openid-connect/token",
    clientId: import.meta.env.VITE_AA_CLIENT_ID, // use env.AA_CLIENT_ID
    clientSecret: import.meta.env.VITE_AA_CLIENT_SECRET, // use env.AA_CLIENT_SECRET
    domainName: import.meta.env.VITE_AA_DOMAIN_NAME // use env.AA_DOMAIN_NAME
};

/**
 * Handles authentication for the Semantha API on the frontend.
 * Stores the access token in localStorage.
 */
export class SemanthaFrontendAuth {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    tokenCacheKey: string;

    constructor(tokenUrl: string, clientId: string, clientSecret: string) {
        this.tokenUrl = tokenUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenCacheKey = 'req_token_cache';
    }

    /**
     * Loads the cached token from localStorage.
     * @returns {object|null} The cached token object or null if not found/expired.
     */
    loadCachedToken(): string | null {
        try {
            const cached = localStorage.getItem(this.tokenCacheKey);
            if (cached) {
                const cache = JSON.parse(cached);
                // Check if token is still valid (with 1 minute buffer)
                if (cache.expiry && new Date(cache.expiry) > new Date(Date.now() + 60 * 1000)) {
                    console.log('Using cached token.');
                    return cache.token;
                }
            }
        } catch (error: any) {
            console.error('Could not load cached token:', error.message);
        }
        return null;
    }

    /**
     * Saves the token to localStorage.
     * @param {string} token - The access token.
     * @param {number} expiresIn - The token's lifetime in seconds.
     */
    saveCachedToken(token: string, expiresIn: number) {
        try {
            const expiry = new Date(Date.now() + expiresIn * 1000);
            const cache = {
                token: token,
                expiry: expiry.toISOString()
            };
            localStorage.setItem(this.tokenCacheKey, JSON.stringify(cache));
            console.log('Token saved to localStorage.');
        } catch (error: any) {
            console.error('Could not save cached token:', error.message);
        }
    }

    /**
     * Requests a new access token from the authentication server.
     * @returns {Promise<string>} The new access token.
     */
    async getNewToken(): Promise<string> {
        console.log('Requesting new access token...');
        try {
            const params = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                scope: 'openid'
            });

            const response = await axios.post(this.tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && response.data.id_token) {
                const token = response.data.id_token;
                this.saveCachedToken(token, response.data.expires_in || 3600);
                console.log('New token obtained successfully.');
                return token;
            } else {
                throw new Error('Invalid token response format');
            }
        } catch (error: any) {
            console.error('Error getting new token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Ensures a valid token is available, fetching a new one if necessary.
     * @returns {Promise<string>} A valid access token.
     */
    async ensureAuthenticated(): Promise<string> {
        const cachedToken = this.loadCachedToken();
        if (cachedToken) {
            return cachedToken;
        }
        const newToken = await this.getNewToken();
        if (newToken) {
            return newToken;
        }
        throw new Error('Authentication failed');
    }
}

/**
 * Sends a text to a specified GenAI Prompt.
 * @param {SemanthaFrontendAuth} auth - An instance of SemanthaFrontendAuth.
 * @param {string} promptId - The ID of the prompt.
 * @param {string} inputText - The input text for the prompt.
 * @param {string} referenceText - The reference text for the prompt.
 */
export async function testPrompt(auth: SemanthaFrontendAuth, promptId: string, inputText: string, referenceText: string): Promise<any> {
    try {
        const token = await auth.ensureAuthenticated();

        console.log(`\n--- Starting GenAI Prompt Test (Frontend) ---`);
        console.log(`Sending text to Prompt ID: '${promptId}'`);
        console.log('---------------------------------------');
        console.log(`Input Text: ${inputText}`);
        console.log('---------------------------------------');

        const promptUrl = `${config.serverUrl}/tt-platform-server/api/domains/${config.domainName}/prompts/${promptId}`;
        const jsonPayload = {
            arguments: [inputText, referenceText]
        };

        const response = await axios.post(promptUrl, jsonPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n--- GenAI Analysis Result ---');
        const output = response.data?.response;

        if (!output || output === "null") {
            console.log('Received a response, but it did not contain a valid "response" key.');
            console.log('Full response:', JSON.stringify(response.data, null, 2));
        } else {
            console.log(output);
        }
        console.log('--- GenAI Prompt Test Finished ---');
        return response.data;

    } catch (error: any) {
        console.error('Error during prompt test:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Finds requirements similar to the provided text.
 * @param {SemanthaFrontendAuth} auth - An instance of SemanthaFrontendAuth.
 * @param {string} requirementText - The text to analyze for similarity.
 * @param {number} topN - The maximum number of similar matches to return.
 * @returns {Promise<object[]>} A list of match details.
 */
export async function testSimilarity(auth: SemanthaFrontendAuth, requirementText: string, topN: number = 10): Promise<any[]> {
    try {
        const token = await auth.ensureAuthenticated();
        console.log('\n--- Starting Similarity Test (Frontend) ---');
        console.log(`Analyzing new requirement for similarity...`);

        const similarityUrl = `${config.serverUrl}/tt-platform-server/api/domains/${config.domainName}/references?maxreferences=${topN}`;
        
        const form = new FormData();
        form.append('similaritythreshold', '0.5');
        form.append('text', requirementText);

        const similarityResponse = await axios.post(similarityUrl, form, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        const references = similarityResponse.data?.references;
        if (!references || references.length === 0) {
            console.log('No similar requirements were found.');
            return [];
        }

        console.log(`Found matches. Retrieving top ${Math.min(topN, references.length)} details...`);

        const topMatches = references.slice(0, topN);
        const matchDetails: any[] = [];
        
        for (let i = 0; i < topMatches.length; i++) {
            const docId = topMatches[i].documentId;
            const docUrl = `${config.serverUrl}/tt-platform-server/api/domains/${config.domainName}/referencedocuments/${docId}`;
            try {
                const docDetails = await axios.get(docUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`--- Match ${i + 1} ---`, docDetails.data);
                matchDetails.push(docDetails.data);
            } catch (error: any) {
                console.error(`Failed to get details for document ${docId}:`, error.response?.data || error.message);
            }
        }
        return matchDetails;

    } catch (error: any) {
        console.error('Error during similarity test:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Uploads a requirement file.
 * @param {SemanthaFrontendAuth} auth - An instance of SemanthaFrontendAuth.
 * @param {File} file - The file to upload (from an <input type="file">).
 * @returns {Promise<object>} The response data from the server.
 */
export async function uploadRequirement(auth: SemanthaFrontendAuth, file: File): Promise<any> {
    try {
        const token = await auth.ensureAuthenticated();
        console.log(`\n--- Starting Requirement Upload (Frontend) ---`);
        console.log(`Uploading '${file.name}'...`);

        const uploadUrl = `${config.serverUrl}/tt-platform-server/api/domains/${config.domainName}/referencedocuments`;
        
        const form = new FormData();
        form.append('file', file);
        form.append('name', file.name);
        form.append('tags', "automotive,safety,frontend-react");
        form.append('metadata', JSON.stringify({
            project: "Automotive-Safety-Demo-React",
            type: "safety-requirement",
            file: file.name
        }));
        form.append('comment', `Uploaded from React app on ${new Date().toISOString()}`);
        form.append('color', "AQUA");
        form.append('addparagraphsasdocuments', 'false');

        const response = await axios.post(uploadUrl, form, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        console.log('Upload successful:', response.data);
        return response.data;

    } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error.response?.data || error.message);
        throw error;
    }
}


/**
 * Example of how to use these functions in a frontend component.
 */
async function exampleUsage() {
    // In your React component, you would initialize auth once.
    const auth = new SemanthaFrontendAuth(config.tokenUrl, config.clientId, config.clientSecret);

    // Example for testPrompt
    const PROMPT_ID = "ca4d0f29-aceb-4d0c-93a6-33fae49b5731";
    const PROMPT_INPUT_TEXT = `Requirement: The vehicle's airbag control unit (ACU) must meet ASIL-D.`;
    const PROMPT_REFERENCE_TEXT = `Requirement: The vehicle's airbag control unit (ACU) must meet ASIL-D and be awesome.`;

    try {
        const promptResult = await testPrompt(auth, PROMPT_ID, PROMPT_INPUT_TEXT, PROMPT_REFERENCE_TEXT);
        // You can then use the result to update your React component's state.
        // e.g., setPromptResult(promptResult);
    } catch (error: any) {
        // Handle errors, maybe show a notification to the user.
        // e.g., setErrorState(error.message);
    }

    // Example for testSimilarity
    const SIMILARITY_TEXT = `The vehicle's safety system must include a mechanism for autonomous braking.`;
    try {
        const similarityResults = await testSimilarity(auth, SIMILARITY_TEXT);
        // e.g., setSimilarityResults(similarityResults);
    } catch (error: any) {
        // e.g., setErrorState(error.message);
    }

    // Example for uploadRequirement (assuming you have a file from an input element)
    // const fileInput = document.querySelector('input[type="file"]');
    // if (fileInput.files.length > 0) {
    //     try {
    //         const uploadResult = await uploadRequirement(auth, fileInput.files[0]);
    //         // e.g., setUploadResult(uploadResult);
    //     } catch (error: any) {
    //         // e.g., setErrorState(error.message);
    //     }
    // }
}

// To use this in your React app:
// 1. Make sure you have axios installed (`npm install axios`);
