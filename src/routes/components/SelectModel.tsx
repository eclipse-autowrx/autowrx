import { Model } from "../../apis/models";
import { useCurrentTenantModels } from "../../reusable/hooks/useCurrentTenantModels";
import LinkWrap from "../../reusable/LinkWrap";
import NewModelButton from "./NewModelButton";
import DisplayImage from "./PrototypeOverview/DisplayImage";

interface ModelDisplayProps {
    model: Model;
}

const ModelDisplay = ({ model }: ModelDisplayProps) => {
    return (
        <LinkWrap to={`/model/${model.id}`} className="mr-2 w-full">
            <div className="flex flex-col w-full h-full rounded-lg overflow-hidden select-none border border-gray-200 hover:border-aiot-blue transition duration-300 ">
                <div className="flex items-center py-3 px-5 text-2xl text-aiot-blue">{model.name}</div>
                <DisplayImage image_file={model.model_home_image_file} />
            </div>
        </LinkWrap>
    );
};

const SelectModel = () => {
    const models = useCurrentTenantModels();

    const handleModelCreated = (model_id) => {
        // console.log(`Model created: ${model_id}`)
        if (model_id) {
            window.location.href = `/model/${model_id}`;
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="flex flex-col p-5">
            <div className="text-2xl font-bold mb-4 mt-2 text-aiot-blue">Select Vehicle Models</div>
            <div className="grid grid-cols-4 gap-4 w-full h-full">
                {models.map((model) => (
                    <ModelDisplay key={model.id} model={model} />
                ))}
                <NewModelButton onModelCreated={handleModelCreated} />
            </div>
        </div>
    );
};

export default SelectModel;
