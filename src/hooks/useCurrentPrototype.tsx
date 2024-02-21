import { createContext, useContext } from "react";
import { Prototype, PrototypeGetSet } from "../apis/models";

export const Context = createContext<PrototypeGetSet | undefined | null>(undefined);

export const CurrentPrototypeProvider = Context.Provider;

const useCurrentPrototype = () => {
    const protoSetGet = useContext(Context);
    return protoSetGet?.prototype;
};

export const useCurrentPrototypeGetSet = () => {
    const protoSetGet = useContext(Context);
    return protoSetGet;
};

export default useCurrentPrototype;
