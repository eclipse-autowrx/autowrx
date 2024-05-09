import LinkWrap from "../../reusable/LinkWrap";
import DisplayImage from "../components/PrototypeOverview/DisplayImage";
import { useState, useEffect } from "react";
import { TbChevronLeft, TbChevronRight, TbTag } from "react-icons/tb";
import useAccessiblePrototypes from "../../reusable/hooks/useAccessiblePrototypes";
import { SlTag } from "react-icons/sl";
import { FaCircleCheck } from "react-icons/fa6";
import axios from "axios";
import PersonalizeRelevance from "./PersonalizeRelevance";

const DemoSection = () => {
    const ITEMS_PER_PAGE = 8;
    const [loading, setLoading] = useState<boolean>(true);

    const [prototypes, setPrototypes] = useState<any[]>([]);
    const [releasedPrototypes, setReleasedPrototypes] = useState<any[]>([]);
    const [allPrototypes, setAllPrototypes] = useState<any[]>([]);
    const { prototypes: accessiblePrototypes } = useAccessiblePrototypes();
    const [displayedPrototypes, setDisplayPrototpes] = useState<any[]>([]);

    const [maxPage, setMaxPage] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [filterTags, setFilterTags] = useState<string[]>([]);

    useEffect(() => {
        if (prototypes.length > 0) {
            setMaxPage(Math.ceil(prototypes.length / ITEMS_PER_PAGE));
        } else {
            setMaxPage(0);
        }
    }, [prototypes]);

    const fetchReleasedPrototypes = async () => {
        try {
            let res = await axios.get(`/.netlify/functions/listReleasesPrototypes`);
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                setReleasedPrototypes(res.data);
            }
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        console.log(`DemoSection mounted`);
        fetchReleasedPrototypes();
    }, []);

    useEffect(() => {
        let tmpAllPrototypes = [...accessiblePrototypes];
        let existIDs = accessiblePrototypes.map((p) => p.id);
        if (releasedPrototypes && releasedPrototypes.length > 0) {
            releasedPrototypes.forEach((prototype) => {
                if (!existIDs.includes(prototype.id)) {
                    tmpAllPrototypes.push(prototype);
                }
            });
        }

        setAllPrototypes(tmpAllPrototypes);
    }, [accessiblePrototypes, releasedPrototypes]);

    const toggleFilterTag = (tag: string) => {
        setFilterTags((currentTags) => {
            const tagLower = tag.toLowerCase();
            if (currentTags.includes(tagLower)) {
                return currentTags.filter((t) => t !== tagLower);
            } else {
                return [...currentTags, tagLower];
            }
        });
        setCurrentPage(0);
    };

    useEffect(() => {
        let filtered = allPrototypes;

        if (filterTags.length > 0 && allPrototypes.length > 0) {
            filtered = allPrototypes.filter((prototype) => {
                return (
                    Array.isArray(prototype.tags) &&
                    prototype.tags.some((tagObj) => {
                        return filterTags.includes(tagObj.tag.toLowerCase());
                    })
                );
            });
        } else {
            filtered = releasedPrototypes || [];
        }

        setPrototypes(filtered);
    }, [filterTags, allPrototypes, releasedPrototypes]);

    useEffect(() => {
        if (!prototypes || prototypes.length === 0) {
            setDisplayPrototpes([]);
            return;
        }
        let tmpDisplayPrototypes = prototypes.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
        setDisplayPrototpes(tmpDisplayPrototypes);
    }, [currentPage, maxPage, prototypes]);

    const handleLeftChevronClick = () => {
        if (currentPage === 0) {
            setCurrentPage(maxPage - 1);
        } else {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleRightChevronClick = () => {
        if (currentPage === maxPage - 1) {
            setCurrentPage(0);
        } else {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex w-full h-full items-center justify-center flex-col overflow-y-auto scroll-gray">
            <div className=" w-full h-auto text-2xl font-bold text-aiot-blue text-center mb-4">Prototype Gallery</div>
            <div className="flex justify-center space-x-4 mb-6">
                {["LandingAI", "Mercedes", "Mobis", "Ansys"].map((tag) => {
                    const tagLower = tag.toLowerCase();
                    return (
                        <button
                            key={tag}
                            className={`min-w-[140px] rounded-full text-[14px] px-2 py-0.5 shadow-sm flex items-center border ${
                                filterTags.includes(tagLower)
                                    ? "border-aiot-blue font-bold text-aiot-blue"
                                    : "group border-gray-300 text-gray-400 hover:border-aiot-blue hover:text-aiot-blue hover:bg-aiot-blue/5"
                            }`}
                            onClick={() => toggleFilterTag(tag)}
                        >
                            <SlTag size={16} />
                            <div className="mx-2 grow">{tag}</div>
                            {filterTags.includes(tagLower) && <FaCircleCheck size={18} />}
                        </button>
                    );
                })}
            </div>
            <div className="flex w-full h-3/4">
                <div className={`flex justify-center items-center mx-8 ${maxPage <= 1 ? "invisible" : ""}`}>
                    <div
                        onClick={handleLeftChevronClick}
                        className="flex w-10 h-10 bg-gray-200 items-center justify-center rounded-full hover:bg-gray-300 group cursor-pointer"
                    >
                        <TbChevronLeft
                            className="text-gray-500 w-8 h-8 group-hover:text-gray-800"
                            style={{ strokeWidth: 2.5 }}
                        />
                    </div>
                </div>
                <div className="flex h-full w-full overflow-auto">
                    {prototypes.length === 0 && (
                        <div className="grid place-items-center w-full h-full rounded-lg overflow-hidden select-none border border-gray-200 hover:border-aiot-blue transition duration-300">
                            <div
                                className="flex-none items-center px-2 pt-1.5 pb-1 truncate
                                overflow-hidden text-xl md:text-2xl font-semibold text-gray-300 leading-tight"
                            >
                                {loading ? "Loading..." : "No prototypes found"}
                            </div>
                        </div>
                    )}
                    {displayedPrototypes && displayedPrototypes.length > 0 && (
                        <div className="grid grid-cols-4 gap-6 grid-rows-2">
                            {displayedPrototypes.map((prototype) => (
                                <LinkWrap
                                    key={prototype.id}
                                    to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view/journey`}
                                >
                                    <div className="flex flex-col w-full h-full rounded-lg overflow-hidden select-none border border-gray-200 hover:border-aiot-blue">
                                        <div className="flex-none items-center px-2 pt-1.5 pb-1 truncate overflow-hidden md:text-md lg:text-sm text-lg font-bold text-aiot-blue leading-tight">
                                            {prototype.name}
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <DisplayImage image_file={prototype.image_file} objectFit="cover" />
                                        </div>
                                    </div>
                                </LinkWrap>
                            ))}
                        </div>
                    )}
                </div>
                <div className={`flex justify-center items-center mx-8 ${maxPage <= 1 ? "invisible" : ""}`}>
                    <div
                        onClick={handleRightChevronClick}
                        className="flex w-10 h-10 bg-gray-200 items-center justify-center rounded-full hover:bg-gray-300 group cursor-pointer"
                    >
                        <TbChevronRight
                            className="text-gray-500 w-8 h-8 group-hover:text-gray-800"
                            style={{ strokeWidth: 2.5 }}
                        />
                    </div>
                </div>
            </div>

            {maxPage > 1 && (
                <div className="flex w-full justify-center items-center space-x-4 mt-6 select-none">
                    {Array.from({ length: maxPage }).map((_, index) => {
                        return (
                            <div
                                key={index}
                                onClick={() => handlePageClick(index)}
                                className={`flex w-10 h-10 ${
                                    currentPage === index ? "bg-aiot-blue" : "bg-gray-400 hover:bg-gray-300 "
                                }
                                items-center justify-center rounded-full text-lg text-white font-bold cursor-pointer `}
                            >
                                {index + 1}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DemoSection;
