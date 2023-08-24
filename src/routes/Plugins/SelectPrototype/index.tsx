import { FC, useState } from "react"
import { IoClose } from "react-icons/io5"
import { getPrototypes } from "../../../apis"
import { Model, Prototype } from "../../../apis/models"
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh"
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel"
import SideNav from "../../../reusable/SideNav/SideNav"
import LoadingPage from "../../components/LoadingPage"
import PrototypeSummaryDisplay from "./PrototypeSummaryDisplay"

interface SelectPrototypeProps {
    trigger?: React.ReactElement
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    selectPrototype: (prototype: Prototype) => Promise<void>
    filter?: (prototype: Prototype) => boolean
}

const SelectPrototype: FC<SelectPrototypeProps> = ({trigger, state: statePassed, selectPrototype, filter}) => {
    const selfManaged = useState(false)
    const state = statePassed ?? selfManaged
    const model = useCurrentModel() as Model

    const {value: prototypes, loading} = useAsyncRefresh(async () => {
        return await getPrototypes(model.id)
    }, [model.id])

    const filteredLibrary = typeof prototypes === "undefined" ? [] : (
        prototypes
        .filter(prototype => typeof filter === "undefined" || filter(prototype))
    )

    return (
        <>
            <SideNav trigger={typeof trigger === "undefined" ? <></> : trigger} state={state} width="400px" className="h-full">
                {loading ? (
                    <div className="flex w-full h-full items-center justify-center pt-36" style={{width: 490}}>
                        <LoadingPage/>
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex py-3 px-4 select-none text-xl border-b text-aiot-blue font-bold items-center">
                            <div>Select Prototype</div>
                            <div className="ml-auto cursor-pointer" onClick={() => state[1](false)}><IoClose className="text-2xl"/></div>
                        </div>
                        <div className="flex flex-col overflow-auto">
                            {typeof prototypes === "undefined" ? [] : (
                                <>
                                    {filteredLibrary.map(prototype => (
                                        <PrototypeSummaryDisplay
                                        key={prototype.id}
                                        prototype={prototype}
                                        onClick={() => {
                                            selectPrototype(prototype)
                                            state[1](false)
                                        }}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </SideNav>
        </>
    )
}

export default SelectPrototype