import UserProfile from "./UserProfile"
import { HiStar } from "react-icons/hi"
import NoPrototypeDisplay from "./NoPrototypeDisplay"
import WIPPopup from "../WIPPopup"
import Button from "../../../reusable/Button"
import LinkWrap from "../../../reusable/LinkWrap"
import { VscDebugStart, VscEdit } from "react-icons/vsc"
import { Prototype } from "../../../apis/models"
import DisplayImage from "./DisplayImage"
import Stars from "../../../reusable/Stars"
import { getLinkedPluginFromPrototype } from "../../../apis"
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh"

interface DisplayDescriptionProps {
    name: string
    value?: string
}

const DisplayDescription = ({name, value}: DisplayDescriptionProps) => {
    return (
        <tr>
            <td className="font-bold select-none pr-2 whitespace-nowrap align-top">{name}</td>
            <td style={{whiteSpace: "break-spaces"}}>{value}</td>
        </tr>
    )
}

interface PrototypeDisplayProps {
    prototype: Prototype
}

const PrototypeDisplay = ({prototype}: PrototypeDisplayProps) => {
    const calculateRating = (rating: Prototype["rated_by"]) => {
        const sumOfAllRatings = Object.values(rating).map(({rating}) => rating).reduce((partialSum, a) => partialSum + a, 0);
        return sumOfAllRatings / Object.keys(rating).length
    }

    const {value: plugin} = useAsyncRefresh(async () => {
        return await getLinkedPluginFromPrototype(prototype.model_id, prototype.id)
    })

    return typeof prototype === "undefined" ? <NoPrototypeDisplay /> : (
        <div className="flex flex-col">
            <DisplayImage image_file={prototype.image_file} />
            {typeof plugin !== "undefined" && (
                <LinkWrap to={`/model/:model_id/plugins/plugin/${plugin.id}`}>
                    <div className="bg-violet-700 text-white px-3 py-2 select-none"><strong>Plugin: {plugin.name}</strong></div>
                </LinkWrap>
            )}
            <div className="relative flex flex-col p-5">
                <div className="flex absolute top-6 right-5 select-none items-center ">
                    <LinkWrap to={`/model/:model_id/library/prototype/${prototype.id}/view`} className="mr-2">
                        <Button className="pl-1">
                            <VscDebugStart className="text-3xl" style={{transform: "scale(0.65)", marginRight: "2px"}}/>
                            <div>Open</div>
                        </Button>
                    </LinkWrap>
                </div>

                <div className="flex">
                    <div className="text-3xl mb-3">{prototype.name}</div>
                </div>
                <div className="mb-4 w-fit">
                    <UserProfile user_uid={prototype.created.user_uid} clickable={true} />
                </div>
                <table className="table-auto leading-relaxed">
                    <DisplayDescription name="Problem" value={prototype.description.problem} />
                    <DisplayDescription name="Says who?" value={prototype.description.says_who} />
                    <DisplayDescription name="Solution" value={prototype.description.solution} />
                    <DisplayDescription name="Status" value={prototype.description.status} />
                </table>
                {/* <div className="text-lg">{prototype.scription}</div> */}
                <div className="flex w-fit mt-4 mb-7">
                    <div className="flex items-center justify-center">
                        <Stars rating={Object.keys(prototype.rated_by).length === 0 ? 0 : calculateRating(prototype.rated_by)} />
                        <div className="ml-2 mt-1">({Object.keys(prototype.rated_by).length})</div>
                    </div>
                    <WIPPopup trigger={
                        <Button className="ml-3 mt-1 py-1">
                            <HiStar className="text-xl mr-1"/>
                            <div>Rate Now</div>
                        </Button>
                    }/>
                </div>
                <div className="flex flex-col text-lg">
                    <div className="text-xl mb-3 mr-2"><strong>Connected Vehicle Interfaces</strong> used by this prototype:</div>
                    <table>
                        {Object.entries(prototype.apis).map(([prototype_type, apis]) => (
                            <tr key={prototype_type}>
                                <td className="pr-4 text-2xl align-top w-0">{prototype_type}</td>
                                <td className="align-top">
                                    <div className="flex flex-wrap">
                                        {apis.map(api => (
                                            <div key={api} className="rounded-md bg-aiot-blue text-white mb-2 mr-2 py-0.5 px-3 select-none">{api}</div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PrototypeDisplay