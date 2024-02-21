import React, { useState, useEffect, useRef } from "react";
import { TbChevronLeft, TbChevronRight, TbX } from "react-icons/tb";
import CustomModal from "../Popup/CustomModal";
import Button from "../Button";

interface ImageModalContentProps {
    images: any[];
    isVisible: boolean;
    onClose: () => void;
    currentImageIndex: number;
}

const ImageModalContent = ({ images, isVisible, currentImageIndex, onClose }: ImageModalContentProps) => {
    const [currentSlide, setCurrentSlide] = useState(currentImageIndex);

    useEffect(() => {
        setCurrentSlide(currentImageIndex);
    }, [currentImageIndex, isVisible]);

    const goToNextImage = () => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % images.length);
    };

    const goToPreviousImage = () => {
        setCurrentSlide((prevSlide) => (prevSlide - 1 + images.length) % images.length);
    };

    if (!isVisible) return null;

    return (
        <CustomModal
            isOpen={isVisible}
            onClose={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
            }}
        >
            {/* Transparent overlay for closing the modal when clicked */}
            {/* <div className="absolute top-0 left-0 w-full h-full z-100" onClick={onClose}></div> */}

            {currentSlide > 0 && (
                <button
                    onClick={goToPreviousImage}
                    className="absolute flex top-50 left-10 z-50 w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-gray-200 items-center justify-center"
                >
                    <TbChevronLeft className="flex w-7 h-7 text-gray-600" style={{ strokeWidth: 1.7 }} />
                </button>
            )}

            <img
                src={images[currentSlide]}
                alt="Selected"
                className="absolute top-50 left-50 flex justify-center w-[80%] h-[60%] items-center object-contain max-w-max max-h-max overflow-hidden rounded-lg blur-0"
            />

            {currentSlide < images.length - 1 && (
                <button
                    onClick={goToNextImage}
                    className="absolute flex top-50 right-10 z-50 w-12 h-12 rounded-full bg-white border border-gray-200 shadow hover:bg-gray-200 items-center justify-center"
                >
                    <TbChevronRight className="flex w-7 h-7 text-gray-600" style={{ strokeWidth: 1.7 }} />
                </button>
            )}

            <Button
                onClick={onClose}
                icon={TbX}
                variant="neutral"
                iconClassName="w-12 h-12 text-white absolute top-5 right-5"
            ></Button>
        </CustomModal>
    );
};

export default ImageModalContent;
