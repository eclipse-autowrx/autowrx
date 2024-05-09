import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export type ChatGPTAgent = "user" | "system";

export interface ChatGPTMessage {
    role: ChatGPTAgent;
    content: string;
}

export interface OpenAIStreamPayload {
    model: string;
    messages: ChatGPTMessage[];
    max_tokens: number;
    stream: boolean;
}

export async function OpenAIStream(
    payload: OpenAIStreamPayload,
    endpointUrl: string,
    apiKey: string,
    onFinalResponse: (finalResponse: string) => void
) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let counter = 0;
    let rawData = ""; // Variable to accumulate raw data chunks

    const res = await fetch(endpointUrl, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey ? apiKey : ""}`,
            "api-key": apiKey ? apiKey : "",
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!res.body) {
        throw new Error("Failed to get readable stream from response");
    }

    const reader = res.body.getReader();

    const stream = new ReadableStream({
        async start(controller) {
            const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
                if (event.type === "event") {
                    const data = event.data;
                    if (data === "[DONE]") {
                        controller.close();
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta?.content || "";
                        if (counter < 2 && (text.match(/\n/) || []).length) {
                            return;
                        }
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                        counter++;
                    } catch (e) {
                        controller.error(e);
                    }
                }
            });
            // Read the stream and feed the parser
            let result: ReadableStreamReadResult<Uint8Array>;
            while (!(result = await reader.read()).done) {
                const chunk = result.value;
                rawData += decoder.decode(chunk);
                parser.feed(decoder.decode(chunk));
            }
            // After the stream is closed, parse the accumulated raw data
            try {
                let finalResponse = decoder.decode(encoder.encode(rawData));
                onFinalResponse(finalResponse);
            } catch (error) {
                console.error("Error parsing final response:", error);
            }
        },
    });

    return stream;
}
