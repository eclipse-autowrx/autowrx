import React, { FC } from "react";
import styles from "./SquareGrid.module.scss";

const SquareGrid: FC<{
    columns: number;
    fixedWidth: string;
    children: React.ReactNode;
}> = ({ columns, children, fixedWidth }) => {
    return (
        <div
            className={styles.SquareGrid}
            style={
                {
                    "--content-width": fixedWidth,
                    "--columns": columns,
                } as any
            }
        >
            {children}
        </div>
    );
};

export default SquareGrid;
