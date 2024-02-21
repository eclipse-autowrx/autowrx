import HomeCover from "../../assets/HomeCover.png";
import NewHomeCover from "../../assets/NewHome.jpg";
import GridBox from "../../reusable/GridBox";
import BoschLogo from "../../assets/Logos/Bosch.png";
import DassaultLogo from "../../assets/Logos/Dassault.png";
import EclipseLogo from "../../assets/Logos/Eclipse.png";
import FSTILogo from "../../assets/Logos/FSTI.png";
import COVESALogo from "../../assets/Logos/COVESA.png";

const NavigationSection = () => {
    return (
        <div className="flex flex-col w-full h-full justify-between">
            {/* Navigation */}
            <img className="w-full h-[40%]" src={HomeCover} alt="home-cover"></img>
            {/* <div className="flex relative w-full h-[50%] bg-[#F9FAFA]">
                <img className="w-full h-auto object-contain" src={NewHomeCover} alt="home-cover"></img>
            </div> */}

            <div className="flex flex-col px-12 h-[40%] justify-center items-center ">
                <div className="flex w-full h-full">
                    <GridBox
                        to="/model/STLWzk1WyqVVLbfymb4f/cvi/list"
                        title="Vehicle API Catalogue"
                        description="Browse, explore and enhance the catalogue of Connected Vehicle Interfaces"
                    />
                    <GridBox
                        to="/model"
                        title="Prototyping"
                        description="Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle APIs"
                        secondary={{
                            title: "Widget Marketplace",
                            href: "https://marketplace.digitalauto.tech/packagetype/widget",
                            target: "_blank",
                            as: "a",
                        }}
                    />
                    <GridBox
                        to="/model"
                        title="User Feedback"
                        description="Collect and evaluate user feedback to prioritize your development portfolio"
                    />
                </div>
            </div>

            <div className="flex flex-col w-full h-[10%] justify-end items-end">
                {/* List of partners */}
                <div className="flex flex-col w-full h-auto pb-4 justify-bottom">
                    {/* <div className="flex w-full text-3xl text-aiot-blue justify-center">Partners</div> */}
                    <div className="flex w-full justify-center mt-4 space-x-24">
                        <div className="flex flex-col">
                            <div className="flex justify-center text-bold text-gray-500 mb-2">Industry Partners</div>
                            <div className="flex justify-center   w-full h-full" style={{ width: "200px" }}>
                                <a href="https://www.bosch.com/" className="flex w-6/12 px-2">
                                    <img src={BoschLogo} alt="Bosch" className="object-scale-down" />
                                </a>
                                <a href="https://www.3ds.com/" className="flex w-6/12 px-2">
                                    <img src={DassaultLogo} alt="Dassault" className="object-scale-down" />
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-center text-gray-500 mb-2">Standards & Open Source</div>
                            <div className="flex justify-center   w-full h-full" style={{ width: "200px" }}>
                                <a href="https://www.covesa.global/" className="flex w-6/12 px-2">
                                    <img src={COVESALogo} alt="COVESA" className="object-scale-down" />
                                </a>
                                <a href="https://www.eclipse.org/" className="flex w-6/12 px-2">
                                    <img src={EclipseLogo} alt="Eclipse" className="object-scale-down" />
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-center text-gray-500 mb-2">Academic Partners</div>
                            <div className="flex justify-center   w-full h-full" style={{ width: "200px" }}>
                                <a href="https://ferdinand-steinbeis-institut.de/" className="flex w-6/12 px-2">
                                    <img
                                        src={FSTILogo}
                                        alt="Ferdinand-Steinbeis-Institut"
                                        className="object-scale-down"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationSection;
