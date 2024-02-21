import { createContext, useContext } from "react";
import { TagCategory } from "../../apis/models";

export const Context = createContext<TagCategory[]>(undefined as any);

export const CurrentTenantTagCategoriesProvider = Context.Provider;

export const useCurrentTenantTagCategories = () => {
    const models = useContext(Context);
    return models;
};
