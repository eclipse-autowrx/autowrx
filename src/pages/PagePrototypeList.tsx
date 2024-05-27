import { useState } from "react";
import PrototypeSummary from "@/components/organisms/PrototypeSummary";
import { DaInput } from "@/components/atoms/DaInput";
import { DaItemStandard } from "@/components/molecules/DaItemStandard";
import { prototypes } from "@/data/models_mock";

const PagePrototypeList = () => {
  const [selectedPrototype, setSelectedPrototype] = useState(prototypes[0]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4 px-4">
        <DaInput
          type="text"
          placeholder="Enter to search"
          className="w-full pl-4 mb-4"
        />
        {prototypes.map((prototype, index) => (
          <div
            key={index}
            onClick={() => setSelectedPrototype(prototype)}
            className="cursor-pointer mb-4"
          >
            <DaItemStandard
              title={prototype.name}
              author={"John Doe"}
              content={prototype.description.problems}
              tags={prototype.tags}
              imageUrl={prototype.image_file}
              avatarUrl="/imgs/2.jpg"
              maxWidth="1000px"
            />
          </div>
        ))}
      </div>
      <div className="col-span-8">
        {selectedPrototype && (
          <PrototypeSummary
            prototypeName={selectedPrototype.name}
            prototypeImageUrl={selectedPrototype.image_file}
            prototypeAuthorAvatarUrl="https://avatars.githubusercontent.com/u/115630638?v=4"
            prototypeAuthorName="John Doe"
            prototypeTags={["tag1", "tag2", "tag3"]}
            prototypeProperties={[
              { property: "property1", value: "value1" },
              { property: "property2", value: "value2" },
              { property: "property3", value: "value3" },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default PagePrototypeList;
