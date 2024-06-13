import useModelStore from "@/stores/modelStore"
import { shallow } from "zustand/shallow";
import useGetModel from "@/hooks/useGetModel";
import useGetPrototype from "@/hooks/useGetPrototype";
import { useEffect, FC } from "react";
import { Model, Prototype } from "@/types/model.type";
import { useParams } from "react-router-dom";

const ActiveObjectManagement : FC = () => {
    const { model_id = "", prototype_id= "" } = useParams();
    const [setActiveModel, setActivePrototype] = useModelStore(
        (state) => [state.setActiveModel, state.setActivePrototype],
        shallow
    );

    const { data: fetchedModel } = useGetModel(model_id || '');
    const { data: fetchedPrototype } = useGetPrototype(prototype_id || '');

    useEffect(() => {
        setActiveModel(fetchedModel as Model)
    }, [fetchedModel])

    useEffect(() => {
        setActivePrototype(fetchedPrototype as Prototype)
    }, [fetchedPrototype])

  return <span></span>
}

export default ActiveObjectManagement
