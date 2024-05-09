import UserProfile from "./UserProfile";
import { HiStar } from "react-icons/hi";
import NoPrototypeDisplay from "./NoPrototypeDisplay";
import Button from "../../../reusable/Button";
import LinkWrap from "../../../reusable/LinkWrap";
import { VscDebugStart, VscEdit } from "react-icons/vsc";
import { BsPlayFill } from "react-icons/bs";
import { Prototype } from "../../../apis/models";
import DisplayImage from "./DisplayImage";
import { getLinkedPluginFromPrototype } from "../../../apis";
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh";
import { useState, useEffect } from "react";
import axios from "axios";
import Rating from "react-rating";
import CustomSelect from "../../../reusable/ReportTools/CustomSelect";
import {
    TbChevronsUp,
    TbChevronUp,
    TbChevronsDown,
    TbChevronDown,
    TbDeviceDesktopCode,
    TbDeviceDesktopCheck,
    TbArrowUpRight,
} from "react-icons/tb";
import { LiaGripLinesSolid } from "react-icons/lia";
import { FiArrowRight } from "react-icons/fi";
import CustomDisplayImage from "./CustomDisplayImage";

interface DisplayDescriptionProps {
    name: string;
    value?: string;
}

const DisplayDescription = ({ name, value }: DisplayDescriptionProps) => {
    return (
        <tr>
            <td className="w-32 font-bold select-none pr-2 py-1 whitespace-nowrap text-gray-800">{name}</td>
            <td className="text-gray-700 first-letter:uppercase" style={{ whiteSpace: "break-spaces" }}>
                {value}
            </td>
        </tr>
    );
};

interface PrototypeDisplayProps {
    prototype: Prototype;
}

export const complexityOptions = [
    { value: 5, label: "Highest", icon: <TbChevronsUp className="w-4 h-4 text-red-500" /> },
    { value: 4, label: "High", icon: <TbChevronUp className="w-4 h-4 text-orange-500" /> },
    { value: 3, label: "Medium", icon: <LiaGripLinesSolid className="w-4 h-4 text-yellow-500" /> },
    { value: 2, label: "Low", icon: <TbChevronDown className="w-4 h-4 text-green-500" /> },
    { value: 1, label: "Lowest", icon: <TbChevronsDown className="w-4 h-4 text-blue-500" /> },
];

export const statusOptions = [
    { value: "development", label: "Developing", icon: <TbDeviceDesktopCode className="w-4 h-4 text-aiot-blue" /> },
    { value: "released", label: "Released", icon: <TbDeviceDesktopCheck className="w-4 h-4 text-aiot-green-ml" /> },
];

const PrototypeDisplay = ({ prototype }: PrototypeDisplayProps) => {
    const RatingComponent = Rating as any;
    const [rating, setRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [height, setHeight] = useState(450);

    const updateHeightBasedOnWidth = () => {
        const windowWidth = window.innerWidth;

        if (windowWidth > 1500) {
            setHeight(450);
        } else {
            setHeight(270);
        }
    };

    useEffect(() => {
        updateHeightBasedOnWidth(); // Call once initially to set height

        // Set up event listener to adjust height based on window width
        window.addEventListener("resize", updateHeightBasedOnWidth);

        return () => {
            // Clean up event listener
            window.removeEventListener("resize", updateHeightBasedOnWidth);
        };
    }, []);

    const fetchRatingInfo = async (prototypeId: string) => {
        if (!prototypeId) return;
        setRatingCount(0);
        setRating(0);
        try {
            let res = await axios.get(`/.netlify/functions/listFeedback?masterType=Prototype&&masterId=${prototypeId}`);
            // console.log("listFeedback", res.data)
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                let rateValue =
                    res.data.map((f: any) => f.avg_score).reduce((partialSum, a) => partialSum + a, 0) /
                    res.data.length;
                setRatingCount(res.data.length);
                setRating(rateValue);
            } else {
                setRatingCount(0);
                setRating(0);
            }
            // console.log(res.data)
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (!prototype) {
            setRating(0);
            setRatingCount(0);
        }
        fetchRatingInfo(prototype.id);
        // console.log("prototype", prototype.apis)
    }, [prototype]);

    const { value: plugin } = useAsyncRefresh(async () => {
        return await getLinkedPluginFromPrototype(prototype.model_id, prototype.id);
    });

    return typeof prototype === "undefined" ? (
        <NoPrototypeDisplay />
    ) : (
        <div className="flex flex-col">
            <div className="flex w-full h-full p-0">
                {/* <DisplayImage image_file={prototype.image_file} maxHeight={400} /> */}
                <CustomDisplayImage image_file={prototype.image_file} minHeight={height} />
            </div>
            {typeof plugin !== "undefined" && (
                <LinkWrap to={`/model/:model_id/plugins/plugin/${plugin.id}`}>
                    <div className="bg-violet-700 text-white px-3 py-2 select-none">
                        <strong>Plugin: {plugin.name}</strong>
                    </div>
                </LinkWrap>
            )}
            <div className="relative flex flex-col p-5">
                <div className="flex absolute top-6 right-4 select-none items-center">
                    <LinkWrap to={`/model/:model_id/library/prototype/${prototype.id}/view`} className="">
                        <Button className="text-[0.7rem] px-[0.5rem] py-[0.25rem] bg-aiot-blue hover:bg-aiot-blue/90 text-white font-bold">
                            <div className="text-sm pr-1 ml-1">Open</div>
                            <FiArrowRight className="w-4 h-4" />
                        </Button>
                    </LinkWrap>
                </div>

                <div className="flex">
                    {/* <div className="inline-block text-center text-3xl font-bold capitalize bg-gradient-to-r 
                      from-aiot-blue to-aiot-blue-l bg-clip-text text-transparent mb-3">{prototype.name}</div> */}
                    <div className="inline-block text-center text-2xl font-bold capitalize text-gray-600 mb-1">
                        {prototype.name}
                    </div>
                </div>
                <div className="mb-4 w-fit">
                    <UserProfile customStyle="text-gray-700" user_uid={prototype.created.user_uid} clickable={true} />
                </div>
                <table className="table-auto leading-relaxed">
                    <tbody>
                        <DisplayDescription name="Problem" value={prototype.description.problem} />
                        <DisplayDescription name="Says who?" value={prototype.description.says_who} />
                        <DisplayDescription name="Solution" value={prototype.description.solution} />
                        {/* <DisplayDescription name="Status" value={prototype.state || 'development'} /> */}
                        <tr>
                            <td className="font-bold select-none pr-6 py-1 whitespace-nowrap align-top text-gray-800">
                                Status
                            </td>
                            <td>
                                <CustomSelect
                                    options={statusOptions}
                                    selectedValue={prototype.state || "development"}
                                    isReadOnly={true} // Set as readonly
                                    customStyle="shadow-none text-gray-700 p-0"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="font-bold select-none pr-6 py-1 whitespace-nowrap align-top text-gray-800">
                                Complexity
                            </td>
                            <td>
                                <CustomSelect
                                    options={complexityOptions}
                                    selectedValue={prototype.complexity_level || 1}
                                    isReadOnly={true} // Set as readonly
                                    customStyle="shadow-none text-gray-700 p-0"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                {/* <div className="text-lg">{prototype.scription}</div> */}
                <div className="flex w-full mt-4 mb-4 items-center">
                    <div className="flex items-center justify-center mt-1">
                        <RatingComponent
                            className="flex w-full h-full "
                            readonly
                            emptySymbol={<HiStar className="text-slate-300" size={28} />}
                            initialRating={rating}
                            fullSymbol={<HiStar className="text-[#FFDB58]" size={28} />}
                        />
                        <div className="pl-1 pb-1 text-sm text-slate-400">({ratingCount})</div>
                    </div>
                    <LinkWrap to={`/model/:model_id/library/prototype/${prototype.id}/view/feedback`}>
                        <Button className="ml-5 h-7 text-xs font-bold uppercase px-2 py-1 bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-600">
                            View End-User Feedback
                            <TbArrowUpRight className="w-4 h-4 ml-1"></TbArrowUpRight>
                        </Button>
                    </LinkWrap>
                </div>
                <div className="flex flex-col">
                    <div className="mb-3 mr-2 text-gray-700">
                        <strong>Connected Vehicle Interfaces</strong> used by this prototype:
                    </div>
                    <table>
                        <tbody>
                            {Object.entries(prototype.apis)
                                .filter(([prototype_type, apis]) => prototype_type !== "VSC")
                                .map(([prototype_type, apis]) => (
                                    <tr className="" key={prototype_type}>
                                        <td className="pr-2 align-top text-xl text-gray-700 pt-1.5 w-12">
                                            {prototype_type}
                                        </td>
                                        <td className="align-top">
                                            <div className="flex flex-wrap text-xs">
                                                {apis.map((api) => {
                                                    const key =
                                                        typeof api === "string" ? api : (api as { name: string }).name;
                                                    return (
                                                        <div
                                                            key={key}
                                                            className="rounded-md bg-aiot-blue text-white mt-2 mr-2 py-0.5 px-3 select-none text-sm"
                                                        >
                                                            {key}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PrototypeDisplay;
