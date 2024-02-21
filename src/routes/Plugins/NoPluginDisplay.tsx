import { Model } from "../../apis/models";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import NewPlugin from "./EditPlugin";

const NoPluginDisplay = () => {
    const model = useCurrentModel() as Model;

    return (
        <div className="flex flex-col h-full text-gray-300 items-center justify-center select-none">
            <div className="text-6xl mb-6">No Plugins</div>
            <div className="text-2xl mb-40 text-center">
                <NewPlugin trigger={<span className="text-aiot-green/60 cursor-pointer">Create</span>} /> the first
                plugin in <strong>{model.name}</strong>
            </div>
        </div>
    );
};

export default NoPluginDisplay;
