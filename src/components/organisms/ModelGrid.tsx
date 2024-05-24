import { DaItemVerticalStandard } from "../molecules/DaItemVerticalStandard";
import { DaItemVerticalType2 } from "../molecules/DaItemVerticalType2";
import { DaText } from "../atoms/DaText";
import useListModelLite from "@/hooks/useListModelLite";
import { Link } from "react-router-dom";

const ModelGrid: React.FC = () => {
  const { data: data } = useListModelLite();

  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-4">
        {data?.results?.map((item, index) => (
          <Link key={index} to={`/model/${item.id}`}>
            <DaItemVerticalType2
              title={item.name}
              imageUrl={item.model_home_image_file}
              tags={
                item.tags?.map((tag) => `${tag.tagCategoryName}/${tag.tag}`) ||
                []
              }
              maxWidth="800px"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export { ModelGrid };
