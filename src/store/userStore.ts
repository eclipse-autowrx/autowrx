import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { Tokens, User } from "../apis/backend/authApi";

type UserState = {
    user?: User;
    tokens?: Tokens;
};

type UserActions = {
    setUserState: (userState: UserState) => void;
    logout: () => void;
};

// Note the extra () at the end of the create call
export const useUserStore = create<UserState & UserActions> /*here*/()(
    // Immer facilitates immutable state updates (https://immerjs.github.io/immer/docs/introduction)
    immer(
        // Persist the state, storing it in localStorage
        persist(
            (set) => ({
                setUserState(userState) {
                    set(() => {
                        return userState;
                    });
                },
                logout() {
                    set((state) => {
                        state.user = undefined;
                        state.tokens = undefined;
                    });
                },
            }),
            {
                name: "user-store",
            }
        )
    )
);
