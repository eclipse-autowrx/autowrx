import clsx from "clsx";
import { useEffect, useRef } from "react";
import { random } from "../../../reusable/functions";
import { Line } from "./models";

interface TerminalProps {
    title?: string;
    openClassName?: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    lines: Line[];
    hideMinimize?: boolean;
    outerClassName?: string;
    codeClassName?: string;
}

const Terminal = ({
    title = "Terminal",
    openClassName = "h-96",
    codeClassName = "",
    open,
    setOpen,
    lines,
    hideMinimize = false,
    outerClassName,
}: TerminalProps) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [JSON.stringify(lines)]);

    return (
        <div className={clsx("flex flex-col w-full", outerClassName)}>
            <div className="w-full h-full">
                <div
                    ref={ref}
                    className={clsx(
                        "flex flex-col text-gray-100 text-sm subpixel-antialiased bg-gray-800 leading-normal overflow-auto",
                        open ? openClassName : "h-fit"
                    )}
                >
                    <div className="top flex items-center sticky top-0 left-0 bg-gray-800 px-5 pt-4 pb-2">
                        <div className="select-none">{title}</div>
                        {!hideMinimize && (
                            <div
                                onClick={() => setOpen(!open)}
                                className="ml-auto h-3 w-3 bg-orange-200 hover:bg-orange-300 rounded-full hover:cursor-pointer"
                            ></div>
                        )}
                    </div>
                    {open && (
                        <div className={clsx("flex flex-col h-full px-5", codeClassName)}>
                            {lines.map((line, i) => (
                                <div className="mt-2 flex font-mono last:pb-4" key={random()}>
                                    <span className="text-green-400 select-none">{`>>>`}</span>
                                    <p className={clsx("flex-1 items-center pl-2 whitespace-pre-line")}>
                                        {line.parts.map((part, i) => {
                                            return (
                                                <span
                                                    key={i + "-" + part.type + " - " + part.text}
                                                    className={part.type === "error" ? "text-red-400" : ""}
                                                >
                                                    {part.text}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Terminal;
