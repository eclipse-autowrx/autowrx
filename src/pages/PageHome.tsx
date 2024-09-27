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
          src={background}
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

      <div className="col-span-12 mt-12">
        <HomeIntroBlock />
      </div>

      <div className="col-span-12 mt-12">
        <HomePrototypeProposal />
      </div>

      {/* <div className="flex flex-col w-full h-[220px] mt-12 text-center justify-center items-center font-medium">
        <div className="max-w-2xl">
          <div className="pb-2 text-xl font-bold text-gray-800">
            Operated by digital.auto
          </div>
          Based on Eclipse SDV autowrx. Join <a>digital.auto</a> to participate
          in our thriving community, enabling next-generation, SDV-enabled
          vehicle experiences
        </div>
        <img src="./imgs/da.png" className="h-[70px] mx-auto mt-4" />
      </div> */}

      <div className="flex w-full h-[180px] mt-12 justify-center items-center font-medium bg-gray-100">
        <div className="flex flex-col w-[40%] ml-12">
          <div className="flex w-full items-center">
            <div className="text-base text-da-gray-dark">Operated by</div>
            <img src="./imgs/da.png" className="h-[50px] w-fit" />
          </div>

          <div className="w-full">
            Based on Eclipse SDV autowrx. Join <a>digital.auto</a> to
            participate in our thriving community, enabling next-generation,
            SDV-enabled vehicle experiences
          </div>
        </div>

        <div className="flex-1 w-full scale-90">
          <HomePartners />
        </div>
      </div>

      {/* <div className="col-span-12 mt-12">
        <HomePartners />
      </div> */}
    </>
  )
}

export default PageHome
