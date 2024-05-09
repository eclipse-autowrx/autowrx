import { TbStar, TbTerminal2 } from "react-icons/tb";
import { CachePrototype } from "../../apis/backend/prototypeApi";
import { Link } from "react-router-dom";
import { Prototype } from "../../apis/models";
import dayjs from "dayjs";
import { Tooltip } from "@mui/material";

type CacheType = {
    type: "cache";
    data: CachePrototype;
};

type NormalType = {
    type?: "normal";
    data: Prototype;
};

type PrototypeCardProps = CacheType | NormalType;

function isCacheType(type: "cache" | "normal" | undefined, data: CachePrototype | Prototype): data is CachePrototype {
    return type === "cache" || type === undefined;
}

const PrototypeCard = ({ type, data }: PrototypeCardProps) => {
    const avg = data.rated_by
        ? Object.values(data.rated_by).reduce((prev, curr) => {
              return prev + curr.rating;
          }, 0) / Object.values(data.rated_by).length
        : NaN;

    return (
        <div className="w-full h-full relative">
            <div className="right-2 flex gap-2 top-2 absolute">
                {isCacheType(type, data) && (
                    <>
                        {data.page && (
                            <div className="rounded-full px-2 py-1 bg-aiot-blue text-white border">
                                <p className="text-xs">{data.page[0].toUpperCase() + data.page.slice(1)}</p>
                            </div>
                        )}
                        {data.model && (
                            <Link to={`/model/${data.model_id}`} className="rounded-full px-2 py-1 border bg-white">
                                <p className="text-xs">{data.model.name}</p>
                            </Link>
                        )}
                    </>
                )}
            </div>
            <Link
                to={`/model/${data.model_id}/library/prototype/${data.id}/view/${
                    isCacheType(type, data) ? data.page || "journey" : "journey"
                }`}
                className="h-full w-full flex flex-col"
            >
                {data.image_file ? (
                    <img
                        src={data.image_file}
                        className="flex-1 max-h-[280px] aspect-video min-h-[100px] w-full object-cover rounded-xl"
                    />
                ) : (
                    <div
                        style={{
                            background:
                                "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 20px, #f3f4f6 10px, #f3f4f6 50px)",
                        }}
                        className="flex-1 flex bg-black aspect-video rounded-xl max-h-[280px] min-h-[100px] w-full select-none object-cover text-base text-gray-400 justify-center items-center"
                    >
                        No Image Attached
                    </div>
                )}
                <div className="flex-shrink-0 h-[112px] mt-3">
                    <div className="flex items-center gap-3">
                        <h3 className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-black mr-auto text-lg font-bold">
                            {data.name}
                        </h3>
                        {!isNaN(avg) && (
                            <Tooltip title="Average rating">
                                <button className="text-slate-700 flex items-center">
                                    <TbStar /> <span className="text-[13px]">{avg}</span>
                                </button>
                            </Tooltip>
                        )}
                        {isCacheType(type, data) && data.executedTimes ? (
                            <Tooltip title="Executed times">
                                <button className="text-slate-700 flex gap-1 items-center">
                                    <TbTerminal2 />{" "}
                                    <span className="text-[13px]">
                                        {Intl.NumberFormat("en-US", {
                                            notation: "compact",
                                            maximumFractionDigits: 1,
                                        }).format(data.executedTimes)}
                                    </span>
                                </button>
                            </Tooltip>
                        ) : null}
                    </div>
                    {(data.description.problem ||
                        data.description.says_who ||
                        data.description.solution ||
                        data.description.status) && (
                        <p className="text-gray-700 mt-2 lines-ellipsis text-sm">
                            {data.description.problem} {data.description.solution}
                        </p>
                    )}
                    {isCacheType(type, data) && data.time && (
                        <p className="text-xs mt-2 text-gray-600">Opened {dayjs(data.time).fromNow()}</p>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default PrototypeCard;
