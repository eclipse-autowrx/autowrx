import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh";
import Popup from "../../../reusable/Popup/Popup";
import { ImagePin, Media as MediaModel, MediaFile } from "../../../apis/models";
import FlexibleGrid from "../../../reusable/FlexibleGrid";
import MediaDisplay from "../../Media/MediaDisplay";
import LoadingPage from "../LoadingPage";
import { FC, useState, useEffect, useMemo, useRef } from "react";
import SideNav from "../../../reusable/SideNav/SideNav";
import SelectImagePin from "./SelectImagePin";
import { ImagePins } from "./SelectPinsOnImage";
import clsx from "clsx";
import LinkWrap from "../../../reusable/LinkWrap";
import { HiPlus, HiSearch, HiX } from "react-icons/hi";
import { getMedia } from "../../../apis";
import Paginate from "../../../reusable/Paginate/Paginate";
import Input from "../../../reusable/Input/Input";
import Button from "../../../reusable/Button";
import { CircularProgress } from "@mui/material";
import { FiUpload } from "react-icons/fi";
import generateMediaChange from "../../Media/generateMediaChange";

interface SelectMediaProps {
    trigger?: React.ReactElement;
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    selectMedia: (filename: MediaFile, pins?: ImagePins) => Promise<void>;
    filter?: ("model" | "image")[];
    supportPins?: boolean;
}

const SelectMedia: FC<SelectMediaProps> = ({
    trigger,
    state: statePassed,
    selectMedia,
    filter,
    supportPins = false,
}) => {
    const selfManaged = useState(false);
    const state = statePassed ?? selfManaged;
    const inputRef = useRef<HTMLInputElement>(null);

    // Declare the itemsOffset state
    const [itemsOffset, setItemsOffset] = useState(0);
    const itemsPerPage = 12;

    // State for media upload progress
    const [progress, setProgress] = useState<number | null>(null);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [newMediaUpload, onNewMediaUpload] = useState<MediaFile | null>(null);
    // Function to handle media input change
    const changeMediaInput = generateMediaChange({
        setProgress,
        refreshCounter,
        setRefreshCounter,
        onNewMediaUpload,
    });
    // selectMedia(newImageUrl) when newImageUrl is not null
    useEffect(() => {
        if (newMediaUpload !== null) {
            selectMedia(newMediaUpload);
        }
    }, [newMediaUpload]);

    // State for media library
    const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch media library
    const fetchMediaLibrary = async () => {
        setLoading(true);
        const data = await getMedia();
        setMediaLibrary(data);
        setLoading(false);
    };
    // refreshCounter is used to refresh the media library when a new media is uploaded
    useEffect(() => {
        fetchMediaLibrary();
    }, [refreshCounter]);

    // Declare the counter state
    const [scrollToTopCounter, setScrollToTopCounter] = useState(0);

    // In the useEffect that updates itemsOffset, increment the counter
    useEffect(() => {
        setScrollToTopCounter((prevCounter) => prevCounter + 1);
    }, [itemsOffset]);

    // State for search input
    const [search, setSearch] = useState("");

    // Filter the media items based on search input
    const filteredLibrary = useMemo(() => {
        if (search === "") {
            return mediaLibrary ?? []; // return empty array if mediaLibrary is undefined
        }
        return (
            mediaLibrary?.filter(
                (
                    media // filter mediaLibrary if it is defined
                ) => media.filename.toLowerCase().includes(search.toLowerCase())
            ) || []
        );
    }, [mediaLibrary, search, filter]);

    // Calculate the current items to be displayed.
    const currentItems = useMemo(() => {
        return filteredLibrary.slice(itemsOffset, itemsOffset + itemsPerPage);
    }, [filteredLibrary, itemsOffset, itemsPerPage]);

    const selectPinNav = useState(false);
    const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

    const handleClick = (media: MediaFile) => {
        if (selectedMedia?.filename !== media.filename) {
            setSelectedMedia(media);
        }
        if (media.type === "image") {
            if (supportPins) {
                state[1](false);
                selectPinNav[1](true);
                setSelectedImage(media);
                console.log("selected image", media);
            } else {
                state[1](false);
                selectMedia(media);
                console.log("selected image", media);
            }
        } else {
            state[1](false);
            selectMedia(media);
        }
    };
    const triggerUploadMedia = () => {
        inputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                style={{ display: "none" }}
                ref={inputRef}
                accept=".png,.jpg,.jpeg,.glb"
                onChange={changeMediaInput}
            />
            <SelectImagePin selectPinNav={selectPinNav} selectedImage={selectedImage} selectMedia={selectMedia} />
            <SideNav
                width="800px"
                trigger={typeof trigger === "undefined" ? <></> : trigger}
                state={state}
                scrollToTopTrigger={scrollToTopCounter}
            >
                {loading ? (
                    <div
                        className="flex flex-col w-full h-screen items-center justify-center pt-36"
                        style={{ width: 800 }}
                    >
                        <LoadingPage />
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-col items-center">
                            <div className="w-full inline-flex justify-center items-center mt-8">
                                <div className="w-72 h-10 mr-3">
                                    <Input
                                        iconSize={24}
                                        iconBefore
                                        containerClassName="rounded shadow text-sm font-semibold bg-white"
                                        state={[search, setSearch]}
                                        placeholder="Search"
                                        Icon={search === "" ? HiSearch : HiX}
                                        IconOnClick={
                                            search === ""
                                                ? undefined
                                                : () => {
                                                      setSearch("");
                                                  }
                                        }
                                    />
                                </div>
                                <Button
                                    className={clsx("w-fit h-10 py-2 px-3", progress !== null && "pointer-events-none")}
                                    variant="aiot-gradient"
                                    onClick={triggerUploadMedia}
                                >
                                    {progress === null ? (
                                        <div className="inline-flex justify-center items-center text-white text-xs font-semibold">
                                            <FiUpload className="mr-2 h-4 w-auto" />
                                            Upload Media
                                        </div>
                                    ) : (
                                        <>
                                            <CircularProgress
                                                variant="determinate"
                                                value={progress}
                                                size={20}
                                                style={{ color: "#ffffff" }}
                                                className="mr-2"
                                            />
                                            <span className="text-white text-xs font-semibold">Uploading</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <FlexibleGrid>
                            {typeof mediaLibrary === "undefined" ? (
                                []
                            ) : (
                                <>
                                    {currentItems.map((media) => (
                                        <MediaDisplay
                                            key={media.filename}
                                            type={media.type}
                                            filename={media.filename}
                                            url={media.imageUrl}
                                            onClick={() => handleClick(media)}
                                        />
                                    ))}
                                </>
                            )}
                        </FlexibleGrid>
                        <div className="mb-10">
                            <Paginate
                                itemsPerPage={itemsPerPage}
                                items={filteredLibrary}
                                setItemsOffset={setItemsOffset}
                            />
                        </div>
                    </div>
                )}
            </SideNav>
        </>
    );
};

export default SelectMedia;
