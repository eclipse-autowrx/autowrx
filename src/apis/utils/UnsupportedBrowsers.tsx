import { IsBrowser } from "./browser"
import { IoMdWarning } from "react-icons/io"

const UnsupportedBrowsers = () => {
    if (IsBrowser.Firefox()) {
        return (
            <div className="FIREFOX-WARNING flex w-full h-fit fixed left-0 top-2 pointer-events-none opacity-90" style={{zIndex: 10000}}>
                <div className="flex mx-auto justify-center items-center select-none border-2 border-yellow-500 rounded py-2 bg-white h-fit w-fit px-4 text-2xl">
                    <div className="mr-2 text-yellow-500"><IoMdWarning/></div>
                    <div className="text-black leading-normal text-lg">Firefox isn't fully supported. Please use Chrome for the best experience.</div>
                </div>
            </div>
        )
    }
    return null
}

export default UnsupportedBrowsers