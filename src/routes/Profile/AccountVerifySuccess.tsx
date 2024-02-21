import { useState } from "react";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import LoginPopup from "../components/LoginPopup";
import LinkWrap from "../../reusable/LinkWrap";

const AccountVerifySuccessPage = () => {
    const { isLoggedIn, user, profile } = useCurrentUser();

    return (
        <div className="w-full h-full bg-slate-100 grid place-items-center text-lg">
            {user && user.emailVerified && (
                <>
                    {isLoggedIn && user?.emailVerified && (
                        <div className="w-[480px] px-4 py-12 rounded bg-green-100 text-green-700 text-center">
                            Account verification successful!{" "}
                            <LinkWrap className="ml-4 text-sky-500 cursor-pointer hover:underline" to="/">
                                <b>Go Home</b>
                            </LinkWrap>
                        </div>
                    )}

                    {!isLoggedIn && user?.emailVerified && (
                        <div className="w-[480px] px-4 py-12 rounded bg-slate-200 text-slate-700 text-center">
                            Account verification successful!{" "}
                            <LoginPopup trigger={<div className="text-sky-500">Login</div>} />
                        </div>
                    )}
                </>
            )}

            {!user && (
                <div className="w-[480px] px-4 py-12 rounded bg-slate-200 text-slate-700 text-center flex justify-center">
                    Please{" "}
                    <LoginPopup
                        trigger={<div className="text-sky-500 mx-2 cursor-pointer hover:underline">Login</div>}
                    />{" "}
                    to verify your account!
                </div>
            )}

            {user && !user.emailVerified && (
                <div className="w-[480px] px-4 py-12 rounded bg-slate-200 text-slate-700 text-center">
                    Your email {user.email} is not verified! Please check your inbox and verify.
                </div>
            )}
        </div>
    );
};

export default AccountVerifySuccessPage;
