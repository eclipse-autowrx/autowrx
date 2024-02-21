import { updateDoc, doc } from "firebase/firestore";
import { useState } from "react";
import { REFS } from "../../../apis/firebase";
import useCurrentPrototype from "../../../hooks/useCurrentPrototype";
import EditableCustomerJourney from "../EditableCustomerJourney";
import SelectMedia from "../EditPrototype/SelectMedia";

const DisplayJourneyImage = () => {
    const selectImageMedia = useState(false);
    const prototype = useCurrentPrototype();

    if (typeof prototype === "undefined") {
        return null;
    }

    return (
        <div className="flex flex-col h-full px-5 py-3 ">
            <SelectMedia
                filter={["image"]}
                state={selectImageMedia}
                selectMedia={async (media) => {
                    await updateDoc(doc(REFS.prototype, prototype.id), {
                        journey_image_file: media.imageUrl,
                    });
                    window.location.reload();
                }}
            />
            {/* <EditableCustomerJourney /> */}
        </div>
    );
};

export default DisplayJourneyImage;
