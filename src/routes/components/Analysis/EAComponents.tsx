import clsx from "clsx";
import { updateDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { VscEdit } from "react-icons/vsc";
import { REFS } from "../../../apis/firebase";
import { Prototype } from "../../../apis/models";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import { useCurrentProtototypePermissions } from "../../../permissions/hooks";
import Button from "../../../reusable/Button";
import Input from "../../../reusable/Input/Input";
import tokenizeText from "../EditableCustomerJourney/parser/tokenizeText";
import TokenText from "../EditableCustomerJourney/TokenText";
import styles from "./EAComponents.module.scss";

const EAComponents = () => {
    const prototype = useCurrentPrototype() as Prototype;
    const [relatedEaComponents, setRelatedEaComponents] = useState("");
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const canEdit = useCurrentProtototypePermissions().canEdit();

    useEffect(() => {
        setRelatedEaComponents(prototype.related_ea_components ?? "");
    }, [prototype.related_ea_components]);

    useEffect(() => {
        setEditing(false);
    }, [canEdit]);

    return (
        <div className="flex flex-col py-4 relative">
            <div className="font-bold text-lg select-none mb-3">Related EA components</div>
            <>
                {!editing ? (
                    <div className="flex flex-col">
                        {canEdit && (
                            <Button className="pl-1 absolute right-0" onClick={() => setEditing(true)}>
                                <VscEdit
                                    className="text-3xl"
                                    style={{ transform: "scale(0.55)", marginRight: "2px" }}
                                />
                                <div>Edit</div>
                            </Button>
                        )}
                        {(prototype.related_ea_components ?? "") === "" ? (
                            <div>No Related EA Components</div>
                        ) : (
                            <div>
                                <TokenText cell={tokenizeText(prototype.related_ea_components ?? "")} />
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Input
                            form="textarea"
                            state={[relatedEaComponents, setRelatedEaComponents]}
                            placeholder=""
                            className="h-full w-full"
                            containerClassName={clsx("w-full mb-1", styles.Input)}
                        />
                        <div className="flex w-full mt-2">
                            <Button
                                disabled={loading}
                                className="py-1 ml-auto mr-2"
                                variant="failure"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="py-1"
                                variant="success"
                                disabled={loading}
                                onClick={async () => {
                                    setLoading(true);
                                    await updateDoc(doc(REFS.prototype, prototype.id), {
                                        related_ea_components: relatedEaComponents,
                                    });
                                    window.location.reload();
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </>
                )}
            </>
        </div>
    );
};

export default EAComponents;
