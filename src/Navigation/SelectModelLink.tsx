import clsx from "clsx"
import { FC } from "react"
import { FaCar } from "react-icons/fa"
import { Model } from "../apis/models"
import LinkWrap from "../reusable/LinkWrap"
import Tab from "../reusable/Tabs/Tab"

interface SelectModelLinkProps {
    model?: Model
    className?: string
}

const SelectModelLink: FC<SelectModelLinkProps> = ({model, className}) => {
    return (
        <div className={clsx("flex text-gray-400 text-xl", className)}>
            <LinkWrap to="/model">
                <Tab
                label={
                    <div className="flex items-center relative" style={{minWidth: 80, height: "100%"}}>
                        {typeof model === "undefined" ? (
                            <>
                                <FaCar style={{transform: "scale(1.4)"}} className="mr-3" />
                                <div className="flex h-full items-center w-full">Select Model</div>
                            </>
                        ) : (
                            <>
                                <FaCar style={{transform: "scale(1.3)"}} className="mr-3" />
                                <div className="flex h-full items-center w-full">{model.name}</div>
                            </>
                        )}
                    </div>
                }
                className="flex h-full text-xl items-center px-4 min-w-max"
                />
            </LinkWrap>
        </div>
    )
}

export default SelectModelLink