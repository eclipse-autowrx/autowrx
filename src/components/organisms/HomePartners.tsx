import * as React from "react";
import { DaText } from "../atoms/DaText";
import { DaImage } from "../atoms/DaImage";

const partnersData = [
  {
    category: "Industry Partners",
    partners: [
      { imageUrl: "imgs/1.jpg", alt: "Industry Partner 1" },
      { imageUrl: "imgs/1.jpg", alt: "Industry Partner 2" },
    ],
  },
  {
    category: "Standards & Open Source",
    partners: [
      { imageUrl: "imgs/1.jpg", alt: "Standards Partner 1" },
      { imageUrl: "imgs/1.jpg", alt: "Standards Partner 2" },
    ],
  },
  {
    category: "Academic Partners",
    partners: [
      { imageUrl: "imgs/1.jpg", alt: "Academic Partner 1" },
      { imageUrl: "imgs/1.jpg", alt: "Academic Partner 2" },
    ],
  },
];

const HomePartners: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full p-8">
      <DaText variant="title" className="text-center text-da-primary-500 mb-4">
        Partners
      </DaText>
      <div className="grid grid-cols-3 gap-12">
        {partnersData.map((categoryData, index) => (
          <div key={index} className="text-center">
            <DaText
              variant="sub-title"
              className="flex my-4 justify-center text-da-gray-dark"
            >
              {categoryData.category}
            </DaText>
            <div className="flex justify-center space-x-4">
              {categoryData.partners.map((partner, idx) => (
                <DaImage
                  key={idx}
                  src={partner.imageUrl}
                  alt={partner.alt}
                  className="w-32 h-20 rounded-lg"
                  ratio={16 / 9}
                  maxWidth="128px"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { HomePartners };
