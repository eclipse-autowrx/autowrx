import { Model } from "../../../../../../apis/models"
import { AnyNode } from "../Spec"
import DetailsHalf from "./DetailsHalf"
import ListHalfMemoized from "./ListHalf"

interface ListViewProps {
    model: Model
    node_name: string
    activeNode: AnyNode | null
    isActiveNodeCustom: boolean
    onlyShow?: string[]
}

const ListView = ({node_name, activeNode, onlyShow, model, isActiveNodeCustom}: ListViewProps) => {
    return (
        <div className="flex h-full w-full">
            <div className="flex h-full w-3/6">
                <ListHalfMemoized
                node_name={node_name}
                model={model}
                onlyShow={onlyShow}
                />
            </div>
            <div className="flex flex-col h-full w-3/6">
                <DetailsHalf
                node_name={node_name}
                activeNode={activeNode}
                model={model}
                isActiveNodeCustom={isActiveNodeCustom}
                />
            </div>
        </div>
    )
}

export default ListView