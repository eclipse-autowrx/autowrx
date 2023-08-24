import { FC } from "react"

interface TransparentInputProps {
    state: [string, (value: string) => void]
    className?: string
}

const TransparentInput: FC<TransparentInputProps> = ({state, className}) => {
    const [value, setValue] = state

    return (
        <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        className={className}
        />
    )
}

export default TransparentInput