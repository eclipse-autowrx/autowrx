export interface OutputPart {
    text: string
    type: "error" | "string"
}

export interface Line {
    parts: OutputPart[]
}