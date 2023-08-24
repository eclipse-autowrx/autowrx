import clsx from "clsx"
import { FC } from "react"
import styles from "./FixedGrid.module.scss"

interface FixedGridProps {
    className?: string
}

const FixedGrid: FC<FixedGridProps> = ({className}) => {
    return (
        <div className={clsx(styles.FixedGrid, className)}>
            <div>1</div>
            <div>3</div>
            <div>5</div>
            <div>7</div>
            <div>9</div>
            <div>2</div>
            <div>4</div>
            <div>6</div>
            <div>8</div>
            <div>10</div>
        </div>
    )
}

export default FixedGrid