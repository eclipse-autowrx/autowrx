import clsx from "clsx";
import Button from "../../reusable/Button";
import useAsyncRefresh from "../../reusable/hooks/useAsyncRefresh";
import LoadingPage from "../components/LoadingPage";
import MediaDisplay from "./MediaDisplay";
import { FiUpload } from "react-icons/fi";
import { CircularProgress } from "@mui/material";
import generateMediaChange from "./generateMediaChange";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { getStorageRef, REFS } from "../../apis/firebase";
import { doc } from "firebase/firestore";
import { deleteObject } from "firebase/storage";
import { deleteField, FieldPath, updateDoc } from "firebase/firestore";
import FlexibleGrid from "../../reusable/FlexibleGrid";
import { getMedia } from "../../apis";
import { TENANT_ID } from "../../constants";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import Paginate from "../../reusable/Paginate/Paginate";
import Input from "../../reusable/Input/Input";
import { HiPlus, HiSearch, HiX } from "react-icons/hi";
import { MediaFile } from "../../apis/models";

const Media = () => {
    const [progress, setProgress] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const { isLoggedIn } = useCurrentUser();

    const [itemsOffset, setItemsOffset] = useState(0);
    const itemsPerPage = 9; // 3 rows with 5 items each

    // state for search input
    const [search, setSearch] = useState("");

    // // fetch media library
    // const { value: mediaLibrary, loading } = useAsyncRefresh(async () => {
    //   return await getMedia();
    // }, [refreshCounter]);

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

    // effect for resetting pagination when searching
    useEffect(() => {
        setItemsOffset(0);
    }, [search]);

    // Filter the media items based on search input
    const filteredMedia = useMemo(() => {
        if (search === "") {
            return Object.values(mediaLibrary || {});
        }
        return Object.values(mediaLibrary || {}).filter((media) =>
            media.filename.toLowerCase().includes(search.toLowerCase())
        );
    }, [mediaLibrary, search]);

    // Calculate the current items to be displayed.
    const currentItems = useMemo(
        () => filteredMedia.slice(itemsOffset, itemsOffset + itemsPerPage),
        [filteredMedia, itemsOffset]
    );

    const triggerUploadMedia = () => {
        inputRef.current?.click();
    };

    const changeMediaInput = generateMediaChange({
        setProgress,
        refreshCounter,
        setRefreshCounter,
    });

    const deleteMedia = useCallback(
        async (filename: string) => {
            updateDoc(doc(REFS.media, TENANT_ID), new FieldPath("media", filename), deleteField());
            const storageRef = getStorageRef(`media/${filename}`);
            await deleteObject(storageRef);
            setRefreshCounter(refreshCounter + 1);
        },
        [refreshCounter]
    );

    // If loading or no media yet, display loading.
    if (loading || !mediaLibrary) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col">
            <input
                type="file"
                style={{ display: "none" }}
                ref={inputRef}
                accept=".png,.jpg,.jpeg,.glb"
                onChange={changeMediaInput}
            />
            {isLoggedIn && (
                <div className="flex flex-col items-center mb-3 mt-10">
                    <div className="inline-flex justify-center items-center w-full">
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
                                <div className="inline-flex justify-center items-center text-white text-xs">
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
            )}

            <FlexibleGrid>
                {currentItems.map((media) => (
                    <MediaDisplay
                        key={media.filename}
                        deleteMedia={(filename) => deleteMedia(filename)}
                        type={media.type}
                        filename={media.filename}
                        url={media.imageUrl}
                    />
                ))}
            </FlexibleGrid>

            <div className="mb-5">
                <Paginate
                    itemsPerPage={itemsPerPage} //Constant value that determines how many items should be displayed on a single page
                    items={filteredMedia}
                    setItemsOffset={setItemsOffset} //starting index for the slice of items that should be displayed on the current page.
                />
            </div>
        </div>
    );
};

export default Media;
