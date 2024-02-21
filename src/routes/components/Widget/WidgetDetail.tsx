import SlickCarousel from "../../../reusable/Carousel/SlickCarousel";
import { TbHeartFilled, TbDownload } from "react-icons/tb";

const WidgetDetail = ({ activeWidget }) => {
    // Check if activeWidget and its properties are defined
    const isWidgetAvailable =
        activeWidget &&
        activeWidget.label &&
        activeWidget.author &&
        activeWidget.desc &&
        activeWidget.thumbnail &&
        activeWidget.images;

    // Default content or error message if activeWidget is not available
    if (!isWidgetAvailable) {
        return (
            <div className="flex flex-col w-full h-fit text-gray-600 bg-gray-100 items-center justify-center px-4 py-12 rounded-lg">
                Please select widget again.
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-fit text-gray-500 pb-2 items-center justify-center">
            <div className="flex w-full">
                <div className="flex w-full h-full">
                    <div className="flex w-[30%] max-w-[200px] h-[40%] max-h-[250px]  rounded-lg overflow-hidden">
                        <img className="rounded-lg object-contain" src={activeWidget.thumbnail} alt="thumbnail" />
                    </div>
                    <div className="flex flex-col w-full pl-5 h-[40%] max-h-[300px]">
                        <div className="flex w-full justify-between items-center">
                            <div className="flex flex-col w-full ">
                                <div className="flex font-bold text-aiot-blue">{activeWidget.label}</div>
                                <div className="flex mr-1 text-xs text-gray-800">{activeWidget.author[0]}</div>
                            </div>
                            <div className="flex w-full space-x-2 items-center justify-end text-xs text-gray-600">
                                <div className="flex items-center justify-center px-2 py-0.5 bg-gray-100 rounded">
                                    <TbHeartFilled className="flex w-3 h-3 text-rose-500 mr-1" />
                                    {activeWidget.likes?.lenght > 0 ? activeWidget.likes.lenght : 0}
                                </div>
                                <div className="flex items-center justify-center px-2 py-0.5 bg-gray-100 rounded">
                                    <TbDownload className="flex w-3 h-3 text-aiot-blue mr-1" />
                                    {activeWidget.downloads}
                                </div>
                            </div>
                        </div>
                        <div className="flex pt-2 whitespace-pre-line leading-tight overflow-y-auto scroll-gray text-sm">
                            {activeWidget.desc}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex w-[90%] pt-4">
                <SlickCarousel images={activeWidget.images} />
            </div>
        </div>
    );
};

export default WidgetDetail;
