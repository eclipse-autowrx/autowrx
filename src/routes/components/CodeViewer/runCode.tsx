import { OutputPart } from "./models";
import BrythonRunner from "../../../brython-runner/BrythonRunner";
import { LIBRARY_FILE } from "../../../constants";

export const runner = new BrythonRunner({
    brythonUrl: "https://cdnjs.cloudflare.com/ajax/libs/brython/3.10.5/brython.js",
    brythonLibraries: ["https://cdnjs.cloudflare.com/ajax/libs/brython/3.10.5/brython_stdlib.min.js", LIBRARY_FILE],
});

const isValidLine = (line: string) => {
    return (
        line.trim() !== "" &&
        !line.startsWith("async def ") &&
        !line.startsWith("def ") &&
        !line.startsWith("  ") &&
        !line.startsWith(" ") &&
        !line.startsWith("#") &&
        !line.startsWith("class ") &&
        !line.startsWith("if ") &&
        !line.startsWith("else: ")
    );
};
// [output, line run, hasFinished]
type runCodeOutput = [OutputPart[], number | null, boolean];

const notifyToAllWidget = (message: string) => {
    let frames = document.getElementsByTagName("iframe");
    for (let i = 0; i < frames.length; i++) {
        frames[i]?.contentWindow?.postMessage(message, "*");
    }
};

const runCode = async (prototype_name: string, code: string, lineIndex: number | null): Promise<runCodeOutput> => {
    notifyToAllWidget("startRun");
    const timeNow = new Date().toTimeString().split(" GMT")[0];
    const startingOutput: OutputPart = {
        text: `Starting Now: ${prototype_name} - ${timeNow}\n`,
        type: "string",
    };
    const endingOutput: OutputPart = {
        text: `Ending Now: ${prototype_name}`,
        type: "string",
    };
    window["runner"] = runner;
    if (lineIndex === null) {
        const codeOutput = await runner.runCode(code);
        const output: OutputPart[] = [startingOutput, ...codeOutput, endingOutput];
        // notifyToAllWidget('stopRun')
        return [output, lineIndex, true];
    } else {
        const lines = code.split("\n");
        while (lineIndex < lines.length && !isValidLine(lines[lineIndex])) {
            lineIndex++;
        }
        if (lineIndex >= lines.length) {
            return [[], lineIndex, true];
        }
        const codeOutput = await runner.runCode(lines.slice(0, lineIndex + 1).join("\n"));

        const output: OutputPart[] = [startingOutput, ...codeOutput];

        if (lineIndex === lines.length - 1) {
            output.push(endingOutput);
        }

        // notifyToAllWidget('stopRun')
        return [output, lineIndex, lineIndex === lines.length - 1];
    }
};

export const loadModelLibrary = (spec: string, custom_apis: string) => {
    // console.log('loadModelLibrary --------------------------------')
    // console.log("spec", spec)
    // console.log("custom_apis", custom_apis)
    // console.log('-------------------------------------------------')
    runner.setVSSSpec(spec, custom_apis);
};

export default runCode;
