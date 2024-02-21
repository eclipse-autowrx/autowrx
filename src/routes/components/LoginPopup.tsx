import { useEffect, useState, useRef } from "react";
import Input from "../../reusable/Input/Input";
import Popup from "../../reusable/Popup/Popup";
import { FaGithub } from "react-icons/fa";
import { TbUser, TbAt, TbLock } from "react-icons/tb";
import Button from "../../reusable/Button";
import { auth } from "../../apis/firebase";
import { addLog } from "../../apis";
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GithubAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import LinkWrap from "../../reusable/LinkWrap";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Tooltip from "../../reusable/tooltips/tooltip";
// import { useHistory, useLocation } from 'react-router-dom'
import ReCAPTCHA from "react-google-recaptcha";

declare let grecaptcha: any;

const Link = ({ email }: { email: string }) => {
    return (
        <a href={`mailto:${email}`} className="text-aiot-blue">
            {email}
        </a>
    );
};

const CAPTCHA_SITE_ID = "6LeToTAmAAAAAFgc5SziMqXwugq2VjNpdyvVdv5I";

const LoginInner = ({ setMode, setPreferEmail, preferEmail }) => {
    const [displayError, setDisplayError] = useState<null | string>(null);
    const [message, setMessage] = useState<null | string>(null);
    const [loading, setLoading] = useState(false);
    const provider = new GithubAuthProvider();
    const [inputEmail, setInputEmail] = useState<string>(preferEmail || "");
    const [inputPassword, setInputPassword] = useState<string>("");

    const handleLogin = async () => {
        if (!inputEmail || !inputPassword) {
            setDisplayError("Missing email or password");
            return;
        }
        setLoading(true);
        setMessage("");
        setDisplayError("");
        try {
            let res = await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
            // console.log(res.user)
            addLog(
                "User login",
                `User ${inputEmail} logged in`,
                "user-login@email",
                res.user.uid,
                null,
                res.user.uid,
                "user"
            );
        } catch (error) {
            if (!error) return;
            let errorCode = (error as any).code;
            switch (errorCode) {
                // case "auth/invalid-email":
                //     setDisplayError("Error: Invalid email!")
                //     break;
                // case "auth/user-not-found":
                //     setDisplayError("Error: user not found!")
                //     break;
                // case "auth/wrong-password":
                //     setDisplayError("Error: wrong password!")
                //     break;
                default:
                    // setDisplayError(errorCode)
                    setDisplayError("Invalid username or password");
                    break;
            }
        }
        setLoading(false);
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        setMessage("");
        setDisplayError("");
        try {
            provider.addScope("user:email");
            const res = await signInWithPopup(auth, provider);
            if (!res) {
                setDisplayError("Could not complete signup");
                return;
            }

            // console.log("res.user", res.user)

            const user = res.user;
            let email = user.email;
            if (!email) {
                if (user.providerData && user.providerData.length > 0) {
                    email = user.providerData[0].email ?? "";
                }
            }
            const response = await axios.get(
                `/.netlify/functions/createUserByProvider?name=${user.displayName}&email=${email}&uid=${
                    user.uid
                }&provider=Github&image_file=${encodeURIComponent(user.photoURL || "")}`
            );
            // console.log(response.data)
            let data = response.data;
            if (data.existed) {
                addLog(
                    "User login by Github",
                    `User ${user.displayName} logged in with Github`,
                    "user-login@github",
                    user.uid,
                    null,
                    user.uid,
                    "user"
                );
            } else {
                addLog(
                    "New User signup by Github",
                    `User ${user.displayName} signup with Github`,
                    "new-user@github",
                    user.uid,
                    user.photoURL || "",
                    user.uid,
                    "user"
                );
            }

            window.location.reload();
        } catch (error) {
            if ((error as any).code === "auth/account-exists-with-different-credential") {
                setDisplayError("Account already exists with different credentials");
            } else {
                setDisplayError((error as any).code);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                handleLogin();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [inputEmail, inputPassword]);

    return (
        <div className="px-2">
            <h1 className="text-2xl mt-3 mb-6 font-bold text-aiot-gradient-500">Sign in</h1>
            <div className="flex w-full mb-3">
                <Input
                    state={[inputEmail, setInputEmail]}
                    disabled={loading}
                    type="email"
                    placeholder="Email"
                    Icon={TbAt}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            <div className="flex w-full mb-2">
                <Input
                    state={[inputPassword, setInputPassword]}
                    disabled={loading}
                    type="password"
                    placeholder="Password"
                    Icon={TbLock}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            {displayError !== null && <div className="text-red-500 text-sm mb-3 pl-1">{displayError}</div>}
            {message !== null && <div className="text-green-500 text-sm mb-3 pl-1">{message}</div>}

            <div className="flex items-end justify-end mt-2 mb-3">
                <div className="grow"></div>
                <Button
                    disabled={loading}
                    className="py-0.5 text-sm text-gray-600 hover:underline"
                    onClick={() => {
                        setPreferEmail(inputEmail[0]);
                        setMode("forget-password");
                    }}
                >
                    Forgot password
                </Button>
            </div>

            <Button
                disabled={loading}
                variant="aiot-gradient"
                className="font-bold h-10"
                onClick={handleLogin}
                showProgress={loading}
                progressSize="1.3rem"
            >
                Sign in
            </Button>

            <div className="mt-3">
                {!loading && (
                    <div
                        className="flex py-2 text-md cursor-pointer w-full text-center bg-gray-100 border border-gray-200 shadow-sm rounded hover:bg-gray-200"
                        onClick={handleGithubLogin}
                    >
                        <div className="grow"></div>
                        <FaGithub size={22} color="#0f172a" />{" "}
                        <span className="ml-2 text-sm font-semibold text-gray-800 ">Continue with GitHub</span>
                        <div className="grow"></div>
                    </div>
                )}
            </div>
            <div className="mt-5 inline-flex justify-between items-center w-full">
                <div className="text-sm text-gray-500">
                    Don't have an account?
                    <span
                        className="text-aiot-blue-m cursor-pointer ml-1 hover:underline font-semibold"
                        onClick={() => setMode("register")}
                    >
                        Sign up
                    </span>
                </div>
                <Tooltip preText="Contact" postText="if you require further assistance." email="support@digital.auto">
                    <div className="text-sm font-semibold">?</div>
                </Tooltip>
            </div>
        </div>
    );
};

const ForgetPasswordInner = ({ setMode, preferEmail }) => {
    const [message, setMessage] = useState<null | string>(null);
    const [displayError, setDisplayError] = useState<null | string>(null);
    const [loading, setLoading] = useState(false);
    const inputEmail = useState(preferEmail || "");
    const [captchaValue, setCaptchaValue] = useState("");

    useEffect(() => {
        inputEmail[1](preferEmail);
    }, [preferEmail]);

    return (
        <div className="px-2">
            <h1 className="text-2xl mt-3 mb-6 font-bold text-aiot-gradient-800">FORGET PASSWORD</h1>
            {displayError !== null && <div className="text-red-500 text-sm mb-3 pl-1">{displayError}</div>}
            {message !== null && <div className="text-green-500 text-sm mb-3 pl-1">{message}</div>}
            <div className="flex w-full mb-3">
                <Input
                    state={inputEmail}
                    disabled={loading}
                    type="email"
                    placeholder="Email"
                    Icon={TbAt}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            <div className="flex w-full mt-4 mb-3 min-h-[80px]">
                <ReCAPTCHA sitekey={CAPTCHA_SITE_ID} onChange={setCaptchaValue} />
            </div>

            <Button
                disabled={loading}
                variant="aiot-gradient"
                className="font-bold h-10 mt-2.5"
                onClick={async () => {
                    if (!inputEmail[0]) {
                        setDisplayError("Please enter email address and try again!");
                        return;
                    }
                    setMessage("");
                    setDisplayError("");
                    /************************** */
                    if (!captchaValue) {
                        setDisplayError("Error: please confirm you are not robot!");
                        return;
                    }
                    setLoading(true);
                    try {
                        await axios.post(`/.netlify/functions/resetPassword`, {
                            email: inputEmail[0],
                            captchaValue: captchaValue,
                            returnURL: `${window.location.href}?showLogin=true`,
                        });
                        // await sendPasswordResetEmail(auth, inputEmail[0], {
                        //     url: `${window.location.href}?showLogin=true`
                        // })
                        setMessage("Password reset email sent. Check your inbox or spam.");
                    } catch (error) {
                        let err = error as any;
                        if (err.response && err.response.data) {
                            setDisplayError(err.response.data);
                        } else {
                            setDisplayError(err.messag || err);
                        }
                        grecaptcha.reset();
                        setCaptchaValue("");
                    }
                    setLoading(false);
                }}
            >
                Retrieve Password
            </Button>

            <div className="mt-4">
                <span
                    className="hover:underline cursor-pointer text-sm text-gray-500"
                    onClick={() => {
                        setMode("login");
                    }}
                >
                    Back to login
                </span>
            </div>
        </div>
    );
};

const RegisterInner = ({ setMode, preferEmail }) => {
    const [displayError, setDisplayError] = useState<null | string>(null);
    const [message, setMessage] = useState<null | string>(null);
    const [loading, setLoading] = useState(false);

    const inputEmail = useState("");
    const inputFullname = useState("");
    const inputPassword = useState("");
    const confirmPassword = useState("");
    const [chaptchaValue, setCaptchaValue] = useState("");

    useEffect(() => {
        inputEmail[1](preferEmail);
    }, [preferEmail]);

    const handleRegister = async () => {
        if (!inputFullname[0]) {
            setDisplayError("Please enter your name!");
            return;
        }
        if (!inputEmail[0]) {
            setDisplayError("Please enter email!");
            return;
        }
        if (!inputPassword[0]) {
            setDisplayError("Please enter password!");
            return;
        }
        if (inputPassword[0].length < 8) {
            setDisplayError("Password too short, at least 8 characters!");
            return;
        }
        if (inputPassword[0] != confirmPassword[0]) {
            setDisplayError("Error: confirm password not match!");
            return;
        }

        if (!chaptchaValue) {
            setDisplayError("Error: please confirm you are not robot!");
            return;
        }

        setLoading(true);
        setMessage("");
        setDisplayError("");
        try {
            await axios.post(`/.netlify/functions/registerNewUser?`, {
                name: inputFullname[0],
                pwd: inputPassword[0],
                email: inputEmail[0],
                provider: "Email",
                captcha: chaptchaValue,
            });
            try {
                let res = await signInWithEmailAndPassword(auth, inputEmail[0], inputPassword[0]);
                addLog(
                    "New User Signup",
                    `User ${inputFullname[0]} signed up with email ${inputEmail[0]}`,
                    "new-user@email",
                    res.user.uid,
                    "",
                    res.user.uid,
                    "user"
                );
                await sendEmailVerification(res.user, {
                    url: `${window.location.origin}/account-verification-success?email=${inputEmail[0]}`,
                });
            } catch (error) {
                if (!error) return;
                let errorCode = (error as any).code;
                switch (errorCode) {
                    default:
                        // setDisplayError(errorCode)
                        setDisplayError("Error: Something went wrong!");
                        break;
                }
            }
            window.location.reload();
        } catch (error) {
            let errorMsg = (error as any).response.data;
            setDisplayError(errorMsg);
            grecaptcha.reset();
            setCaptchaValue("");
        }
        setLoading(false);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                handleRegister();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [inputEmail, inputPassword, inputFullname, confirmPassword, chaptchaValue, handleRegister]);

    return (
        <div className="px-2">
            <div>
                <h1 className="text-2xl mt-3 mb-6 font-bold text-aiot-gradient-300">Sign up</h1>
            </div>

            <div className="flex w-full mb-3">
                <Input
                    state={inputFullname}
                    disabled={loading}
                    type="text"
                    placeholder="Name"
                    Icon={TbUser}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            <div className="flex w-full mb-3">
                <Input
                    state={inputEmail}
                    disabled={loading}
                    type="email"
                    placeholder="Email"
                    Icon={TbAt}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            <div className="flex w-full mb-3">
                <Input
                    state={inputPassword}
                    disabled={loading}
                    type="password"
                    placeholder="Password"
                    Icon={TbLock}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            <div className="flex w-full mb-3">
                <Input
                    state={confirmPassword}
                    disabled={loading}
                    type="password"
                    placeholder="Confirm Password"
                    Icon={TbLock}
                    iconBefore
                    className="text-base"
                    containerClassName="bg-white"
                    iconSize={16}
                />
            </div>
            <div className="flex mt-4 w-full min-h-[80px]">
                <ReCAPTCHA sitekey={CAPTCHA_SITE_ID} onChange={setCaptchaValue} />
            </div>

            {displayError !== null && <div className="text-red-500 text-sm mb-3 pl-1">{displayError}</div>}
            {message !== null && <div className="text-green-500 text-sm mb-3 pl-1">{message}</div>}

            <Button
                disabled={loading}
                variant="aiot-gradient"
                className="font-bold h-10 mt-2.5"
                onClick={handleRegister}
                showProgress={loading}
                progressSize="1.3rem"
            >
                Sign up
            </Button>

            <div className="mt-4 text-sm text-gray-500">
                Already own an account?
                <span className="cursor-pointer inline-block ml-1">
                    <button
                        className="text-aiot-blue-m hover:underline font-semibold"
                        onClick={() => {
                            setMode("login");
                        }}
                    >
                        Sign in
                    </button>
                </span>
            </div>
        </div>
    );
};

interface LoginPopupProps {
    trigger: React.ReactElement;
    // mode: string
    // setMode: (v: string) => void
}

const LoginPopup = ({ trigger }: LoginPopupProps) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const { isLoggedIn, user, profile } = useCurrentUser();

    // const [mode, setMode] = useState("login")
    const [preferEmail, setPreferEmail] = useState("");
    const popupState = useState(false);
    const [mode, setMode] = useState("login");

    useEffect(() => {
        if (searchParams.has("showLogin")) {
            if (!isLoggedIn) popupState[1](true);
            searchParams.delete("showLogin");
            setSearchParams(searchParams);
        }
    }, []);

    return (
        <Popup state={popupState} trigger={trigger} width="400px">
            {user && (
                <div className="flex flex-col select-none">
                    <div className="text-xl mb-2 text-gray-400">You're logged in as</div>
                    {(profile?.name ?? "") !== "" ? (
                        <>
                            <div className="font-bold">{profile?.name}</div>
                            <div className="text-sm">{user.email}</div>
                        </>
                    ) : (
                        <>
                            <div className="font-bold">{user.email}</div>
                        </>
                    )}
                    <div className="flex mt-5 w-full">
                        <LinkWrap to="/edit-profile" className=" ml-auto">
                            <Button className="py-0.5 w-fit mr-2 text-sm">Edit</Button>
                        </LinkWrap>
                        <Button className="py-0.5 w-fit text-sm" onClick={() => auth.signOut()}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            )}
            {!user && mode === "login" && (
                <LoginInner
                    setPreferEmail={setPreferEmail}
                    preferEmail={preferEmail}
                    setMode={(v: string) => {
                        setMode(v);
                    }}
                />
            )}
            {!user && mode === "register" && (
                <RegisterInner
                    preferEmail={preferEmail}
                    setMode={(v: string) => {
                        setMode(v);
                    }}
                />
            )}
            {!user && mode === "forget-password" && (
                <ForgetPasswordInner
                    preferEmail={preferEmail}
                    setMode={(v: string) => {
                        setMode(v);
                    }}
                />
            )}
        </Popup>
    );
};

export default LoginPopup;
