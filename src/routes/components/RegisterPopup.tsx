import React, { useState } from "react";
import Input from "../../reusable/Input/Input";
import Popup from "../../reusable/Popup/Popup";
import Button from "../../reusable/Button";
import { HiAtSymbol, HiLockClosed } from "react-icons/hi";
import clsx from "clsx";

const RegisterPopup = () => {
    const [loading, setLoading] = useState(false);
    const inputEmail = useState("");
    const inputPassword = useState("");
    const inputUsername = useState("");
    const inputVerifyPassword = useState("");

    const handleRegister = () => {
        if (inputPassword !== inputVerifyPassword) {
            alert("Passwords do not match");
            return;
        }
        // Registration code goes here.
    };

    return (
        <Popup trigger={<Button>Click me</Button>}>
            <div>
                <div className="flex w-full mb-3">
                    <Input
                        state={inputEmail}
                        disabled={loading}
                        type="email"
                        placeholder="Email"
                        defaultValue=""
                        Icon={HiAtSymbol}
                        iconBefore
                    />
                </div>
                <div className="flex w-full mb-3">
                    <Input
                        state={inputEmail}
                        disabled={loading}
                        type="text"
                        placeholder="Username"
                        defaultValue=""
                        Icon={HiAtSymbol}
                        iconBefore
                    />
                </div>

                <div className="flex w-full mb-3">
                    <Input
                        state={inputPassword}
                        disabled={loading}
                        type="password"
                        placeholder="Password"
                        defaultValue=""
                        Icon={HiAtSymbol}
                        iconBefore
                    />
                </div>

                <div className="flex w-full mb-3">
                    <Input
                        state={inputPassword}
                        disabled={loading}
                        type="password"
                        placeholder="Confirm Password"
                        defaultValue=""
                        Icon={HiAtSymbol}
                        iconBefore
                    />
                </div>
                <Button onClick={handleRegister}>Register</Button>
                <Button>Back</Button>
            </div>
        </Popup>
    );
};

export default RegisterPopup;
