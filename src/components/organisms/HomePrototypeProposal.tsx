import * as React from "react";
import { DaItemVerticalStandard } from "../molecules/DaItemVerticalStandard";
import { DaText } from "../atoms/DaText";

const HomePrototypeProposal: React.FC = () => {
  const items = [
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
    {
      title: "Prototypes",
      content:
        "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout",
      imageUrl: "imgs/1.jpg",
    },
  ];

  return (
    <div className="container flex flex-col w-full p-4 items-center">
      <DaText variant="title" className="text-da-primary-500 py-6">
        Popular Prototypes
      </DaText>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <DaItemVerticalStandard
            key={index}
            title={item.title}
            content={item.content}
            imageUrl={item.imageUrl}
            maxWidth="400px"
          />
        ))}
      </div>
    </div>
  );
};

export { HomePrototypeProposal };
