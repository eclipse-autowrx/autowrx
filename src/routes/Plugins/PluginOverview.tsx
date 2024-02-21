import clsx from "clsx";
import { getPrototypes } from "../../apis";
import { Model, Plugin } from "../../apis/models";
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import useGetPrototype from "../../reusable/hooks/useGetProtototype";
import LinkWrap from "../../reusable/LinkWrap";
import UserProfile from "../components/PrototypeOverview/UserProfile";

interface PluginOverviewProps {
    plugin: Plugin;
    active: boolean;
}

const PluginOverview = ({ plugin, active }: PluginOverviewProps) => {
    const model = useCurrentModel() as Model;
    const { prototype } = useGetPrototype(plugin.prototype_id ?? "");

    return (
        <LinkWrap to={`/model/:model_id/plugins/plugin/${plugin.id}`}>
            <div
                className={clsx(
                    "w-full transition py-4 border-b",
                    active && "bg-aiot-blue text-white border-transparent"
                )}
            >
                <div className="flex flex-col px-4 space-y-1 ">
                    <div className="text-xl">{plugin.name}</div>
                    <UserProfile user_uid={plugin.created.user_uid} clickable={false} />
                    <div>{plugin.description}</div>
                </div>
                {prototype !== null && (
                    <div className={clsx("text-sm px-4 pt-2", active && "border-transparent")}>
                        <strong>Prototype: </strong>
                        {prototype?.name}
                    </div>
                )}
            </div>
        </LinkWrap>
    );
};

export default PluginOverview;
