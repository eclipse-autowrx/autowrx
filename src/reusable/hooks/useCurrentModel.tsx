import { createContext, useContext } from "react";
import { Model } from "../../apis/models";

export const Context = createContext<Model | undefined>(undefined);

export const CurrentModelProvider = Context.Provider

export const useCurrentModel = () => {
    const model = useContext(Context)
    return model
}