import { createContext, useContext } from "react";
import { CurrentUserInterface } from "./useLoadCurrentUser";

const CurrentUserAndProfileContext = createContext<CurrentUserInterface | null>(null);

export const CurrentUserAndProfileProvider = CurrentUserAndProfileContext.Provider;

const useCurrentUser = () => {
    const currentUser = useContext(CurrentUserAndProfileContext) as CurrentUserInterface;
    return currentUser;
};

export default useCurrentUser;
