import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { REFS } from "../../../apis/firebase";
import { TagCategory } from "../../../apis/models";
import { TENANT_ID } from "../../../constants";
import Button from "../../../reusable/Button";
import ColorInput from "../../../reusable/ColorInput";
import { slugify } from "../../../reusable/functions";
import Input from "../../../reusable/Input/Input";
import InputContainer from "../../../reusable/Input/InputContainer";

const CreateNewTagCategorySidenav = () => {
    const creating = useState(false);
    const States = {
        Name: useState(""),
        Color: useState("#000000"),
    };

    const createCategory = async () => {
        creating[1](true);
        const id = slugify(States.Name[0]);
        const tagCategoryObject: TagCategory = {
            id,
            name: States.Name[0],
            color: States.Color[0],
            tags: {},
            tenant_id: TENANT_ID,
        };
        await setDoc(doc(REFS.tags, id), tagCategoryObject);
        window.location.reload();
        creating[1](false);
    };

    return (
        <div className="flex flex-col w-full px-3 py-3 h-full">
            <div className="text-xl mb-4">Create New Tag Category</div>
            <InputContainer label="Name" input={<Input state={States.Name} />} />
            <InputContainer label="Color" input={<ColorInput state={States.Color} />} />
            <div className="mt-auto">
                <Button
                    variant="success"
                    className="w-fit py-1 ml-auto"
                    onClick={createCategory}
                    disabled={creating[0] || States.Name[0] === ""}
                >
                    Create
                </Button>
            </div>
        </div>
    );
};

export default CreateNewTagCategorySidenav;
