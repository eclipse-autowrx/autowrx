import { Fragment, useState } from "react"
import Button from "../../../reusable/Button"
import Input from "../../../reusable/Input/Input"
import Popup from "../../../reusable/Popup/Popup"

interface ValuePopupProps {
    trigger: React.ReactElement
}

const ValuePopup = ({trigger}: ValuePopupProps) => {
    const PopupState = useState(false)
    return (
        <Popup trigger={trigger} state={PopupState}>
            <Input defaultValue="123" />
            <div className="w-fit mt-4 text-xl ml-auto">
                <Button className="pr-3 pl-3 py-1" onClick={() => PopupState[1](false)}>Set Value</Button>
            </div>
        </Popup>

    )
}


interface TypeDisplayProps {
    label: string
    values?: string[]
}

const TypeDisplay = ({label, values}: TypeDisplayProps) => {
    return (values ?? []).length === 0 ? null : (
        <div>
            <span className="font-bold">{label}: </span>
            {(values ?? []).map((value, i) => {
                const isLast = i === (values ?? []).length - 1
                return (
                    <Fragment key={value}>
                        <ValuePopup trigger={<span className="text-gray-400 cursor-pointer">{value}</span>} />
                        <span className="text-gray-400 " >{isLast ? "" : ", "}</span>
                    </Fragment>
                )
            })}
        </div>
    )
}

export default TypeDisplay