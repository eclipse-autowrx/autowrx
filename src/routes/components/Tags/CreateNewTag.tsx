import { doc, setDoc } from "firebase/firestore";
import { FC, useState } from "react";
import { REFS } from "../../../apis/firebase";
import { Tag, TagCategory } from "../../../apis/models";
import Button from "../../../reusable/Button";
import { slugify } from "../../../reusable/functions";
import Input from "../../../reusable/Input/Input";
import InputContainer from "../../../reusable/Input/InputContainer";

const CreateNewTagSidenav: FC<{
    tagCategory: TagCategory;
}> = ({ tagCategory }) => {
    const creating = useState(false);
    const States = {
        Name: useState(""),
        Description: useState(""),
    };

    const createTag = async () => {
        creating[1](true);
        const tag: Tag = {
            name: States.Name[0],
            description: States.Description[0],
            tag_image_file: "",
        };

        await setDoc(
            doc(REFS.tags, tagCategory.id),
            {
                tags: {
                    [States.Name[0]]: tag,
                },
            },
            { merge: true }
        );

        creating[1](false);
        window.location.reload();
    };

    return (
        <div className="flex flex-col w-full h-full">
            <InputContainer label="Name" input={<Input state={States.Name} />} />
            <InputContainer label="Description" input={<Input state={States.Description} />} />
            <Button variant="success" className="mt-auto w-fit py-1 ml-auto" onClick={createTag}>
                Create
            </Button>
        </div>
    );
};

export default CreateNewTagSidenav;
