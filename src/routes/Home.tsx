import HomeCover from "../assets/HomeCover.png"
import GridBox from "../reusable/GridBox"
import BoschLogo from "../assets/Logos/Bosch.png"
import DassaultLogo from "../assets/Logos/Dassault.png"
import EclipseLogo from "../assets/Logos/Eclipse.png"
import FSTILogo from "../assets/Logos/FSTI.png"
import COVESALogo from "../assets/Logos/COVESA.png"

const Home = () => {
    return (
        <div className="flex flex-col h-full select-none">
            <img src={HomeCover} alt="home-cover"></img>
            <div className="flex flex-col py-5 px-12 h-full">
                <div className="flex h-full">
                    <GridBox to="/model" title="Vehicle API Catalogue" description="Browse, explore and enhance the catalogue of Connected Vehicle Interfaces"  />
                    <GridBox to="/model" title="Prototyping" description="Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle APIs"  />
                    <GridBox to="/model" title="User Feedback" description="Collect and evaluate user feedback to prioritize your development portfolio"  />
                </div>
            </div>
            <div className="flex pb-4 justify-center w-full mt-auto">
                <div className="flex flex-col px-4">
                    <div className="flex justify-center text-gray-500 mb-2">Industry Partners</div>
                    <div className="flex justify-center m-auto" style={{width: "200px"}}>
                        <a href="https://www.bosch.com/" className="flex w-6/12 px-2">
                            <img src={BoschLogo} alt="Bosch" className="object-scale-down" />
                        </a>
                        <a href="https://www.3ds.com/" className="flex w-6/12 px-2">
                            <img src={DassaultLogo} alt="Dassault" className="object-scale-down" />
                        </a>
                    </div>
                </div>
                <div className="flex flex-col px-4">
                    <div className="flex justify-center text-gray-500 mb-2">Standards & Open Source</div>
                    <div className="flex justify-center m-auto" style={{width: "200px"}}>
                        <a href="https://www.covesa.global/" className="flex w-6/12 px-2">
                            <img src={COVESALogo} alt="COVESA" className="object-scale-down" />
                        </a>
                        <a href="https://www.eclipse.org/" className="flex w-6/12 px-2">
                            <img src={EclipseLogo} alt="Eclipse" className="object-scale-down" />
                        </a>
                    </div>
                </div>
                <div className="flex flex-col  px-4">
                    <div className="flex justify-center text-gray-500 mb-2">Academic Partners</div>
                    <div className="flex justify-center m-auto" style={{width: "200px"}}>
                        <a href="https://ferdinand-steinbeis-institut.de/" className="flex w-6/12 px-2">
                            <img src={FSTILogo} alt="Ferdinand-Steinbeis-Institut"  className="object-scale-down" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home