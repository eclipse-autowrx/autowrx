import { createContext, useContext } from "react";
import { Prototype } from "../apis/models";

export const Context = createContext<Prototype | undefined>(undefined);

export const CurrentPrototypeProvider = Context.Provider

const useCurrentPrototype = () => {
    const prototype = useContext(Context)
    return prototype
}

export default useCurrentPrototype