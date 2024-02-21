import { useState, useEffect } from "react";
import axios from "axios";
import PROMPTS from "../../../utils/prompt";
import { BsFillCaretDownFill, BsFillCaretUpFill } from "react-icons/bs";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { addLog } from "../../../apis";

const sampleCode = `
from sdv_model import Vehicle
from browser import aio
vehicle = Vehicle()
# start your code here
`;

const CODEX_API1 = `https://genaieu.openai.azure.com/openai/deployments/35turbo/completions?api-version=2023-09-15-preview`;
const CODEX_API2 = `https://genaieu.openai.azure.com/openai/deployments/davinci-002/completions?api-version=2023-09-15-preview`;

const CodeAssistant = ({ onCodeGen, code }) => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [guide, setGuide] = useState("");
    const { profile } = useCurrentUser();

    const tryToGenCode = async () => {
        if (guide.trim().length <= 0 || loading) return;
        if (onCodeGen) {
            setLoading(true);
            let result = "";
            try {
                const res = await axios.post(
                    CODEX_API1,
                    {
                        prompt: `${PROMPTS}\r\n ${guide}`,
                        // prompt: `${guide}`,
                        max_tokens: 5000,
                        temperature: 0.75,
                        frequency_penalty: 0,
                        presence_penalty: 0,
                        top_p: 1,
                        best_of: 1,
                        stop: ["#"],
                    },
                    {
                        headers: {
                            "api-key": "0df3fb0b2eb34166ad84ca7c1f3342bf",
                        },
                    }
                );
                // result = res.data.code
                console.log("res", res.data.choices);
                if (res.data && res.data.choices && res.data.choices.length > 0) {
                    result = res.data.choices[0].text;
                }
            } catch (err) {
                console.log("err on Codex", err);
            }
            setLoading(false);
            onCodeGen(result || sampleCode);
        }
    };
    return (
        <div className="bg-slate-200">
            <div
                className="flex items-center px-4 py-1 leading-tight text-sm text-slate-500 font-bold select-none cursor-pointer hover:bg-slate-300"
                onClick={() => {
                    setShow(!show);
                }}
            >
                Code Assistant (Experimental)
                <div className="ml-2">
                    {show && <BsFillCaretUpFill />}
                    {!show && <BsFillCaretDownFill />}
                </div>
            </div>
            {show && (
                <div className="px-4 pb-2 pt-1 flex item-center">
                    <textarea
                        placeholder="Describe your app here"
                        value={guide}
                        onChange={(e) => {
                            setGuide(e.target.value);
                        }}
                        className="grow flex border-[0.068rem] border-transparent text-gray-600 
                    bg-white rounded p-2 text-lg outline-none focus:border-gray-300"
                    />
                    <div className="ml-2">
                        <button
                            className={`px-6 py-2 rounded text-[18px] text-white select-none 
                        ${
                            guide.trim().length > 0
                                ? "cursor-pointer bg-aiot-blue hover:opacity-80"
                                : "bg-gray-400 cursor-not-allowed"
                        }`}
                            onClick={() => {
                                tryToGenCode();
                                if (profile) {
                                    addLog(
                                        `User '${profile.name}' use GenAI'`,
                                        `User '${profile.name} use GenAI''`,
                                        "genAI",
                                        profile.uid,
                                        null,
                                        profile.uid,
                                        "CodeAssistant",
                                        null
                                    );
                                }
                            }}
                        >
                            {loading ? "Processing..." : "Generate Code"}
                        </button>
                        <div className="text-[12px] text-slate-600 mt-1 italic">Powered by OpenAI on Azure</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeAssistant;
