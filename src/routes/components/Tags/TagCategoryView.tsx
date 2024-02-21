import clsx from "clsx";
import { FC } from "react";
import { HiPlus } from "react-icons/hi";
import { TagCategory } from "../../../apis/models";
import { useParamsX } from "../../../reusable/hooks/useUpdateNavigate";
import Input from "../../../reusable/Input/Input";
import LinkWrap from "../../../reusable/LinkWrap";
import SideNav from "../../../reusable/SideNav/SideNav";
import DisplayImage from "../PrototypeOverview/DisplayImage";
import CreateNewTagSidenav from "./CreateNewTag";
import TagView from "./TagView";

const TagCategoryView: FC<{
    tagCategory: TagCategory;
}> = ({ tagCategory }) => {
    const { tag_name } = useParamsX();

    if (tag_name) {
        if (!tagCategory.tags[tag_name]) {
            return (
                <div className="flex flex-col justify-center items-center h-full pb-36 select-none">
                    <div className="text-9xl text-gray-400 leading-normal">404</div>
                    <div className="text-5xl text-gray-400">Tag doesn't exist.</div>
                </div>
            );
        } else {
            return <TagView tagCategory={tagCategory} tag={tagCategory.tags[tag_name]} />;
        }
    }

    return (
        <div className="flex flex-col px-5 py-3">
            <div className="flex text-3xl items-center mb-6">
                <div className="flex w-5 h-12" style={{ backgroundColor: tagCategory.color }}></div>
                <div className="ml-4 select-none">{tagCategory.name}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full h-full">
                {Object.values(tagCategory.tags).map((tag) => {
                    return (
                        <LinkWrap to={`/tags/:tag_category_id/${tag.name}`} className="mr-2 w-full">
                            <div className="flex flex-col w-full h-full rounded-lg overflow-hidden select-none border border-gray-200 hover:border-aiot-blue transition duration-300">
                                <div className="flex items-center py-3 px-5 text-2xl text-aiot-blue">{tag.name}</div>
                                <DisplayImage image_file={tag.tag_image_file} />
                            </div>
                        </LinkWrap>
                    );
                })}
                <SideNav
                    trigger={
                        <div
                            className={clsx(
                                "flex rounded-lg border-4 border-dashed items-center justify-center text-gray-200 hover:border-gray-300 hover:text-gray-300 cursor-pointer transition min"
                            )}
                            style={{ minHeight: 180 }}
                        >
                            <HiPlus className="text-5xl" />
                        </div>
                    }
                    width="400px"
                    className="p-4 h-full"
                >
                    <CreateNewTagSidenav tagCategory={tagCategory} />
                </SideNav>
            </div>
        </div>
    );
};

export default TagCategoryView;
