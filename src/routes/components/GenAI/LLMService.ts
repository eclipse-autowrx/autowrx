import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

type AnthropicConfig = {
    anthropic_version: string;
    max_tokens: number;
    system: string;
    messages: {
        role: string;
        content: (
            | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
            | { type: "text"; text: string }
        )[];
    }[];
    temperature: number;
    top_p: number;
    top_k: number;
    stop_sequences: string[];
};

type AmazonConfig = {
    inputText: string;
    textGenerationConfig: {
        temperature: number;
        topP: number;
        maxTokenCount: number;
        stopSequences: string[];
    };
};

type MetaLLamaConfig = {
    prompt: string;
    temperature: number;
    top_p: number;
    max_gen_len: number;
};

type MistralConfig = {
    prompt: string;
    max_tokens: number;
    stop: string[];
    temperature: number;
    top_p: number;
    top_k: number;
};

type AI21Config = {
    prompt: string;
    temperature: number;
    topP: number;
    maxTokens: number;
    stopSequences: string[];
    countPenalty: {
        scale: number;
    };
    presencePenalty: {
        scale: number;
    };
    frequencyPenalty: {
        scale: number;
    };
};

type CohereConfig = {
    prompt: string;
    temperature: number;
    p: number;
    k: number;
    max_tokens: number;
    stop_sequences: string[];
    return_likelihoods: "GENERATION" | "ALL" | "NONE";
    stream: boolean;
    num_generations: number;
    logit_bias?: { [token_id: number]: number };
    truncate: "NONE" | "START" | "END";
};

type Model = {
    modelType: string;
    modelName: string;
    modelId: string;
    requestConfig?: AnthropicConfig | AmazonConfig | MetaLLamaConfig | MistralConfig | AI21Config | CohereConfig; // Add other config types as needed
};

type LLM = {
    modelProviderName: string;
    modelProviderLogo: string;
    modelFamilyName?: string;
    models: Model[];
};

class LLMServices {
    static LLMs: LLM[] = [
        {
            modelProviderName: "Amazon",
            modelFamilyName: "Titan",
            modelProviderLogo:
                "https://a.b.cdn.console.awsstatic.com/a/v1/BMLOGG3AOGAQIUZ3RD5WZZTJIKYCCGYGZDO23OZ6JRIOPUWNEDJA/images/amazon_52x52.svg",
            models: [
                { modelType: "text", modelName: "Titan G1 - Express", modelId: "amazon.titan-text-express-v1" },
                { modelType: "text", modelName: "Titan G1 - Lite", modelId: "amazon.titan-text-lite-v1" },
            ],
        },
        {
            modelProviderName: "Anthropic",
            modelFamilyName: "Claude",
            modelProviderLogo:
                "https://a.b.cdn.console.awsstatic.com/a/v1/BMLOGG3AOGAQIUZ3RD5WZZTJIKYCCGYGZDO23OZ6JRIOPUWNEDJA/images/anthropic_52x52.svg",
            models: [
                { modelType: "text", modelName: "Claude 2", modelId: "anthropic.claude-v2" },
                { modelType: "text", modelName: "Claude 2.1", modelId: "anthropic.claude-v2:1" },
                { modelType: "text", modelName: "Claude 3 Sonnet", modelId: "anthropic.claude-3-sonnet-20240229-v1:0" },
                { modelType: "text", modelName: "Claude 3 Haiku", modelId: "anthropic.claude-3-haiku-20240307-v1:0" },
                { modelType: "text", modelName: "Claude Instant", modelId: "anthropic.claude-instant-v1" },
                { modelType: "text", modelName: "Claude 3 Opus", modelId: "anthropic.claude-3-opus-20240229-v1:0" },
            ],
        },
        {
            modelProviderName: "AI21",
            modelFamilyName: "Jurassic-2",
            modelProviderLogo:
                "https://a.b.cdn.console.awsstatic.com/a/v1/BMLOGG3AOGAQIUZ3RD5WZZTJIKYCCGYGZDO23OZ6JRIOPUWNEDJA/images/ai21_52x52.svg",
            models: [
                { modelType: "text", modelName: "Jurassic-2 Mid", modelId: "ai21.j2-mid-v1" },
                { modelType: "text", modelName: "Jurassic-2 Ultra", modelId: "ai21.j2-ultra-v1" },
            ],
        },
        {
            modelProviderName: "Cohere",
            modelFamilyName: "Command",
            modelProviderLogo:
                "https://a.b.cdn.console.awsstatic.com/a/v1/BMLOGG3AOGAQIUZ3RD5WZZTJIKYCCGYGZDO23OZ6JRIOPUWNEDJA/images/cohere_52x52.svg",
            models: [
                { modelType: "text", modelName: "Command", modelId: "cohere.command-text-v14" },
                { modelType: "text", modelName: "Command Light", modelId: "cohere.command-light-text-v14" },
            ],
        },
        {
            modelProviderName: "Meta",
            modelFamilyName: "LLama 2",
            modelProviderLogo:
                "https://a.b.cdn.console.awsstatic.com/a/v1/BMLOGG3AOGAQIUZ3RD5WZZTJIKYCCGYGZDO23OZ6JRIOPUWNEDJA/images/meta_52x52.svg",
            models: [
                { modelType: "text", modelName: "Llama 2 Chat 13B", modelId: "meta.llama2-13b-chat-v1" },
                { modelType: "text", modelName: "Llama 2 Chat 70B", modelId: "meta.llama2-70b-chat-v1" },
            ],
        },
        {
            modelProviderName: "Mistral",
            modelFamilyName: "Mistral",
            modelProviderLogo:
                "https://a.b.cdn.console.awsstatic.com/a/v1/BMLOGG3AOGAQIUZ3RD5WZZTJIKYCCGYGZDO23OZ6JRIOPUWNEDJA/images/mistral_52x52.svg",
            models: [
                { modelType: "text", modelName: "Mistral 7B", modelId: "mistral.mistral-7b-instruct-v0:2" },
                {
                    modelType: "text",
                    modelName: "Mixtral 8X7B",
                    modelId: "mistral.mixtral-8x7b-instruct-v0:1",
                },
            ],
        },
    ];

    // Mapping of model prefixes to payload generation functions
    static payloadMap: { [key: string]: (modelId: string, inputPrompt: string, systemPrompt?: string) => any } = {
        amazon: LLMServices.generatePayloadForAmazon.bind(LLMServices),
        anthropic: LLMServices.generatePayloadForAnthropic.bind(LLMServices),
        meta: LLMServices.generatePayloadForMetaLLama.bind(LLMServices),
        mistral: LLMServices.generatePayloadForMistral.bind(LLMServices),
        ai21: LLMServices.generatePayloadForAI21.bind(LLMServices),
        cohere: LLMServices.generatePayloadForCohere.bind(LLMServices),
    };

    // Generate payload for the given model ID
    static generatePayload(modelId: string, inputPrompt: string, systemPrompt: string = ""): any {
        const modelPrefix = modelId.split(".")[0]; // Extract the prefix from the modelId
        // Get the payload generation function for the given model prefix
        const generateFunction = LLMServices.payloadMap[modelPrefix];

        if (!generateFunction) {
            throw new Error(`Unsupported model ID: ${modelId}`);
        }

        return generateFunction(modelId, inputPrompt, systemPrompt);
    }

    // Function to find a model by its ID across all LLMs
    static findModelByModelId(modelId: string): Model | undefined {
        for (let LLM of this.LLMs) {
            let foundModel = LLM.models.find((model) => model.modelId === modelId);
            if (foundModel) return foundModel;
        }
        return undefined; // Return undefined if no model is found
    }

    // Function to find a model ID by its name across all LLMs
    static findModelIdByModelName(modelName: string) {
        for (let LLM of this.LLMs) {
            let foundModel = LLM.models.find((model) => model.modelName === modelName);
            if (foundModel) return foundModel.modelId;
        }
    }

    // Function to find a LLM by model ID
    static findLLMByModelId(modelId: string): LLM | undefined {
        return this.LLMs.find((LLM) => LLM.models.some((model) => model.modelId === modelId));
    }

    static extractRegion = (url: string): string | null => {
        const regionPattern = /bedrock-runtime\.([a-z0-9-]+)\.amazonaws\.com/;
        const match = url.match(regionPattern);
        return match ? match[1] : null;
    };

    static extractModelId(url: string): string | null {
        const modelIdPattern = /model\/(.*?)(\/|$)/;
        const match = url.match(modelIdPattern);
        return match ? match[1] : null;
    }

    static async BedrockGenCode({
        endpointURL,
        publicKey,
        secretKey,
        inputPrompt,
        systemMessage,
        setGenCode,
        setLoading,
        setIsFinished,
        onFinish,
    }: {
        endpointURL: string;
        publicKey: string;
        secretKey: string;
        inputPrompt: string;
        systemMessage: string;
        setGenCode: (code: string) => void;
        setLoading: (loading: boolean) => void;
        setIsFinished: (isFinished: boolean) => void;
        onFinish?: () => void;
    }) {
        try {
            setGenCode("");
            setIsFinished(false);
            setLoading(true);

            let region = LLMServices.extractRegion(endpointURL) || "us-east-1";
            let modelId = LLMServices.extractModelId(endpointURL) || "";

            const awsConfig = {
                credentials: {
                    accessKeyId: publicKey,
                    secretAccessKey: secretKey,
                },
                region: region,
            };

            const bedrock = new BedrockRuntimeClient(awsConfig);
            const payload = this.generatePayload(modelId, inputPrompt, systemMessage);

            const input = {
                accept: "application/json",
                contentType: "application/json",
                modelId: modelId,
                body: JSON.stringify(payload),
            };

            // console.log("Request format: ", input);
            let generation = "";

            try {
                const bedrockResponse = await bedrock.send(new InvokeModelWithResponseStreamCommand(input));

                if (!bedrockResponse.body) {
                    throw new Error("Failed to get readable stream from response");
                }

                for await (const item of bedrockResponse.body) {
                    const chunk = JSON.parse(new TextDecoder().decode(item.chunk?.bytes));
                    const modelPrefix = modelId.split(".")[0];

                    switch (modelPrefix) {
                        case "amazon":
                            generation += chunk.outputText;
                            break;
                        case "anthropic":
                            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                                generation += chunk.delta.text;
                            }
                            break;
                        case "meta":
                            generation += chunk.generation;
                            break;
                        case "mistral":
                            generation += chunk.outputs[0].text;
                            break;
                        case "cohere":
                            generation += chunk.text;
                            break;
                        case "ai21":
                            generation += chunk.completions[0].data.text;
                            break;
                        // Add more cases as needed
                        default:
                            console.warn(`Unhandled model prefix: ${modelPrefix}`);
                    }
                    setGenCode(generation); // Update the generation code outside the switch
                }
            } catch (error) {
                try {
                    const bedrockResponse = await bedrock.send(new InvokeModelCommand(input));
                    // Decode and parse the response body
                    const response = JSON.parse(new TextDecoder().decode(bedrockResponse.body));

                    // Handle the response of AI21 models that dont support streaming
                    if (modelId.startsWith("ai21")) {
                        generation = response.completions[0].data.text;
                        setGenCode(generation);
                    }
                } catch (err) {
                    console.error(error);
                    setGenCode(`Error: ${error}`);
                    throw new Error(
                        "Failed to generate response from Bedrock, please check your endpoint URL, region, keys"
                    );
                }
            }
            onFinish && onFinish();
            setLoading(false);
            setIsFinished(true);
        } catch (error) {
            console.error("Failed to fetch from server:", error);
            setGenCode(`Error: ${error}`);
            setLoading(false);
            setIsFinished(true);
        }
    }

    static async OpenAIGenCode({
        inputPrompt,
        systemMessage,
        apiKey,
        endpointUrl,
        setGenCode,
        setLoading,
        setIsFinished,
        onFinish,
    }: {
        inputPrompt: string;
        systemMessage: string;
        endpointUrl: string;
        apiKey: string;
        setGenCode: (code: string) => void;
        setLoading: (loading: boolean) => void;
        setIsFinished: (isFinished: boolean) => void;
        onFinish?: () => void;
    }) {
        try {
            setGenCode("");
            setIsFinished(false);
            setLoading(true);
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            let counter = 0;

            let payload = {
                model: "gpt-4-realtime",
                messages: [
                    {
                        role: "system",
                        content: systemMessage,
                    },
                    {
                        role: "user",
                        content: inputPrompt,
                    },
                ],
                max_tokens: 4096,
                stream: true,
            };
            // console.log("Payload: ", payload);
            const res = await fetch(endpointUrl, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey ? apiKey : ""}`,
                    "api-key": apiKey ? apiKey : "",
                },
                method: "POST",
                body: JSON.stringify(payload),
            });
            // console.log("Response: ", res);

            if (!res.body) {
                throw new Error("Failed to get readable stream from response");
            }

            let generation = "";
            const reader = res.body.getReader();

            new ReadableStream({
                async start(controller) {
                    const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
                        if (event.type === "event") {
                            const data = event.data;
                            if (data === "[DONE]") {
                                setLoading(false);
                                setIsFinished(true);
                                onFinish && onFinish();
                                controller.close();
                                return;
                            }
                            try {
                                const json = JSON.parse(data);
                                const text = json.choices[0].delta?.content || "";
                                generation += text;
                                setGenCode(generation);
                                if (counter < 2 && (text.match(/\n/) || []).length) {
                                    return;
                                }
                                const queue = encoder.encode(text);
                                controller.enqueue(queue);
                                counter++;
                            } catch (e) {
                                controller.error(e);
                                setIsFinished(true);
                                setLoading(false);
                            }
                        }
                    });

                    let result: ReadableStreamReadResult<Uint8Array>;
                    while (!(result = await reader.read()).done) {
                        const chunk = result.value;
                        parser.feed(decoder.decode(chunk));
                    }
                },
            });
        } catch (error) {
            console.error("Failed to fetch from server:", error);
            setGenCode(`Error: ${error}`);
            setLoading(false);
            setIsFinished(true);
        }
    }

    static generatePayloadForAmazon(modelId: string, inputPrompt: string, systemPrompt?: string): AmazonConfig {
        const amazonModels = ["amazon.titan-text-express-v1", "amazon.titan-text-lite-v1"];

        if (!amazonModels.includes(modelId)) {
            throw new Error(`Unsupported model ID for Amazon models: ${modelId}`);
        }

        return {
            inputText: `"System": ${systemPrompt ? systemPrompt : ""} "User": ${inputPrompt}\n`,
            textGenerationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxTokenCount: 4096,
                stopSequences: [],
            },
        };
    }

    static generatePayloadForAnthropic(modelId: string, inputPrompt: string, systemPrompt?: string): AnthropicConfig {
        if (!modelId.startsWith("anthropic.")) {
            throw new Error(`Unsupported model ID for Anthropic models: ${modelId}`);
        }

        return {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 4096, // Default max tokens, update as needed
            system: systemPrompt ? systemPrompt : "",
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: inputPrompt }],
                },
            ],
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            stop_sequences: [],
        };
    }

    static generatePayloadForMetaLLama(modelId: string, inputPrompt: string, systemPrompt?: string): MetaLLamaConfig {
        if (!modelId.startsWith("meta.")) {
            throw new Error(`Unsupported model ID for Meta models: ${modelId}`);
        }

        return {
            prompt: `"System": ${systemPrompt ? systemPrompt : ""} "User": ${inputPrompt}\:`,
            temperature: 0.7,
            top_p: 0.9,
            max_gen_len: 2048,
        };
    }

    static generatePayloadForMistral(modelId: string, inputPrompt: string, systemPrompt?: string): MistralConfig {
        if (!modelId.startsWith("mistral.")) {
            throw new Error(`Unsupported model ID for Mistral models: ${modelId}`);
        }

        return {
            prompt: `"System": ${systemPrompt ? systemPrompt : ""} "User": ${inputPrompt}\:`,
            max_tokens: 4096,
            stop: [],
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
        };
    }

    static generatePayloadForCohere(modelId: string, inputPrompt: string, systemPrompt?: string): CohereConfig {
        if (!modelId.startsWith("cohere.")) {
            throw new Error(`Unsupported model ID for Cohere models: ${modelId}`);
        }

        return {
            prompt: `"System": ${systemPrompt ? systemPrompt : ""} "User": ${inputPrompt}\:`,
            temperature: 0.7,
            p: 0.9,
            k: 40,
            max_tokens: 4096,
            stop_sequences: [],
            return_likelihoods: "NONE",
            stream: true,
            num_generations: 1,
            truncate: "NONE",
        };
    }

    static generatePayloadForAI21(modelId: string, inputPrompt: string, systemPrompt?: string): AI21Config {
        if (!modelId.startsWith("ai21.")) {
            throw new Error(`Unsupported model ID for AI21 models: ${modelId}`);
        }

        return {
            prompt: `"System": ${systemPrompt ? systemPrompt : ""} "User": ${inputPrompt}\:`,
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 4096,
            stopSequences: [],
            countPenalty: {
                scale: 0.0,
            },
            presencePenalty: {
                scale: 0.0,
            },
            frequencyPenalty: {
                scale: 0.0,
            },
        };
    }
}

export default LLMServices;
