import clsx from "clsx";
import { FC, useEffect, useState } from "react"
import { FiRepeat, FiSave, FiX } from "react-icons/fi";
import Button from "../../../reusable/Button";
import Input from "../../../reusable/Input/Input";
import parseCJFromInput, { TableDataType } from './parser/parseCJFromInput';
import Table from "./Table";
import styles from "./EditCustomerJourney.module.scss"

interface EditCustomerJourneyProps {
    defaultValue: string
    saveCustomerJourney: (value: string) => Promise<void>
    cancel: () => void
}

const EditCustomerJourney: FC<EditCustomerJourneyProps> = ({
    defaultValue,
    cancel,
    saveCustomerJourney
}) => {
    const [text, setText] = useState("")
    const [data, setData] = useState<TableDataType | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setText(defaultValue)
    }, [defaultValue])

    return (
        <div className="flex h-full w-full">
            <div className="flex flex-col w-full p-4">
                <div className="flex w-full mb-4">
                    <Button
                    disabled={loading}
                    variant="failure"
                    className="py-1 mr-2 ml-auto"
                    onClick={() => {
                        cancel()
                    }}
                    >
                        <FiX className="mr-2 " style={{transform: "scale(1.2)"}}/>
                        Cancel
                    </Button>
                    <Button
                    disabled={loading}
                    className="py-1"
                    onClick={async () => {
                        setLoading(true)
                        await saveCustomerJourney(text)
                        setLoading(false)
                    }}
                    variant="success"
                    >
                        <FiSave className="mr-2" />
                        Save
                    </Button>
                </div>
                <Input
                form="textarea"
                state={[text, setText]}
                placeholder='#Step1: Customer journey phase 1&#10;row header 1: Lorem Ipsum&#10;row header n: Lorem Ipsum&#10;#Step2: Customer journey phase n&#10;row header 1: Lorem Ipsum&#10;row header n: Lorem Ipsum&#10;...'
                className="h-full w-full"
                containerClassName={clsx("h-full w-full", styles.Input)}
                />
            </div>
        </div>
    )
}

export default EditCustomerJourney