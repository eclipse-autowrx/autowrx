import { FC } from "react";

interface InputContainerProps {
    label: string;
    input: React.ReactElement;
    className?: string;
    labelClassName?: string;
}

const InputContainer: FC<InputContainerProps> = ({ input, label, className, labelClassName }) => {
    return (
        <div className={`flex flex-col w-full mb-6 ${className}`}>
            <div className={`mb-1 text-sm text-gray-600 select-none ${labelClassName}`}>{label}</div>
            {input}
        </div>
    );
};

export default InputContainer;
