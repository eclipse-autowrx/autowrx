import { NavigateFunction } from "react-router-dom";
import { ModelView } from "../../../apis/models";
import RenderThree, { ImagePinWithLink } from "./three/main";

const onLoad = async (navigate: NavigateFunction, model_view: ModelView<ImagePinWithLink>) => {
    return await RenderThree(
        navigate,
        model_view.glb_file,
        model_view.image_file,
        {
            camera: {
                x: -3.0614744792208244,
                y: 1.407324960883167,
                z: 5.3030347861125104,
            },
            controls: {
                x: 0.8625448253671973,
                y: 0.5754417652367833,
                z: 0.5038116358493872,
            },
        },
        Object.entries(model_view.pins ?? {}).map(([api, pin]) => pin)
    );
};

export default onLoad;
