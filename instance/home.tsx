import { TbExternalLink } from 'react-icons/tb'
import { DaButton } from '@/components/atoms/DaButton'
import DaRequireSignedIn from '@/components/molecules/DaRequireSignedIn'
import DisabledLink from '@/components/molecules/DaDisableLink'

const home = [
  {
    type: 'hero',
    title: 'Welcome to the digital.auto Playground for Virtual Exploration!',
    description: `To support shift-left testing for software-defined vehicle (SDV) applications, we've created the digital.auto Playground—a cloud-based environment designed for rapid prototyping of new SDV-enabled features. Prototypes are developed against real-world vehicle APIs and can seamlessly transition to automotive runtimes, such as Eclipse Velocitas. The playground is open and free to use.`,
    image: '/imgs/autowrx-bg.jpg',
  },
  {
    type: 'feature-list',
    items: [
      {
        title: 'Overview',
        description:
          'Get an overview of the cloud-based prototyping environment for SDV functions.',
        children: (
          <DaButton size="sm" className="mt-4">
            <a
              href="https://docs.digital.auto/basics/overview/"
              target="_blank"
              className="flex items-center"
            >
              <TbExternalLink className="size-4 mr-1" />
              Graphic
            </a>
          </DaButton>
        ),
      },
      {
        title: 'Get Started',
        description:
          'Learn about creating efficient SDV applications, using Python and Vehicle Signals',
        children: (
          <div className="flex space-x-2 items-center mt-4">
            <DaButton size="sm">
              <a
                href="https://docs.digital.auto/basics/play/"
                target="_blank"
                className="flex items-center"
              >
                <TbExternalLink className="size-4 mr-1" />
                Documentation
              </a>
            </DaButton>
            <DaButton variant="outline-nocolor" size="sm">
              <a
                href="https://www.youtube.com/@sdvpg"
                target="_blank"
                className="flex items-center"
              >
                <TbExternalLink className="size-4 mr-1" />
                Video
              </a>
            </DaButton>
          </div>
        ),
      },
      {
        title: 'Vehicle Catelog',
        description:
          'Create a model to start building new connected vehicle app prototypes.',
        children: (
          <DaRequireSignedIn message="You must first sign in to explore vehicle models and prototypes">
            <DaButton size="sm" className="mt-4">
              <DisabledLink to="/model" className="flex items-center">
                Vehicle Models
              </DisabledLink>
            </DaButton>
          </DaRequireSignedIn>
        ),
      },
    ],
  },
  // {
  //   type: 'button-list',
  //   requiredLogin: true,
  //   items: [
  //     {
  //       type: 'new-model',
  //       title: 'New model',
  //       description: 'Create a vehicle model',
  //       icon: <FaCar className="h-7 w-7 text-da-primary-500" />,
  //     },
  //     {
  //       type: 'new-prototype',
  //       title: 'New prototype',
  //       description: 'Develop vehicle app',
  //       icon: <TbCode className="h-7 w-7 text-da-primary-500" />,
  //     },
  //     {
  //       type: 'import-prototype',
  //       title: 'Import prototype',
  //       description: 'Import existing prototype',
  //       icon: <TbPackageImport className="h-7 w-7 text-da-primary-500" />,
  //     },
  //     {
  //       title: 'My models',
  //       description: 'Go to my models',
  //       url: '/model',
  //       icon: <TbArrowRight className="h-7 w-7 text-da-primary-500" />,
  //     },
  //   ],
  // },
  {
    type: 'news',
    title: 'Top News',
    items: [
      {
        title: 'Playground Introduction',
        type: 'News',
        date: '2 December 2024',
        description:
          'Explore the future of our digital.auto community with Prof. Dirk Slama with digital.auto playground.',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/scqSwlCPJDj9/playground-introduction.png',
        redirectURL: 'https://youtu.be/K3pindMCq1c',
      },
      {
        title: 'digital.auto Meetup',
        type: 'Event',
        date: '26 November 2024',
        description:
          'Join Prof. Dirk Slama to discuss the roadmap and priorities of our digital.auto community in 2025. Meet Fabio Violante (CEO Arduino) to discuss our plans for an open E/E Starter Kit for SDVs',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/VOMpcykPhfIC/digital.auto%20Meetup.png',
        redirectURL:
          'https://www.linkedin.com/posts/digitalauto_join-prof-dirk-slama-to-discuss-the-roadmap-activity-7255901526752219137-RFLH?utm_source=share&utm_medium=member_desktop',
      },
      {
        title: 'Zonal E/E architecture | digital.auto x MiX',
        date: '25 October 2024',
        type: 'News',
        description:
          'The Bosch MiX project has developed a demonstrator platform for real-time applications in a zonal E/E architecture utilizing NXP hashtag#S32G3 and Yocto Linux.',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/VOMpcykPhfIC/Central%20Compute%20with%20Zones.png',
        redirectURL: 'https://www.youtube.com/watch?v=M2o3h4anJ_s',
      },
      {
        title: 'GenAI Awards',
        type: 'Event',
        date: '1 January 2025',
        description:
          'Join us to harness the power of GenAI for the software-defined vehicle (SDV). Win the digital.auto GenAI award by participating in our quarterly competitions. We are looking for novel ways to apply multimodel GenAI to create visually rich',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/8go3BVLvQX3B/GenAI_Cover.png',
        redirectURL: 'https://www.digital.auto/genai-award',
      },
    ],
  },
  {
    type: 'recent',
    title: 'Recent Prototypes',
  },
  {
    type: 'popular',
    title: 'Popular Prototypes',
  },
  {
    type: 'partner-list',
    items: [
      {
        title: 'Industry Partners',
        items: [
          {
            name: 'Bosch',
            img: 'https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/bosch.png',
            url: 'https://www.bosch.com/',
          },
          {
            name: 'Dassault Systems',
            img: 'https://www.3ds.com/assets/3ds-navigation/3DS_corporate-logo_blue.svg',
            url: 'https://www.3ds.com/',
          },
        ],
      },
      {
        title: 'Standards & Open Source',
        items: [
          {
            name: 'COVESA',
            img: 'https://digitalauto.netlify.app/assets/COVESA-b3f64c5b.png',
            url: 'https://www.covesa.global',
          },
          {
            name: 'Eclipse Foundation',
            img: 'https://www.eclipse.org/eclipse.org-common/themes/solstice/public/images/logo/eclipse-foundation-grey-orange.svg',
            url: 'https://www.eclipse.org',
          },
        ],
      },
      {
        title: 'Academic Partners',
        items: [
          {
            name: 'Ferdinand-Steinbeis-Institut',
            img: 'https://digitalauto.netlify.app/assets/FSTI-55cf60eb.png',
            url: 'https://ferdinand-steinbeis-institut.de',
          },
        ],
      },
    ],
  },
]

export default home
