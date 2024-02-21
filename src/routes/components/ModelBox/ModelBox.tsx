import { useEffect, useRef } from "react";
import copyText from "../../../reusable/copyText";
import onLoad from "./onLoad";
import { PerspectiveCamera } from "./three/three.module";
import { OrbitControls } from "./three/controls/OrbitControls";
import { CameraCoordinates } from "../../models";
import { forever } from "../../../reusable/functions";
import "./styles.module.scss";
import { ImagePin, ModelView } from "../../../apis/models";
import { useNavigate } from "react-router-dom";

interface ModelBoxProps {
    model_view: ModelView<
        ImagePin & {
            link: string;
        }
    >;
    coordinates?: CameraCoordinates;
}

const ModelBox = ({ model_view, coordinates }: ModelBoxProps) => {
    const loadingPromise = useRef<Promise<[PerspectiveCamera, OrbitControls]>>(forever() as any);
    const navigate = useNavigate();

    useEffect(() => {
        const desctructorPromise = (async () => {
            loadingPromise.current = onLoad(navigate, model_view);
            const [camera, controls] = await loadingPromise.current;

            const CopyCoordinates = (event: KeyboardEvent) => {
                const isCmdI = event.key.toLowerCase() === "i" && (event.ctrlKey || event.metaKey);
                if (isCmdI) {
                    const coordinates: CameraCoordinates = {
                        camera: (camera as any).position,
                        controls: controls.target,
                    };
                    copyText(JSON.stringify(coordinates), "Copied coordinates!");
                }
            };

            window.addEventListener("keydown", CopyCoordinates);

            return () => {
                window.removeEventListener("keydown", CopyCoordinates);
            };
        })();

        return () => {
            desctructorPromise.then((destructor) => destructor());
        };
    }, [JSON.stringify(model_view)]);

    useEffect(() => {
        (async () => {
            if (typeof coordinates === "undefined") return;

            const [camera, controls] = await loadingPromise.current;
            if (typeof camera === "undefined" || typeof controls === "undefined") return;
            (camera as any).position.set(coordinates.camera.x, coordinates.camera.y, coordinates.camera.z);
            controls.target.set(coordinates.controls.x, coordinates.controls.y, coordinates.controls.z);
            controls.update();
        })();
    }, [JSON.stringify(coordinates)]);

    return (
        <>
            <div
                className="flex h-full w-full bg-gray-100 items-center justify-center text-slate-400 select-none overflow-visible relative bg-white"
                id="model-box"
            ></div>
        </>
    );
};

export default ModelBox;
