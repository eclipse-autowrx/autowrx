import { Prototype } from "../../../apis/models"
import useCurrentPrototype from "../../../hooks/useCurrentPrototype"
import DisplayImage from "../PrototypeOverview/DisplayImage"
import EAComponents from "./EAComponents"
import UploadAnalysisImage from "./UploadAnalysisImage"


const Analysis = () => {
    const prototype = useCurrentPrototype() as Prototype

    return (
        <div className="flex flex-col relative w-full h-full p-4">
            {(prototype.analysis_image_file ?? "") === "" ? (
                <div className="flex relative bg-gray-100 h-80">
                    <UploadAnalysisImage/>
                </div>
            ) : (
                <div className="flex relative mx-auto">
                    <UploadAnalysisImage/>
                    <DisplayImage image_file={prototype.analysis_image_file ?? ""} />
                </div>
            )}
            <EAComponents/>
        </div>
    )
}

export default Analysis