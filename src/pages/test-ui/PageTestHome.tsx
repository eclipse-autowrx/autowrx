import { HomeIntroBlock } from '@/components/organisms/HomeIntroBlock'
import { HomePrototypeProposal } from '@/components/organisms/HomePrototypeProposal'
import { cn } from '@/lib/utils'
import { DaButton } from '@/components/atoms/DaButton'
import { TbExternalLink } from 'react-icons/tb'
import { DaText } from '@/components/atoms/DaText'
import { HomePartners } from '@/components/organisms/HomePartners'

const PageHome = () => {
  return (
    <div className="grid grid-cols-12 bg-white">
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
              <div className="flex relative text-2xl lg:text-4xl font-bold text-white">
                Welcome to digital.auto playground for virtual exploration
              </div>
              <div className="flex text-white pt-2 text-sm lg:text-normal">
                To support shift-level testing for software-defined vehicle
                (SDV) applications, we have created the digital.auto playground.
                This is a cloud-based, rapid prototyping environment for new,
                SDV-enabled features. The prototypes are built against
                real-world vehicle APIs and can be seamlessly migrated to
                automotive runtimes, such as Eclipse Velocitas. The playground
                is open and free to use.
              </div>
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

      <div className="col-span-12 mt-12">
        <div className="flex flex-col space-y-3 items-center justify-center min-h-fit text-white bg-da-primary-500 py-6">
          <DaText variant="title" className="text-3xl font-bold">
            digital.auto
          </DaText>
          <DaText variant="regular">Working together to create</DaText>
          <DaText variant="regular">
            the software-defined vehicle experience
          </DaText>
          <DaButton
            className="border border-white rounded-lg text-white py-2 my-4 px-4"
            onClick={() => {
              window.open('https://www.digital.auto/', '_blank')
            }}
          >
            <TbExternalLink className="mr-2" /> About digital.auto
          </DaButton>
        </div>
      </div>

      <div className="col-span-12">
        <HomePartners />
      </div>
    </div>
  )
}

export default PageHome
