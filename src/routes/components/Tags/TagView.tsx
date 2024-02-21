import { doc, setDoc } from "firebase/firestore";
import { FC } from "react";
import { FiUpload } from "react-icons/fi";
import { HiChevronRight } from "react-icons/hi";
import { VscEdit } from "react-icons/vsc";
import { REFS } from "../../../apis/firebase";
import { Tag, TagCategory } from "../../../apis/models";
import permissions from "../../../permissions";
import Button from "../../../reusable/Button";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import LinkWrap from "../../../reusable/LinkWrap";
import SelectMedia from "../EditPrototype/SelectMedia";
import DisplayImage from "../PrototypeOverview/DisplayImage";

const TagView: FC<{
    tagCategory: TagCategory;
    tag: Tag;
}> = ({ tagCategory, tag }) => {
    const { profile } = useCurrentUser();
    return (
        <div className="flex flex-col py-3">
            <div className="flex text-3xl mb-3 mx-5 items-center select-none">
                <div className="flex w-5 h-12 mr-4" style={{ backgroundColor: tagCategory.color }}></div>
                <LinkWrap to="/tags/:tag_category_id">{tagCategory.name}</LinkWrap>
                <HiChevronRight size="1.5em" color={tagCategory.color} />
                {tag.name}
            </div>
            <div className="flex h-full w-full relative">
                {permissions.TENANT(profile).canEdit() && (
                    <div className="absolute right-3 top-3">
                        <SelectMedia
                            filter={["image"]}
                            selectMedia={async (media) => {
                                await setDoc(
                                    doc(REFS.tags, tagCategory.id),
                                    {
                                        tags: {
                                            [tag.name]: {
                                                tag_image_file: media.imageUrl,
                                            },
                                        },
                                    },
                                    { merge: true }
                                );
                                window.location.reload();
                            }}
                            trigger={
                                <Button className="pl-3 py-1">
                                    <FiUpload className="mr-2" />
                                    Attach Image
                                </Button>
                            }
                        />
                    </div>
                )}
                <DisplayImage image_file={tag.tag_image_file} maxHeight={300} />
            </div>
            <div className="px-5 py-3 text-xl">{tag.description}</div>
        </div>
    );
};

export default TagView;
