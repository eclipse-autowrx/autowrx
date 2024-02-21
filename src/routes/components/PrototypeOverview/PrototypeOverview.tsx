import LinkWrap from "../../../reusable/LinkWrap";
import UserProfile from "./UserProfile";
import clsx from "clsx";
import { Prototype } from "../../../apis/models";
import TagSelection from "../../TagsFilter/TagSelection";
import TagDisplay from "../../TagsFilter/TagDisplay";

interface PrototypeOverviewProps {
    prototype: Prototype;
    active: boolean;
    isMyPrototype: boolean;
}

const PrototypeOverview = ({ prototype, active, isMyPrototype }: PrototypeOverviewProps) => {
    return (
        <LinkWrap to={`/model/:model_id/library/prototype/${prototype.id}`}>
            <div
                className={clsx(
                    "w-full transition border-b text-gray-700",
                    active && "bg-aiot-blue/5 border-transparent"
                )}
            >
                <div className="flex w-full h-auto">
                    <div className={` ${active ? "bg-aiot-blue" : "bg-transparent"} w-1 mr-3 flex grow`}></div>
                    <div className="w-full flex flex-col p-2 space-y-2">
                        <div
                            className={clsx(
                                `pt-2 text-xl ${active ? "text-aiot-blue" : "text-gray-600"}`,
                                isMyPrototype && "font-extrabold"
                            )}
                        >
                            {prototype.name}
                        </div>
                        <UserProfile user_uid={prototype.created.user_uid} clickable={false} />
                        <div className={`${active ? "text-gray-600" : "text-gray-600"}`}>
                            {prototype.description.problem}
                        </div>
                        <div className="pt-0">
                            <TagDisplay categoryAndTags={prototype.tags ?? []} />
                        </div>
                    </div>
                </div>
            </div>
        </LinkWrap>
    );
};

export default PrototypeOverview;
