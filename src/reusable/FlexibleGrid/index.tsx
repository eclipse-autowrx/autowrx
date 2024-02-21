import clsx from "clsx";
import { FC } from "react";
import styles from "./FlexibleGrid.module.scss";

interface FlexibleGridProps {
    children: React.ReactNode;
}

const FlexibleGrid: FC<FlexibleGridProps> = ({ children }) => {
    return <div className={clsx(styles.grid, "p-5 m-5")}>{children}</div>;
};

export default FlexibleGrid;
