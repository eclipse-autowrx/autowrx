import React from "react";
import { DaCardIntroBig } from "../molecules/DaCardIntroBig";

const cardData = [
  {
    title: "Vehicle API Catalogue",
    content:
      "Browse, explore and enhance the catalogue of Connected Vehicle Interfaces",
    buttonText: "Getting Started",
  },
  {
    title: "Prototyping",
    content:
      "Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle APIs",
    buttonText: "Getting Started",
  },
  {
    title: "User Feedback",
    content:
      "Collect and evaluate user feedback to prioritize your development portfolio",
    buttonText: "Getting Started",
  },
];

const HomeIntroBlock = () => {
  return (
    <div className="flex container justify-center w-full">
      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-12">
        {cardData.map((card, index) => (
          <div className="flex w-full items-center justify-center">
            <DaCardIntroBig
              key={index}
              title={card.title}
              content={card.content}
              buttonText={card.buttonText}
              maxWidth={"600px"}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export { HomeIntroBlock };
