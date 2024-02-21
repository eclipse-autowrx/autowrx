import { useState, useEffect, useRef } from "react";
import CustomDisplayImage from "../../routes/components/PrototypeOverview/CustomDisplayImage";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import ImageModalContent from "./ImageModalContent";

interface SlickCarouselProps {
    images: any[];
}

const SlickCarousel = ({ images }: SlickCarouselProps) => {
    const GAP = 15;
    const FIXED_CAROUSEL_HEIGHT = 200;

    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageWidths, setImageWidths] = useState<number[]>(new Array(images.length).fill(0));

    const updateImageWidth = (index: number, width: number) => {
        setImageWidths((prevWidths) => {
            const newWidths = [...prevWidths];
            newWidths[index] = width;
            return newWidths;
        });
    };

    useEffect(() => {
        setCurrentSlide(0);
    }, [images]);

    const handleNext = () => {
        if (currentSlide < images.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const imageRefs = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        const actualWidths = imageRefs.current.map((ref) => (ref ? ref.offsetWidth : 0));
        setImageWidths(actualWidths);
    }, [images]);

    const canScrollNext = () => {
        const visibleWidth = carouselRef.current ? carouselRef.current.offsetWidth : 0; // Width of the carousel container
        const totalContentWidth = imageWidths.reduce((total, width, index) => {
            // Total width of all images and gaps
            return total + width + (index < imageWidths.length - 1 ? GAP : 0); // Add gap for all but last image
        }, 0);

        const scrollPosition = imageWidths.slice(0, currentSlide).reduce((total, width, index) => {
            // Total width of all images and gaps up to currentSlide
            return total + width + (index < currentSlide - 1 ? GAP : 0);
        }, 0);
        // console.log("scrollPosition", scrollPosition, "visibleWidth", visibleWidth, "totalContentWidth", totalContentWidth)
        return scrollPosition + visibleWidth < totalContentWidth;
    };

    function openModal(index: number) {
        setCurrentImageIndex(index);
        setModalIsOpen(true);
    }

    return (
        <div className={`relative flex w-full h-[${FIXED_CAROUSEL_HEIGHT}px] items-center`} ref={carouselRef}>
            {currentSlide > 0 && (
                <button
                    onClick={handlePrev}
                    className="absolute flex left-[-1.5rem] z-10 w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-gray-100 items-center justify-center"
                >
                    <TbChevronLeft className="flex w-7 h-7 text-gray-600" style={{ strokeWidth: 1.7 }} />
                </button>
            )}

            <div className="overflow-hidden w-full h-full flex">
                <div
                    className={`flex transition-transform`}
                    style={{
                        columnGap: `${GAP}px`,
                        transform: `translateX(-${
                            imageWidths.slice(0, currentSlide).reduce((total, width) => total + width, 0) +
                            GAP * currentSlide
                        }px)`,
                    }}
                >
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`flex-none rounded-lg border border-gray-200 overflow-hidden hover:border-gray-400 cursor-pointer carousel-image-${index}`}
                            style={{
                                height: `${FIXED_CAROUSEL_HEIGHT}px`,
                                width: `${imageWidths[index]}px`, // Apply the calculated width here
                            }}
                            ref={(el) => {
                                if (el) {
                                    imageRefs.current[index] = el;
                                }
                            }}
                            onClick={() => openModal(index)}
                        >
                            <CustomDisplayImage
                                image_file={image}
                                aspectRatio="auto"
                                objectFit="contain"
                                minHeight={FIXED_CAROUSEL_HEIGHT}
                                isBlur={false}
                                onImageLoad={(width) => updateImageWidth(index, width)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {canScrollNext() && (
                <button
                    onClick={handleNext}
                    className="absolute flex right-[-1.5rem] z-10 w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-gray-100 items-center justify-center"
                >
                    <TbChevronRight className="flex w-7 h-7 text-gray-600" style={{ strokeWidth: 1.7 }} />
                </button>
            )}
            <div className="absolute">
                <ImageModalContent
                    images={images}
                    currentImageIndex={currentImageIndex}
                    isVisible={modalIsOpen}
                    onClose={() => setModalIsOpen(false)}
                />
            </div>
        </div>
    );
};

export default SlickCarousel;
