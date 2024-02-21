import { MonitorType } from "../../../hooks/useCviApiMonitor";
import Popup from "../../../reusable/Popup/Popup";
import { useState } from "react";

interface CVIApiMonitorProps {
    monitor: MonitorType;
}

const ValueInput = ({ name }) => {
    const [txtValue, setTxtValue] = useState("");

    const onKeyPressed = (event) => {
        if (event.key === "Enter") {
            // console.log(`handleKeyDown ${name} ${event.target.value}`)
            // console.log(window["runner"])
            if (window["runner"]) {
                let iframeWidnow = window["runner"].iframeWindow as any;
                let setValue: any = Number(txtValue);
                if (["false", "true"].includes(txtValue.toLowerCase())) {
                    if (txtValue.toLowerCase() === "false") {
                        setValue = false;
                    } else {
                        setValue = true;
                    }
                }
                // console.log(`name ${name}`)
                // console.log(`setValue ${setValue} type ${typeof setValue}`)
                iframeWidnow.PYTHON_BRIDGE.valueMap.set(name, setValue);
            }
        }
    };

    return (
        <input
            className="ml-2 w-[50px] px-2 py-1 bg-gray-600 focus:border-color-gray-400"
            onKeyDown={onKeyPressed}
            onChange={(e) => setTxtValue(e.target.value)}
            value={txtValue}
        />
    );
};

const CVIApiMonitor = ({ monitor }: CVIApiMonitorProps) => {
    const calPointValue = (value: any) => {
        if (typeof value !== "boolean") {
            return `${value || "0.0"}`;
        } else {
            return value ? "True" : "False";
        }
        return "0.0";
    };

    return (
        <div className="border-t border-gray-700 px-5 bg-gray-800 text-white h-full overflow-auto scroll-gray">
            <div className="flex pb-2 pt-4">
                <table className="table-auto w-full h-fit text-xs">
                    <thead>
                        <tr>
                            <td className="bg-gray-700 p-2">VSS API</td>
                            <td className="bg-gray-700 p-2">Last value</td>
                            <td className="bg-gray-700 p-2">#times called</td>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(monitor).map(([n, { value, called }]) => {
                            return (
                                <tr key={n}>
                                    <td className="p-2">{n}</td>
                                    <td className="p-2 min-w-[90px] max-w-[90px] flex items-center">
                                        {/* {typeof value !== "boolean" ? value : (value ? "True" : "False")} */}
                                        <div>{calPointValue(value)}</div>
                                        <ValueInput name={n} />
                                        {/* <div className="ml-2 px-2 py-1 cursor-pointer select-none font-bold rounded text-emerald-400 hover:bg-slate-500">Set</div> */}
                                    </td>
                                    <td className="p-2">{called}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CVIApiMonitor;
