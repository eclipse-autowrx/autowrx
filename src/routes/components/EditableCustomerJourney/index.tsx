import React, { useEffect, useState, useImperativeHandle, useRef } from "react";
import Table from "./table";
import parseCJFromInput, { TableDataType } from "./parser/parseCJFromInput";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { Prototype } from "../../../apis/models";
import { doc, updateDoc } from "firebase/firestore";
import { REFS } from "../../../apis/firebase";
import "./semantic.css";
import TableEditor, { isTableValidForSave } from "./TableEditor";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { addLog } from "../../../apis";

interface EditableCustomerJourneyProps {
    editing: boolean;
    tableRef: React.Ref<isTableValidForSave>;
}
export interface EditableCustomerJourneyHandle {
    triggerSave: () => Promise<void>;
}

const EditableCustomerJourney = React.forwardRef<EditableCustomerJourneyHandle, EditableCustomerJourneyProps>(
    ({ editing, tableRef }, ref) => {
        const prototype = useCurrentPrototype() as Prototype;
        const [defaultValue, setDefaultValue] = useState("");
        const [triggerSave, setTriggerSave] = useState<boolean>(false);
        const { profile } = useCurrentUser();

        const saveCustomerJourney = async (cj: string) => {
            if (cj === defaultValue) {
                // console.log("No changes detected. Skipping save.");
                setTriggerSave(false);
                return; // Exit the function early if no changes.
            }
            await updateDoc(doc(REFS.prototype, prototype.id), {
                customer_journey: cj,
            });
            setTriggerSave(false);

            // Add log customer journey
            if (profile) {
                const username = profile.name || profile.name || "Anonymous";

                await addLog(
                    `User '${username}' update customer journey (table) of prototype with id '${prototype.id}'`,
                    `User '${username}' update customer journey (table) of prototype with id '${prototype.id}'`,
                    "update",
                    profile.uid,
                    null,
                    prototype.id,
                    "prototype",
                    null
                );
            }
            window.location.reload();
        };

        useImperativeHandle(ref, () => ({
            triggerSave: async () => {
                setTriggerSave(true);
            },
        }));

        const customer_journey = parseCJFromInput(prototype.customer_journey);
        useEffect(() => {
            if (customer_journey !== null) {
                setDefaultValue(prototype.customer_journey ?? "");
            }
        }, [customer_journey]);

        return (
            <div className="flex flex-col w-full h-full" style={{ paddingBottom: 100 }}>
                <h1 className="flex w-full h-full select-none justify-center text-aiot-blue text-2xl font-bold mt-8">
                    Customer Journey
                </h1>
                {!editing ? (
                    <div className="w-full h-full mt-12">
                        {customer_journey !== null ? (
                            <Table data={customer_journey} />
                        ) : (
                            <div className="flex w-full justify-center text-2xl text-gray-600 select-none">
                                <div className="flex px-36 py-12 bg-gray-50 rounded-lg">No customer journey found</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex w-full h-full mt-12 items-center justify-center">
                        <div className="flex max-w-[90%] h-full">
                            <TableEditor
                                ref={tableRef}
                                defaultValue={defaultValue}
                                onSave={saveCustomerJourney}
                                onTriggerSave={triggerSave}
                                onCancel={() => {}}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

export default EditableCustomerJourney;
