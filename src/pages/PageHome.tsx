import { HomeIntroBlock } from '@/components/organisms/HomeIntroBlock'
import { HomePrototypeProposal } from '@/components/organisms/HomePrototypeProposal'
import { cn } from '@/lib/utils'
import { DaButton } from '@/components/atoms/DaButton'
import { TbExternalLink } from 'react-icons/tb'
import { DaText } from '@/components/atoms/DaText'
import { HomePartners } from '@/components/organisms/HomePartners'
import { useTextLib } from '@/hooks/useInstanceCfg'

const PageHome = () => {
  const txtLib = useTextLib()
  return (
    <>
      <div className="flex col-span-12 relative min-h-[400px] max-h-[400px] w-full justify-between  scale z-10 overflow-hidden">
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-full bg-gradient-to-r z-0',
            'from-da-gradient-from to-da-gradient-to',
          )}
        ></div>

        <div
          className={cn(
            'absolute top-0 left-0 w-full h-full bg-gradient-to-r z-10 opacity-80',
            'from-da-gradient-from to-da-gradient-to',
          )}
        ></div>

        <img
          className=" w-full object-cover z-0 items-center justify-center"
          src="https://bewebstudio.digitalauto.tech/data/projects/8go3BVLvQX3B/digitalautobg.jpg"
          alt="home-cover"
        ></img>

        <div className="absolute flex h-full items-center justify-end w-full">
          <div className="lg:w-[50%] lg:px-24 px-12 z-30">
            <div className="flex flex-col sm:text-xs">
              <div
                className="text-2xl lg:text-4xl font-bold text-white"
                dangerouslySetInnerHTML={{ __html: txtLib.home_ads_pan_title }}
              ></div>
              <div
                className="text-white pt-2 text-sm lg:text-normal"
                dangerouslySetInnerHTML={{ __html: txtLib.home_ads_pan_desc }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 mt-12 mb-3">
        <HomeIntroBlock />
      </div>

      <div className="col-span-12">
        <HomePrototypeProposal />
      </div>

      <div className="col-span-12">
        <HomePartners />
      </div>
    </>
  )
}

export default PageHome
