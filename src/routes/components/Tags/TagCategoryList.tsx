import clsx from "clsx";
import { HiChevronRight, HiPlus } from "react-icons/hi";
import permissions from "../../../permissions";
import useAsyncRefresh from "../../../reusable/hooks/useAsyncRefresh";
import { useCurrentTenantTagCategories } from "../../../reusable/hooks/useCurrentTenantTagCategories";
import useCurrentUser from "../../../reusable/hooks/useCurrentUser";
import { useParamsX } from "../../../reusable/hooks/useUpdateNavigate";
import LinkWrap from "../../../reusable/LinkWrap";
import SideNav from "../../../reusable/SideNav/SideNav";
import LoadingPage from "../LoadingPage";
import CreateNewTagCategorySidenav from "./CreateNewTagSidenav";
import styles from "./styles.module.scss";
import TagCategoryView from "./TagCategoryView";

const TagCategoryList = () => {
    const tagCategories = useCurrentTenantTagCategories();
    const { tag_category_id } = useParamsX();
    const { profile } = useCurrentUser();

    if (tag_category_id) {
        const selectedTagCategory = tagCategories.find((tagCategory) => tag_category_id === tagCategory.id);
        if (!selectedTagCategory) {
            return (
                <div className="flex flex-col justify-center items-center h-full pb-36 select-none">
                    <div className="text-9xl text-gray-400 leading-normal">404</div>
                    <div className="text-5xl text-gray-400">Tag Category doesn't exist.</div>
                </div>
            );
        } else {
            return <TagCategoryView tagCategory={selectedTagCategory} />;
        }
    }

    return (
        <div className="flex flex-col px-4 py-3 select-none">
            <div className="flex text-3xl mb-7">Tag Categories</div>
            <div className="grid grid-cols-3 gap-5">
                {tagCategories.map((tagCategory) => (
                    <LinkWrap to={`/tags/${tagCategory.id}`}>
                        <div className={clsx("flex h-10 items-center text-xl cursor-pointer", styles.TagCategory)}>
                            <div className="flex w-4 h-full" style={{ backgroundColor: tagCategory.color }}></div>
                            <div className="pl-3">{tagCategory.name}</div>
                            <HiChevronRight className={"ml-auto invisible"} size="1.7em" color={tagCategory.color} />
                        </div>
                    </LinkWrap>
                ))}
                {permissions.TENANT(profile).canEdit() && (
                    <SideNav
                        width="400px"
                        className="h-full"
                        trigger={
                            <div
                                className="flex rounded border-2 items-center border-dashed text-gray-400 hover:border-gray-300 cursor-pointer transition min px-2"
                                style={{ minHeight: 40 }}
                            >
                                <div>New Tag Category</div>
                                <HiPlus className="ml-auto" size="1.5em" />
                            </div>
                        }
                    >
                        <CreateNewTagCategorySidenav />
                    </SideNav>
                )}
                <div></div>
            </div>
        </div>
    );
};

export default TagCategoryList;
