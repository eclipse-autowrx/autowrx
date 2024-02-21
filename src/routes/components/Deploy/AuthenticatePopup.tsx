import React, { useState } from "react";
import { TbArrowNarrowLeft, TbAlertSquareFilled } from "react-icons/tb";

interface AuthenticatePopupProps {
    onAuthClick: () => void;
    setAuthWindowOpen: (value: boolean) => void;
}

const AuthenticatePopup = ({ onAuthClick, setAuthWindowOpen }: AuthenticatePopupProps) => {
    const [enteredID, setEnteredID] = useState(""); // State to store the entered ID
    const [enteredPassword, setEnteredPassword] = useState(""); // State to store the entered password
    const [showError, setShowError] = useState(false); // State to control the visibility of the error message

    const handleAuthentication = () => {
        // Validate the entered credentials
        if (enteredID === "sdv" && enteredPassword === "123456") {
            onAuthClick(); // Trigger the callback if credentials are correct
            setAuthWindowOpen(false); // Close the modal
            setShowError(false); // Hide the error message, if previously displayed
        } else {
            setShowError(true); // Display the error message for incorrect credentials
        }
    };

    return (
        <div className="flex flex-col w-[380px] h-[280px] p-4 bg-white rounded-lg justify-between">
            <div className="flex justify-between items-center pt-2">
                <div className=" text-aiot-gradient-500 text-xl shrink-0 font-bold">DreamKit Authentication</div>
                <div className="flex align-top w-full justify-end" onClick={() => setAuthWindowOpen(false)}>
                    <TbArrowNarrowLeft className="w-6 h-auto text-gray-400 hover:text-aiot-blue text-xs flex justify-end" />
                </div>
            </div>
            <div className=" text-gray-500 text-xs pt-5">Please enter your DreamKit credentials to proceed</div>
            <div className="flex flex-col gap-3 outline-none w-full h-auto text-sm py-2">
                <div className="relative rounded bg-zinc-300 bg-opacity-20">
                    <input
                        className="flex border-[0.068rem] border-transparent text-gray-600 bg-gray-100 rounded p-2 outline-none focus:border-gray-300 w-full h-10"
                        placeholder="ID"
                        value={enteredID}
                        onChange={(e) => setEnteredID(e.target.value)}
                    />
                </div>
                <div className="relative rounded bg-zinc-300 bg-opacity-20">
                    <input
                        className="flex border-[0.068rem] border-transparent text-gray-600 bg-gray-100 rounded p-2 outline-none focus:border-gray-300 w-full  h-10 "
                        type="password"
                        placeholder="Password"
                        value={enteredPassword}
                        onChange={(e) => setEnteredPassword(e.target.value)}
                    />
                </div>
            </div>
            {showError && (
                <div className="text-red-500 text-[0.65rem] flex items-center pb-2">
                    <TbAlertSquareFilled className="w-4 h-4 mr-1" /> Wrong ID or Password
                </div>
            )}
            <button
                className="w-full text-sm bg-aiot-gradient-6 hover:bg-aiot-gradient-5 text-white py-2 px-4 flex items-center justify-center rounded h-10 "
                onClick={handleAuthentication}
            >
                Authenticate
            </button>
        </div>
    );
};

export default AuthenticatePopup;
