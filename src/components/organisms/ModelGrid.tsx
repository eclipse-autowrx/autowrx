import * as React from "react";
import { DaItemVerticalStandard } from "../molecules/DaItemVerticalStandard";
import { DaItemVerticalType2 } from "../molecules/DaItemVerticalType2";
import { DaText } from "../atoms/DaText";
import { models_data } from "@/mock-data/data";
import { useNavigate } from "react-router-dom";

const ModelGrid: React.FC = () => {
  const navigate = useNavigate();

  const handleModelClick = (modelId: string) => {
    navigate(`/model/${modelId}`);
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
        {models_data.map((item, index) => (
          <DaItemVerticalType2
            key={index}
            title={item.name}
            imageUrl={item.model_home_image_file}
            tags={item.tags || []}
            maxWidth="800px"
            onClick={() => {
              handleModelClick(item.id);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export { ModelGrid };
