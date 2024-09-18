import { HomeIntroBlock } from '@/components/organisms/HomeIntroBlock'
import { HomePrototypeProposal } from '@/components/organisms/HomePrototypeProposal'
import { cn } from '@/lib/utils'
import { HomePartners } from '@/components/organisms/HomePartners'
import { useTextLib } from '@/hooks/useInstanceCfg'
import { useBackground } from '@/hooks/useInstanceCfg'

const PageHome = () => {
  const txtLib = useTextLib()
  const background = useBackground()
  return (
    <>
      <div className="flex col-span-12 relative min-h-[400px] max-h-[700px] w-full justify-between z-10 overflow-hidden ">
        {/* <div
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
        ></div> */}

        <img
          className=" w-full object-cover z-0 items-center justify-center"
          // src="https://bewebstudio.digitalauto.tech/data/projects/8go3BVLvQX3B/digitalautobg.jpg"
          src="https://covesa.global/wp-content/uploads/2024/03/covesa_homepage_hero_banner_connected_vehicle_network.jpg"
          alt="home-cover"
        ></img>

        <div className="absolute flex h-full items-center justify-start w-full">
          <div className="sm:w-[60%] px-12 z-30">
            <div className="flex flex-col sm:text-xs">
              <div
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: txtLib.home_ads_pan_title }}
              ></div>
              <div
                className="text-white pt-4 text-lg sm:text-normal lg:text-lg"
                dangerouslySetInnerHTML={{ __html: txtLib.home_ads_pan_desc }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 mt-12">
        <HomeIntroBlock />
      </div>

      <div className="col-span-12 mt-12">
        <HomePrototypeProposal />
      </div>

      <div className="col-span-12 mt-12">
        <HomePartners />
      </div>
    </>
  )
}

export default PageHome
