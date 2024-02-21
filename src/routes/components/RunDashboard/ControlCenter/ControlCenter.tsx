import { FC, useState } from "react";
import { VscBug } from "react-icons/vsc";
import { ImagePin, Model, ModelView } from "../../../../apis/models";
import { useCurrentModel } from "../../../../reusable/hooks/useCurrentModel";
import LinkifyModelView from "../../ModelBox/LinkifyModelView";
import ModelBox from "../../ModelBox/ModelBox";
import { getClosestNode } from "../../nodeUtils";
import ExecutionCenter from "./ExecutionCenter";

interface ModelIteratorProps {
    showPreview: boolean;
    playingModel: string;
}

const ModelIterator: FC<ModelIteratorProps> = ({ showPreview, playingModel }) => {
    const model = useCurrentModel() as Model;

    const getModelView = (node_name: string) => {
        const slice = getClosestNode(node_name, (name_slice) => name_slice in model.model_files);
        const model_view = model.model_files[slice ?? ""] as ModelView<ImagePin> | undefined;
        if (typeof model_view === "undefined") {
            return undefined;
        }
        return LinkifyModelView(model, slice ?? "");
    };

    return showPreview ? (
        <div className="flex w-full h-full items-center justify-center text-white p-14 border-r border-gray-700">
            <div className="flex h-fit w-fit mr-8">
                <VscBug size="8em" />
            </div>
            <div className="flex flex-col h-fit w-fit">
                <div className="text-4xl font-bold mb-4">Starting Debug Mode now!</div>
                <div className="text-3xl">Press "Next" to go through the prototype code line-by-line.</div>
            </div>
        </div>
    ) : (
        <ModelBox model_view={getModelView(playingModel) ?? LinkifyModelView(model, model.main_api)} />
    );
};

const ControlCenter: FC<{
    code: string;
}> = ({ code }) => {
    const [playingModel, setPlayingModel] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);

    return (
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            {/* <div className="row-span-2 col-span-2">
                <ModelIterator showPreview={showPreview} playingModel={playingModel} />
            </div> */}
            <div className="row-span-2 col-span-2">
                <ExecutionCenter
                    code={code}
                    startExecution={() => {
                        setPlayingModel("");
                        setShowPreview(true);
                    }}
                    executeExceptFirst={() => {
                        setShowPreview(false);
                    }}
                    endExecution={() => {
                        setShowPreview(false);
                    }}
                />
            </div>
        </div>
    );
};

export default ControlCenter;
