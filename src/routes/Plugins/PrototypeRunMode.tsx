import { useEffect, useState } from "react";
import useCurrentPrototype from "../../hooks/useCurrentPrototype";
import useCurrentUser from "../../reusable/hooks/useCurrentUser";
import { useCurrentModel } from "../../reusable/hooks/useCurrentModel";
import { Prototype, Model } from "../../apis/models";
import permissions from "../../permissions";

import { REFS } from "../../apis/firebase";
import { updateDoc, doc } from "firebase/firestore";

const PrototypeRunMode = () => {
    const prototype = useCurrentPrototype() as Prototype;
    const model = useCurrentModel() as Model;
    const { profile, isLoggedIn } = useCurrentUser();
    const [isAutoRun, setIsAutoRun] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (prototype) {
            setIsAutoRun(prototype.autorun || false);
        }
    }, [prototype]);

    useEffect(() => {
        let curCanEdit = permissions.PROTOTYPE(profile, model, prototype).canEdit();
        setCanEdit(curCanEdit);
    }, [profile, model, prototype]);

    const saveAutoRunMode = async (mode) => {
        if (prototype) {
            try {
                setIsLoading(true);
                await updateDoc(doc(REFS.prototype, prototype.id), {
                    autorun: mode,
                });
                setIsAutoRun(mode);
            } catch (err) {
                console.log("err on save autorun mode");
                console.log(err);
            }
            setIsLoading(false);
        }
    };

    if (!prototype) return null;

    return (
        <div className="flex items-center ml-2 text-sm text-slate-500">
            <div className="mr-1">Auto Run:</div>
            {isLoading && <div className="text-gray-500 w-10 text-center">...</div>}
            {!isLoading && (
                <button
                    className={`text-center w-10 py-0.5 text-xs font-bold border bg-slate-100 rounded 
                ${isAutoRun && "border-gray-700"}
                ${canEdit && "hover:bg-slate-200"}`}
                    disabled={!canEdit}
                    onClick={async () => {
                        if (!canEdit) return;
                        await saveAutoRunMode(!isAutoRun);
                    }}
                >
                    {isAutoRun && <div className="text-gray-700">ON</div>}
                    {!isAutoRun && <div className="text-gray-500">OFF</div>}
                </button>
            )}
        </div>
    );
};

export default PrototypeRunMode;
