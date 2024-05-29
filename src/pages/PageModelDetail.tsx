import { FC } from "react";
import { Link } from "react-router-dom";
import { DaText } from "@/components/atoms/DaText";
import { DaCardIntro } from "@/components/molecules/DaCardIntro";
import useModelStore from "@/stores/modelStore";
import { Model } from "@/types/model.type";

const PageModelDetail: FC = () => {
  const [model] = useModelStore((state) => [state.model as Model]);

  if (!model) {
    return (
      <div className="container grid place-items-center">
        <div className="p-8 text-da-gray-dark da-label-huge">
          Model not found
        </div>
      </div>
    );
  }

  const cardIntro = [
    {
      title: 'Architecture',
      content: 'Provide the big picture of the vehicle model',
      path: 'architecture',
    },
    {
      title: 'Prototype Library',
      content:
        "Build up, evaluate and prioritize your portfolio of connected vehicle applications",
      path: "library",
    },
    {
      title: 'Vehicle APIs',
      content:
        'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
      path: 'api',
    },
  ]

  return (
    <div className="grid grid-cols-12 h-full px-2 py-4 container space-y-2">
      <div className="col-span-7">
        <DaText variant="title" className="text-da-primary-500">
          {model.name}
        </DaText>

        {cardIntro.map((card, index) => (
          <Link key={index} to={card.path}>
            <div className="space-y-3 mt-3 da-clickable">
              <DaCardIntro
                key={index}
                title={card.title}
                content={card.content}
                maxWidth={'600px'}
              />
            </div>
          </Link>
        ))}
      </div>
      <div className="col-span-5">
        <img src={model.model_home_image_file} alt={model.name} />
      </div>
    </div>
  )
}

export default PageModelDetail
