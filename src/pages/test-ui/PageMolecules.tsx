import { DaText } from "@/components/atoms/DaText";
import { DaApiList } from "@/components/molecules/DaApiList";
import { DaCardIntro } from "@/components/molecules/DaCardIntro";
import { DaCardIntroBig } from "@/components/molecules/DaCardIntroBig";
import { DaItemStandard } from "@/components/molecules/DaItemStandard";
import { DaItemVerticalStandard } from "@/components/molecules/DaItemVerticalStandard";
import { DaItemVerticalType2 } from "@/components/molecules/DaItemVerticalType2";
import { DaTableProperty } from "@/components/molecules/DaTableProperty";

const PageMolecules = () => {
  const properties = [
    {
      property: "Property #1",
      value:
        "It is a long established fact a reader will be distracted by the readable content of a page",
    },
    { property: "Property #2", value: "Property Value 2" },
    { property: "Property #3", value: "Property Value 3" },
    { property: "Property #4", value: "Property Value 4" },
  ];

  const apis = [
    { api: "Vehicle.ADAS", type: "Branch" },
    { api: "Vehicle.ADAS.ABS.IsEnabled", type: "Actuator" },
    { api: "Vehicle.ADAS.ABS.IsError", type: "Sensor" },
    { api: "Vehicle.ADAS.CruiseControl.IsEnabled", type: "Actuator" },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-white">
      <div className="col-span-full flex flex-col px-2 container space-y-2">
        <DaText variant="sub-title" className="text-da-gray-medium">
          DaCardIntro
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaCardIntro
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout "
            maxWidth="320px"
          />
          <DaCardIntro
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="600px"
          />
          <DaCardIntro
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="320px"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-medium pt-4">
          DaCardIntroBig
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaCardIntroBig
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="320px"
            buttonText="Learn More"
          />
          <DaCardIntroBig
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="600px"
            buttonText="Learn More"
          />
          <DaCardIntroBig
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            maxWidth="320px"
            buttonText="Learn More"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-medium pt-4">
          DaItemStandard
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaItemStandard
            title="Prototypes"
            author="John Doe"
            content="It is a long
                established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            tags={["Tag1", "Tag2"]}
            imageUrl="/imgs/1.jpg"
            avatarUrl="/imgs/2.jpg"
            maxWidth="500px"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-medium pt-4">
          DaItemVerticalStandard
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaItemVerticalStandard
            title="Prototypes"
            content="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout"
            imageUrl="/imgs/1.jpg"
            maxWidth="500px"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-medium pt-4">
          DaItemVerticalType2
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaItemVerticalType2
            title="Prototypes"
            imageUrl="/imgs/1.jpg"
            tags={["Tag1", "Tag2"]}
            maxWidth="500px"
          />
        </div>
        <DaText variant="sub-title" className="text-da-gray-medium pt-4">
          DaTableProperty
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaTableProperty properties={properties} maxWidth="500px" />
        </div>
        <DaText variant="sub-title" className="text-da-gray-medium pt-4">
          DaApiList
        </DaText>
        <div className="flex mt-2 space-x-4 p-4 border rounded-lg">
          <DaApiList apis={apis} />
        </div>
      </div>
    </div>
  );
};

export default PageMolecules;
