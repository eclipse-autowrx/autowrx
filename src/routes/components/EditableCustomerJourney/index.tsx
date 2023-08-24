import React, { useEffect, useState } from 'react'
import Table from './Table';
import parseCJFromInput, { TableDataType } from './parser/parseCJFromInput';
import useCurrentPrototype from '../../../hooks/useCurrentPrototype';
import { Prototype } from '../../../apis/models';
import Button from '../../../reusable/Button';
import { VscEdit } from 'react-icons/vsc';
import EditCustomerJourney from './EditCustomerJourney';
import { doc, updateDoc } from 'firebase/firestore';
import { REFS } from '../../../apis/firebase';
import "./semantic.css"
import { useCurrentProtototypePermissions } from '../../../permissions/hooks';

const EditableCustomerJourney = () => {
    const prototype = useCurrentPrototype() as Prototype
    const [editing, setEditing] = useState(false)
    const canEdit = useCurrentProtototypePermissions().canEdit()

    useEffect(() => {
        if (!canEdit) {
            setEditing(false)
        }
    }, [canEdit])

    const customer_journey = parseCJFromInput(prototype.customer_journey)

    return (
        <div className="flex flex-col w-full h-full">
            <h1 className="select-none mb-4" style={{
                "color" : "teal",
                "fontSize" : "xx-large",
                "textAlign": "center",
            }}>Customer Journey</h1>
            {!editing ? (
                <div className="flex w-full h-full relative mt-4">
                    {canEdit ? (
                        <Button className="top-2 pl-1 absolute right-0" onClick={() => setEditing(true)}>
                            <VscEdit className="text-3xl" style={{transform: "scale(0.55)", marginRight: "2px"}}/>
                            <div>Edit</div>
                        </Button>
                    ) : (
                        null
                    )}
                    {customer_journey !== null ? (
                        <Table data={customer_journey} />
                    ) : (
                        <div className="flex w-full h-full items-center justify-center text-4xl">
                            <div className='text-gray-400 select-none'>No Customer Journey</div>
                        </div>
                    )}
                </div>
            ) : (
                <EditCustomerJourney
                defaultValue={prototype.customer_journey ?? ""}
                cancel={() => setEditing(false)}
                saveCustomerJourney={async cj => {
                    await updateDoc(doc(REFS.prototype, prototype.id), {
                        customer_journey: cj
                    })
                    window.location.reload()
                }}
                />
            )}
        </div>
    );
}

export default EditableCustomerJourney
