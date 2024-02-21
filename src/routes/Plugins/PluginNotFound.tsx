import NewPlugin from "./EditPlugin";

const PluginNotFound = () => {
    return (
        <div className="flex flex-col h-full text-gray-300 items-center justify-center select-none">
            <div className="text-6xl mb-6">Plugin not found</div>

            <div className="text-2xl mb-40 text-center">
                Select one from the left or{" "}
                <NewPlugin trigger={<span className="text-aiot-green/60 cursor-pointer">create</span>} /> one.
            </div>
        </div>
    );
};

export default PluginNotFound;
