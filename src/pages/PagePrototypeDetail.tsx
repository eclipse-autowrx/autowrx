 import { FC } from "react"
 import useModelStore from "@/stores/modelStore";
import { Prototype } from "@/types/model.type";


const PagePrototypeDetail: FC = ({}) => {
    const [prototype] = useModelStore(
        (state) => [state.prototype as Prototype]
      );

    if (!prototype) {
    return <div className="container grid place-items-center">
        <div className="p-8 text-da-gray-dark da-label-huge">Prototype not found</div>
    </div>
    }
    
    return <div className="">
        <div className="px-4 py-2 bg-da-primary-500 text-da-white da-label-sub-title">
            {prototype.name}
            <div className="grow"></div>
        </div>
    </div>
}

export default PagePrototypeDetail