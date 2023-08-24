import { FC } from "react"

interface InputContainerProps {
    label: string
    input: React.ReactElement
}

const InputContainer: FC<InputContainerProps> = ({input, label}) => {
    return (
        <div className="flex flex-col w-full mb-3">
            <div className="mb-2 text-sm text-gray-400 select-none">{label}</div>
            {input}
        </div>
    )
}

export default InputContainer