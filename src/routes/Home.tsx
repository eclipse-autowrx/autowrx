import styles from "./Home.module.scss";
import NavigationSection from "./HomeSections/NavigationSection";
import DemoSection from "./HomeSections/DemoSection";

const Home = () => {
    return (
        <div
            className={`${styles.homePageContainer}`}
            style={{ scrollSnapType: "y mandatory", height: "100%", overflowY: "scroll" }}
        >
            <div className="h-full flex flex-col items-center justify-center" style={{ scrollSnapAlign: "start" }}>
                <NavigationSection />
            </div>
            {/* List of demo prototypes */}
            <div className="h-full flex flex-col items-center justify-center" style={{ scrollSnapAlign: "start" }}>
                <DemoSection />
            </div>
        </div>
    );
};

export default Home;
