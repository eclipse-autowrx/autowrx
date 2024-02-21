import { createContext, useContext } from "react";
import { Model } from "../../apis/models";

export const Context = createContext<Model[]>(undefined as any);

export const CurrentTenantModelsProvider = Context.Provider;

export const useCurrentTenantModels = () => {
    const models = useContext(Context);
    return models;
};
