import React from "react";
import { DaCardIntroBig } from "../molecules/DaCardIntroBig";

const cardData = [
  {
    title: "Vehcile APIs",
    content:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
    buttonText: "Getting started",
    maxWidth: "320px",
  },
  {
    title: "Prototypes",
    content:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
    buttonText: "Getting Started",
    maxWidth: "320px",
  },
  {
    title: "User Feedbacks",
    content:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
    buttonText: "Getting Started",
    maxWidth: "320px",
  },
];

const HomeIntroBlock = () => {
  return (
    <div className="flex justify-center w-full">
      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
        {cardData.map((card, index) => (
          <div className="flex w-full items-center justify-center">
            <DaCardIntroBig
              key={index}
              title={card.title}
              content={card.content}
              buttonText={card.buttonText}
              maxWidth={card.maxWidth}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export { HomeIntroBlock };
