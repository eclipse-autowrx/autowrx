import { FC, useState } from "react";
import { User } from "../../apis/models";
import Button from "../../reusable/Button";
import triggerConfirmPopup from "../../reusable/triggerPopup/triggerConfirmPopup";
import { HiMinus } from "react-icons/hi";

const hideEmail = (email) => {
    if (!email) return "no-email";
    if (email.length > 5) {
        return "xxxxxx" + email.substring(6);
    } else {
        return "xxx@xxx.xx";
    }
};

const DisplayUserRow: FC<{
    user: User;
    onRemove: (user_id: string) => void;
}> = ({ user, onRemove }) => {
    return (
        <div className="flex mt-2 py-1 pl-2 pr-2 rounded bg-slate-50 border-slate-200 border select-none">
            <div className="flex w-full items-center">
                <img
                    src={user.image_file || "/imgs/profile.png"}
                    alt={user.name}
                    className="select-none w-12 h-12 mr-4 rounded overflow-hidden "
                    style={{ objectFit: "cover" }}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null; // prevents looping
                        currentTarget.src = "/imgs/profile.png";
                    }}
                />
                <div className="pt-0.5">
                    <div className="font-bold text-[14px] leading-none">{user.name}</div>
                    <div className="text-gray-600 text-[12px]">{hideEmail(user.email)}</div>
                </div>
            </div>
            <Button
                className="hover:bg-red-100 px-2 text-red-500 rounded"
                onClick={() => {
                    triggerConfirmPopup("Are you sure you want to remove this user?", () => onRemove(user.uid));
                }}
            >
                <HiMinus color="#DD0000" style={{ transform: "scale(1.4)" }} />
            </Button>
        </div>
    );
};

export default DisplayUserRow;
