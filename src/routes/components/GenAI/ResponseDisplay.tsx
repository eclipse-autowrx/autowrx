import SyntaxHighlighter from "react-syntax-highlighter";
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { customStyle } from "../AddOns/StandardConfiguration";
import { useState, useEffect } from "react";

export interface GenCodeProps {
    language: string;
    code: string;
}

const ResponseDisplay = ({ language = "text", code }) => {
    const [genCode, setGenCode] = useState<string>("");

    useEffect(() => {
        setGenCode(code);
    }, [code]);

    return (
        <div className="flex w-full h-full rounded border bg-gray-50 border-gray-200 overflow-y-auto scroll-gray">
            <SyntaxHighlighter language={language} style={customStyle} className="flex text-xs w-full scroll-gray">
                {genCode}
            </SyntaxHighlighter>
        </div>
    );
};

export default ResponseDisplay;
