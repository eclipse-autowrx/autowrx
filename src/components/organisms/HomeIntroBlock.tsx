import React from "react";
import { DaCardIntroBig } from "../molecules/DaCardIntroBig";

const HomeIntroBlock = () => {
  return (
    <div className="grid w-full items-center grid-cols-1 md:grid-cols-3 gap-4">
      <DaCardIntroBig
        title="Vehcile APIs"
        content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
        buttonText="Getting started"
        maxWidth="320px"
      />
      <DaCardIntroBig
        title="Prototypes"
        content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
        buttonText="Getting Started"
        maxWidth="320px"
      />
      <DaCardIntroBig
        title="User Feedbacks"
        content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
        buttonText="Getting Started"
        maxWidth="320px"
      />
    </div>
  );
};

export { HomeIntroBlock };
