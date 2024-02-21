import { doc, setDoc, Timestamp } from "firebase/firestore";
import { FC, useState } from "react";
import { REFS } from "../apis/firebase";
import { Model } from "../apis/models";
import Button from "../reusable/Button";
import Input from "../reusable/Input/Input";
import InputContainer from "../reusable/Input/InputContainer";
import SideNav from "../reusable/SideNav/SideNav";
import useCurrentUser from "../reusable/hooks/useCurrentUser";
import { useCurrentModel } from "../reusable/hooks/useCurrentModel";
import LoginPopup from "./components/LoginPopup";
import { useCurrentModelPermissions, useCurrentProtototypePermissions } from "../permissions/hooks";
import { Prototype } from "../apis/models";
import Select from "../reusable/Select";
import { addLog } from "../apis";
import CustomSelect from "../reusable/ReportTools/CustomSelect";
import { complexityOptions } from "./components/PrototypeOverview/PrototypeDisplay";
import { Bars } from "@agney/react-loading";

interface NewPrototypeProps {
    trigger?: React.ReactElement;
    state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    prototypes?: Prototype[];
}

const NewPrototype: FC<NewPrototypeProps> = ({ state: statePassed, trigger, prototypes }) => {
    const selfManaged = useState(false);
    const state = statePassed ?? selfManaged;

    const { isLoggedIn, user } = useCurrentUser();
    const model = useCurrentModel() as Model;
    const modelPermissions = useCurrentModelPermissions();
    const [loading, setLoading] = useState(false);
    const [displayError, setDisplayError] = useState<null | string>(null);

    const States = {
        Name: useState(""),
        Problem: useState(""),
        SaysWho: useState(""),
        Solution: useState(""),
        Status: useState(""),
        Complexity: useState(3),
    };

    const MockDefaultJourney = `
#Step 1
Who: Driver
What: Wipers turned on manually
Customer TouchPoints: Windshield wiper switch
#Step 2
Who: User
What: User opens the car door/trunk and the open status of door/trunk is set to true
Customer TouchPoints: Door/trunk handle
#Step 3
Who: System
What: The wiping is immediately turned off by the software and user is notified
Customer TouchPoints: Notification on car dashboard and mobile app
`;

    const createPrototype = async () => {
        if (user === null) {
            return;
        }

        if (!States.Name[0]) {
            setDisplayError("Error: Name is required");
            return;
        }

        if (
            prototypes &&
            prototypes.find((prototype) => prototype.name.toLowerCase() === States.Name[0].toLowerCase())
        ) {
            setDisplayError("Error: Prototype with this name already exists");
            return;
        }

        setLoading(true);
        setDisplayError("");
        const newDocRef = doc(REFS.prototype);
        await setDoc(newDocRef, {
            id: newDocRef.id,
            state: "development",
            apis: {
                VSS: [],
                VSC: [],
            },
            code: "",
            created: {
                created_time: Timestamp.now(),
                user_uid: user.uid,
            },
            description: {
                problem: States.Problem[0],
                says_who: States.SaysWho[0],
                solution: States.Solution[0],
                status: States.Status[0],
            },
            customer_journey: MockDefaultJourney,
            image_file: "",
            model_id: model.id,
            name: States.Name[0],
            portfolio: {
                effort_estimation: 0,
                needs_addressed: 0,
                relevance: 0,
            },
            complexity_level: States.Complexity[0],
            rated_by: {},
        });
        await addLog(
            `New prototype '${States.Name[0]}' under model '${model.name}'`,
            `Prototype '${States.Name[0]}' was created by ${user.email || user.displayName || user.uid}`,
            "new-prototype",
            user.uid,
            null,
            newDocRef.id,
            "prototype",
            model.id
        );
        setLoading(false);
        window.location.href = `/model/${model.id}/library/prototype/${newDocRef.id}`;
        // window.location.reload()
    };

    return (
        <SideNav
            trigger={typeof trigger === "undefined" ? <></> : trigger}
            state={state}
            width="400px"
            className="h-full"
        >
            {modelPermissions.canEdit() ? (
                <div className="flex flex-col h-full w-full p-4">
                    <div className="mb-2 text font-bold text-aiot-blue">Name*</div>
                    <InputContainer label="" input={<Input state={States.Name} />} />
                    <div className="mb-2 text font-bold text-aiot-blue">Description</div>
                    <InputContainer label="Problem" input={<Input state={States.Problem} />} />
                    <InputContainer label="Says who?" input={<Input state={States.SaysWho} />} />
                    <InputContainer label="Solution" input={<Input state={States.Solution} />} />
                    {/* <InputContainer label="Status" input={<Input state={States.Status} />} /> */}

                    <div className="flex items-center">
                        <div className="w-[90px] text-sm text-gray-600">Complexity</div>
                        {/* <select className="w-[80px] text-center bg-gray-100 px-4 py-2 rounded"
                            value={States.Complexity[0]}
                            onChange={(e) => States.Complexity[1](Number(e.target.value))}
                        >
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </select> */}
                        <CustomSelect
                            options={complexityOptions}
                            selectedValue={States.Complexity[0]}
                            onValueChange={(value) => {
                                if (typeof value === "number") {
                                    States.Complexity[1](value);
                                }
                            }}
                            customStyle="px-1 py-1 rounded border border-transparent bg-white text-gray-500 shadow-none hover:border-gray-300 text-sm"
                            customDropdownContainerStyle="w-max"
                            customDropdownItemStyle="px-5 text-sm"
                        />
                    </div>

                    {displayError !== null && <div className="text-red-500 text-sm my-3 pl-1">{displayError}</div>}
                    <div className="mt-auto">
                        {/* <Button
                            className="py-1.5 w-[5rem] justify-center ml-auto bg-aiot-blue text-sm text-white hover:bg-aiot-blue/90 "
                            variant="custom"
                            onClick={createPrototype}>Create
                        </Button> */}
                        <button
                            className={`ml-auto flex bg-aiot-blue text-white py-1.5 px-5 rounded items-center justify-center ${
                                !States.Name[0] ? "cursor-not-allowed opacity-50" : "hover:bg-aiot-blue/95 opacity-100"
                            }`}
                            onClick={createPrototype}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex w-6 h-auto">
                                    <Bars></Bars>
                                </div>
                            ) : (
                                <div>Create</div>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col w-full h-full text-center px-4 pt-12 select-none text-gray-500">
                    <div>
                        You don't have permissions{" "}
                        <LoginPopup trigger={<span className="cursor-pointer text-aiot-green/80">logged in</span>} /> to
                        create a prototype.
                    </div>
                </div>
            )}
        </SideNav>
    );
};

export default NewPrototype;
