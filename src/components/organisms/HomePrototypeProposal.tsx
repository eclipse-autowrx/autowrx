import * as React from "react";
import { DaItemVerticalStandard } from "../molecules/DaItemVerticalStandard";
import { DaText } from "../atoms/DaText";

const HomePrototypeProposal: React.FC = () => {
  const items = [
    {
      title: "Smart Wipers",
      content: "Wipers need different operating modes depending on environment",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FWipers.jpeg?alt=media&token=33d83cb0-ac4e-4636-a5ae-d39c2d52d571",
    },
    {
      title: "Mercedes-Benz EQS Welcome Sequence",
      content:
        "When the driver approaches the vehicle, the driver wants to be recognized by the vehicle and make individual settings automatically",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FPersonApproachingVehicle_L_1036.png?alt=media&token=710950f6-733c-48df-b9c8-8920bb082e07",
    },
    {
      title: "EQS Dev – Digital Twin",
      content:
        "When the driver approaches the vehicle, the driver wants to be recognized by the vehicle and make individual settings automatically.",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FPersonApproachingVehicle_L_1036.png?alt=media&token=710950f6-733c-48df-b9c8-8920bb082e07",
    },
    {
      title: "EV Power Optimization",
      content:
        "Electric vehicles face mileage crises when running out of battery",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fshutterstock_2076658843O_mod.jpg?alt=media&token=b0018688-29b1-4df1-a633-85bbff84a52e",
    },
    {
      title: "Passenger Welcome V2",
      content: "Welcoming passengers when in close proximity of Vehicle.",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FScreenshot%202023-06-26%20at%2015.58.25.png?alt=media&token=da5b9b60-b063-4cd4-9aea-2891dc637524",
    },
    {
      title: "Driver Distraction Detection [AI + Tensorflow.Js]",
      content:
        "When driving, driver may look left or right for a while, and lost focus on the main road",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fistockphoto-1168160989-612x612.jpg?alt=media&token=ab10f015-94f4-48a9-8cb8-dee55c345c37",
    },
    {
      title: "Anti-Kinetosis With Landing.Ai",
      content:
        "The passengers may feel dizzy when driving at particular locations and speed",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FAntiKinetosis.png?alt=media&token=c1ab5c64-3703-4ad8-a3e9-2f5836626cab",
    },
    {
      title: "Smart Door",
      content:
        "Driver/Passenger often experience inconvenience in manually opening car doors in situations like bad weather or when in a hurry",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2FDALL%C2%B7E%202024-01-18%2011.02.32%20-%20A%20professional%20demonstration%20image%20of%20a%20vehicle's%20auto-door%20opening%20feature%20in%20a%20minimalistic%20style.%20The%20scene%20shows%20a%20regular%20car%20with%20the%20driver's%20s.png?alt=media&token=13df7bff-f0ea-4ccf-b802-61bf2daf6e7f",
    },
  ];

  return (
    <div className="container flex flex-col w-full items-center">
      <DaText variant="sub-title" className="text-da-primary-500 py-6">
        Popular Prototypes
      </DaText>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
