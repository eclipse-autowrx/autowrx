import { FC } from "react";
import { DaText } from "../atoms/DaText";
import { DaImage } from "../atoms/DaImage";
import { useParnerList } from "@/hooks/useInstanceCfg";
import { Link } from "react-router-dom";

const partnersData = [
  {
    category: "Industry Partners",
    partners: [
      {
        imageUrl: "https://digitalauto.netlify.app/assets/Bosch-2cbabb81.png",
        alt: "Industry Partner 1",
      },
      {
        imageUrl:
          "https://digitalauto.netlify.app/assets/Dassault-db92600b.png",
        alt: "Industry Partner 2",
      },
    ],
  },
  {
    category: "Standards & Open Source",
    partners: [
      {
        imageUrl: "https://digitalauto.netlify.app/assets/COVESA-b3f64c5b.png",
        alt: "Standards Partner 1",
      },
      {
        imageUrl: "https://digitalauto.netlify.app/assets/Eclipse-ff73acad.png",
        alt: "Standards Partner 2",
      },
    ],
  },
  {
    category: "Academic Partners",
    partners: [
      {
        imageUrl: "https://digitalauto.netlify.app/assets/FSTI-55cf60eb.png",
        alt: "Academic Partner 1",
      },
    ],
  },
];

const HomePartners: FC = () => {
  const partners = useParnerList();
  return (
    <div className="flex flex-col items-center w-full pb-10 mt-12">
      <DaText variant="sub-title" className="text-da-gray-dark">
        Partners
      </DaText>
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-24">
        {partners.map((groups: any, gIndex: number) => (
          <div key={gIndex} className="text-center">
            <DaText
              variant="regular"
              className="flex my-2 justify-center text-da-gray-dark"
            >
              {groups.category}
            </DaText>
            <div className="flex justify-center space-x-4">
              {groups.items.map((partner: any, pIndex: number) => (
                <a key={pIndex} href={partner.url} target="_blank">
                  <DaImage
                    src={partner.img}
                    alt={partner.name}
                    className="w-32 h-20 rounded-lg object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { HomePartners };
