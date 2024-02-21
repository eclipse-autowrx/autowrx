import clsx from "clsx";
import { FC, useState } from "react";
import { ImagePin, MediaFile, Model } from "../../../apis/models";
import Button from "../../../reusable/Button";
import { useCurrentModel } from "../../../reusable/hooks/useCurrentModel";
import Pin from "./Pin";
import { HiPlus } from "react-icons/hi";
import Select from "../../../reusable/Select";
import { MdWrongLocation } from "react-icons/md";
import getFlattenedApis from "../CVIViewer/getFlattenedApis";

const getPinCoordinates = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
    const [xPerc, yPerc] = [Math.max(x / rect.width, 0) * 100, Math.max(y / rect.height, 0) * 100];
    return {
        x: xPerc,
        y: yPerc,
    };
};

export interface ImagePins {
    [api: string]: ImagePin;
}

interface SelectPinsOnImageProps {
    image: MediaFile;
    pinsState: [ImagePins, React.Dispatch<React.SetStateAction<ImagePins>>];
}
const SelectPinsOnImage: FC<SelectPinsOnImageProps> = ({ image, pinsState: [pins, setPins] }) => {
    const [selectingApi, setSelectingApi] = useState<string | null>(null);
    const model = useCurrentModel() as Model;

    const apis = getFlattenedApis(model);

    return (
        <div className="flex flex-col">
            <div
                className={clsx("relative flex mb-4", selectingApi !== null && "cursor-crosshair")}
                onClick={
                    selectingApi === null
                        ? undefined
                        : (e) => {
                              const clonedPins = JSON.parse(JSON.stringify(pins)) as ImagePins;
                              clonedPins[selectingApi] = getPinCoordinates(e);
                              setPins(clonedPins);
                              setSelectingApi(null);
                          }
                }
            >
                <img
                    src={image.imageUrl}
                    alt={image.filename}
                    className="h-full"
                    style={{ objectFit: "contain", maxHeight: 250 }}
                />
                {Object.entries(pins).map(([api, pin]) => (
                    <Pin pin={pin} link={`/model/${model.id}/cvi/list/${api}`} />
                ))}
            </div>
            <div className="flex flex-col mb-2">
                {Object.entries(pins).map(([api, pin]) => (
                    <div className="flex items-center text-lg py-0">
                        <div className="text-md text-gray-500 font-bold">{api}</div>
                        <Button
                            className="py-2 ml-auto"
                            onClick={() => {
                                const clonedPins = JSON.parse(JSON.stringify(pins)) as ImagePins;
                                delete clonedPins[api];
                                setPins(clonedPins);
                            }}
                        >
                            <MdWrongLocation color="#c92a2a" className="ml-auto" style={{ transform: "scale(1.1)" }} />
                        </Button>
                    </div>
                ))}
            </div>
            {selectingApi === null ? (
                <div
                    className="relative h-9 flex w-fit px-2 select-none rounded transition cursor-pointer border border-gray-300 hover:border-aiot-blue mr-3"
                    onClick={() => setSelectingApi(apis[0])}
                >
                    <HiPlus className="h-full w-fit text-aiot-blue" style={{ transform: "scale(0.6)" }} />
                    <div className="mr-2 my-auto text-aiot-blue">Add Pin</div>
                </div>
            ) : (
                <div className="text-lg text-gray-700 font-bold">
                    <Select
                        state={[selectingApi, (newValue) => setSelectingApi(newValue as string)]}
                        options={apis.map((name) => ({
                            name,
                            value: name,
                        }))}
                    />
                </div>
            )}
        </div>
    );
};

export default SelectPinsOnImage;
