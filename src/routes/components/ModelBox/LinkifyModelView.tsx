import { ImagePin, Model, ModelView } from "../../../apis/models";
import { ImagePinWithLink } from "./three/main";

const LinkifyModelView = (model: Model, api: string): ModelView<ImagePinWithLink> => {
    const model_view = model.model_files[api];
    return {
        glb_file: model_view.glb_file,
        image_file: model_view.image_file,
        pins: Object.fromEntries(
            Object.entries(model_view.pins ?? {}).map(([api, pin]) => [
                api,
                {
                    x: pin.x,
                    y: pin.y,
                    link: `/model/${model.id}/cvi/list/${api}`,
                },
            ])
        ),
    };
};

export default LinkifyModelView;
