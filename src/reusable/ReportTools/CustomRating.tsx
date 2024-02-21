import React, { useState, FC } from "react";

interface CustomRatingProps {
    iconUrl: string;
    ratingText: string;
    isSelected: boolean;
    onSelect: () => void;
    title: string;
}

const CustomRating: React.FC<CustomRatingProps> = ({ iconUrl, ratingText, isSelected, onSelect, title }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={`cursor-pointer flex flex-col items-center space-y-2 text-center
                ${isSelected || hovered ? "text-aiot-blue" : "text-gray-400"}`}
            onClick={onSelect}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img
                src={iconUrl}
                title={title}
                className={`h-10 w-10 ${isSelected || hovered ? "filter-none" : "filter grayscale"}`}
            />
            <p className={`text-xs ${isSelected ? "font-bold" : "font-normal"}`}>{ratingText}</p>
        </div>
    );
};

export default CustomRating;
