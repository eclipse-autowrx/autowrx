import LinkWrap, { LinkWrapProps } from "./LinkWrap";
import { HiArrowSmRight } from "react-icons/hi";

// as prop can be either "LinkWrap" (for navigating in React App) or "a" (for external links)
// using this as prop, component will have props of either LinkWrap or "a" dynamically
type CustomLinkProps = { title: string } & (
    | ({ as?: "LinkWrap" } & LinkWrapProps)
    | ({ as: "a" } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
);

type GridBox = CustomLinkProps & {
    description: string;
    children?: React.ReactNode;
    secondary?: CustomLinkProps;
};

function GridBox({ title, description, secondary, as = "LinkWrap", ...props }: GridBox) {
    // Get the component to use for the primary and secondary buttons
    const PrimaryComp = (as === "a" ? as : LinkWrap) as any;
    const SecondaryComp = (secondary?.as === "a" ? secondary.as : LinkWrap) as any;

    return (
        <div className="flex flex-col w-full h-full min-h-[250px] rounded border border-gray-200 select-none mx-4">
            <div className="pt-3 pb-3 px-3 justify-center items-center flex-grow">
                <div className="flex items-center justify-center text-xl font-bold text-gray-600 mt-1">{title}</div>
                <div className="p-3 text-center text-gray-700">{description}</div>
            </div>
            <div className="flex justify-center mb-6 gap-x-6 gap-y-1 min-[1440px]:flex-row flex-col">
                <PrimaryComp {...props} className="flex items-center justify-center">
                    <div className="flex items-center border border-gray-300 px-3 py-2 rounded text-aiot-blue font-bold mb-1 hover:bg-aiot-blue/10 hover:border-aiot-blue transition duration-300 cursor-pointer">
                        Get Started <HiArrowSmRight className="w-5 h-5 ml-2" />
                    </div>
                </PrimaryComp>
                {secondary && (
                    <SecondaryComp {...secondary} className="flex items-center justify-center">
                        <div className="flex items-center border border-gray-300 px-3 py-2 rounded text-aiot-blue font-bold mb-1 hover:bg-aiot-blue/10 hover:border-aiot-blue transition duration-300 cursor-pointer">
                            {secondary.title} <HiArrowSmRight className="w-5 h-5 ml-2" />
                        </div>
                    </SecondaryComp>
                )}
            </div>
        </div>
    );
}

export default GridBox;
