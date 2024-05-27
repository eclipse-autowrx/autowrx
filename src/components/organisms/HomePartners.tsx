import { FC } from "react";
import { DaText } from "../atoms/DaText";
import { DaImage } from "../atoms/DaImage";
import { useParnerList } from "@/hooks/useInstanceCfg";

const HomePartners: FC = () => {
  const partners = useParnerList();
  return (
    <div className="flex flex-col items-center w-full pb-10 mt-12">
      <DaText variant="sub-title" className="text-da-gray-medium">
        Partners
      </DaText>
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-24">
        {partners.map((groups: any, gIndex: number) => (
          <div key={gIndex} className="text-center">
            <DaText
              variant="regular"
              className="flex my-2 justify-center text-da-gray-medium"
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
