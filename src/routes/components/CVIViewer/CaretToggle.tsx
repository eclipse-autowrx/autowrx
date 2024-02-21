import clsx from "clsx";
import { HiChevronUp } from "react-icons/hi";
import { HiChevronRight } from "react-icons/hi";

interface CaretToggleProps {
    label: string;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CaretToggle = ({ label, open, setOpen }: CaretToggleProps) => {
    return (
        <div className="flex items-center cursor-pointer font-bold" onClick={() => setOpen(!open)}>
            <HiChevronRight size="1.3em" className={clsx("transition", open && "rotate-90")} /> {label}
        </div>
    );
};

export default CaretToggle;
