import { Model } from "../../../apis/models"
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel"
import LinkWrap from "../../../reusable/LinkWrap"
import NewPrototype from "../../NewPrototype"
import WIPPopup from "../WIPPopup"

const PrototypeNotFound = () => {
    const model = useCurrentModel() as Model

    return (
        <div className="flex flex-col h-full text-gray-300 items-center justify-center select-none">
            <div className="text-6xl mb-6">Prototype not found</div>

            <div className="text-2xl mb-40 text-center">
                Select one from the left or <NewPrototype trigger={<span className="text-aiot-green/60 cursor-pointer">create</span>}/> one.
            </div>
        </div>
    )
}

export default PrototypeNotFound