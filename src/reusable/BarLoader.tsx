import styles from "./BarLoader.module.scss";

const BarLoader = () => {
    return (
        <div className={styles.Box}>
            <div className={styles.Loader}></div>
        </div>
    );
};

export default BarLoader;
