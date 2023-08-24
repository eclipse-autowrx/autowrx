import { FC } from "react"
import { ImagePin, Model, ModelView } from "../../../../../../../apis/models"
import { CameraCoordinates } from "../../../../../../models"
import NodeViewer from "../../../../../CVIViewer/NodeViewer"
import LinkifyModelView from "../../../../../ModelBox/LinkifyModelView"
import ModelBox from "../../../../../ModelBox/ModelBox"
import { getClosestNode } from "../../../../../nodeUtils"
import UpdateMedia from "../../../../../UpdateMedia"
import COVESALogo from "../../../../../../../assets/Logos/COVESA.png"
import camera from "../../../../../../../data/camera"
import { AnyNode } from "../../Spec"
import { deleteApi } from "../../utils/api"

const getCoordinates = (node_name: string) => {
    const slice = getClosestNode(node_name, name_slice => name_slice in camera)
    return (camera as any)[slice ?? ""] as CameraCoordinates | undefined
}

interface ModelViewProps {
    node_name: string
    activeNode: AnyNode | null
    model: Model
    isActiveNodeCustom: boolean
}

const DetailsHalf: FC<ModelViewProps> = ({node_name, activeNode, model, isActiveNodeCustom}) => {
    // const editingCustomNode = useState<null | [string, Node]>(null)
    // const customApiSidenav = useState(false)

    const getModelView = (node_name: string) => {
        const slice = getClosestNode(node_name, name_slice => name_slice in model.model_files)
        const model_view = model.model_files[slice ?? ""] as ModelView<ImagePin> | undefined
        if (typeof model_view === "undefined") {
            return undefined
        }
        return LinkifyModelView(model, slice ?? "")
    }


    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex w-full h-3/6 relative">
                <UpdateMedia model_id={model.id} node_path={node_name ? node_name : model.main_api}  />
                <ModelBox
                coordinates={getCoordinates(node_name)}
                model_view={getModelView(node_name) ?? LinkifyModelView(model, model.main_api)}
                />
            </div>
            <div className="flex w-full h-3/6 overflow-auto">
                {activeNode ? (
                    <NodeViewer
                    name={node_name} node={activeNode} isCustom={isActiveNodeCustom}
                    // editCustomNode={(name, node) => {
                    //     editingCustomNode[1]([name, node])
                    //     customApiSidenav[1](true)
                    // }}
                    deleteCustomNode={(name) => deleteApi(model.id, name)}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full select-none pointer-events-none">
                        <img alt="COVESA Logo" src={COVESALogo} className="h-20 opacity-60" />
                    </div>
                )}
            </div>
        </div>
    )
}

export default DetailsHalf