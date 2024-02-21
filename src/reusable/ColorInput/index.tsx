import clsx from "clsx";
import { FC, useState } from "react";
import styles from "./styles.module.scss";

const ColorInput: FC<{
    state?: [string, React.Dispatch<React.SetStateAction<string>>];
}> = ({ state: passedState }) => {
    const selfManaged = useState("#000000");
    const state = passedState ?? selfManaged;

    return (
        <div className="flex w-full relative items-center select-none">
            <input
                className={clsx("cursor-pointer", styles.Input)}
                type="color"
                value={state[0]}
                onChange={(e) => state[1](e.target.value)}
            />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: state[0] }}></div>
            <div className="ml-2 text-gray-500 font-bold">{state[0]}</div>
        </div>
    );
};

export default ColorInput;
