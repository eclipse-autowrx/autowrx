import { title } from 'process'
import { BsStars } from 'react-icons/bs'
import { FaCar } from 'react-icons/fa'
import { TbArrowRight, TbCode, TbPackageImport } from 'react-icons/tb'

const home = [
  {
    type: 'hero',
    title: 'Welcome to digital.auto playground for virtual exploration',
    description:
      'To support shift-level testing for software-defined vehicle (SDV) applications, we have created the digital.auto playground. This is a cloud-based, rapid prototyping environment for new, SDV-enabled features. The prototypes are built against real-world vehicle APIs and can be seamlessly migrated to automotive runtimes, such as Eclipse Velocitas. The playground is open and free to use.',
    image: '/imgs/autowrx-bg.jpg',
  },
  {
    type: 'feature-list',
    items: [
      {
        title: 'Vehicle Signal Catalogue',
        description:
          'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
        url: 'https://digital.auto',
      },
      {
        title: 'Prototyping',
        description:
          'Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle Signals',
        url: 'https://digital.auto',
      },
      {
        title: 'User Feedback',
        description:
          'Collect and evaluate user feedback to prioritize your development portfolio',
        url: 'https://digital.auto',
      },
    ],
  },
  {
    type: 'button-list',
    requiredLogin: true,
    items: [
      {
        type: 'new-model',
        title: 'New model',
        description: 'Create a vehicle model',
        icon: <FaCar className="h-7 w-7 text-da-primary-500" />,
      },
      {
        type: 'new-prototype',
        title: 'New prototype',
        description: 'Quickly develop vehicle app',
        icon: <TbCode className="h-7 w-7 text-da-primary-500" />,
      },
      {
        type: 'import-prototype',
        title: 'Import prototype',
        description: 'Import existing prototype',
        icon: <TbPackageImport className="h-7 w-7 text-da-primary-500" />,
      },
      {
        title: 'My models',
        description: 'Go to my models',
        url: '/model',
        icon: <TbArrowRight className="h-7 w-7 text-da-primary-500" />,
      },
    ],
  },
  {
    type: 'news',
    title: 'Top News',
    items: [
      {
        title: 'digital.auto Meetup',
        type: 'Event',
        date: '26 November 2024',
        description:
          'Join Prof. Dirk Slama to discuss the roadmap and priorities of our digital.auto community in 2025. Meet Fabio Violante (CEO Arduino) to discuss our plans for an open E/E Starter Kit for SDVs',
        imageURL:
          'https://media.licdn.com/dms/image/v2/D4E1EAQF2KZYqcFNjKA/event-background-image-crop_720_1280/event-background-image-crop_720_1280/0/1729941730210?e=1730649600&v=beta&t=fLHZA_-D_YigsPh3bcLCacvo2-ZuFIYcg5xbjXebXnA',
        redirectURL:
          'https://www.linkedin.com/posts/digitalauto_join-prof-dirk-slama-to-discuss-the-roadmap-activity-7255901526752219137-RFLH?utm_source=share&utm_medium=member_desktop',
      },
      {
        title: 'Zonal E/E architecture | digital.auto x MiX',
        type: 'News',
        description:
          'The Bosch MiX project has developed a demonstrator platform for real-time applications in a zonal E/E architecture utilizing NXP hashtag#S32G3 and Yocto Linux.',
        imageURL:
          'https://media.licdn.com/dms/image/sync/v2/D4E27AQHF2nzxsUzlEA/articleshare-shrink_480/articleshare-shrink_480/0/1729929741955?e=1730649600&v=beta&t=rHA_91WtXvpSs5h9AcZb8JB3daqhJcnzdNd0TOzdQGA',
        redirectURL: 'https://www.youtube.com/watch?v=M2o3h4anJ_s',
      },
      {
        title: 'digital.auto at ETAS Connections 2024',
        type: 'Event',
        description:
          'Join us at Bosch Connected World 2024 to learn more about digital.auto',
        imageURL:
          'https://media.licdn.com/dms/image/v2/D5622AQGDWg4yDt6r6A/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1728543615217?e=1732752000&v=beta&t=X5_hY7cHDgph813Mn2O4I7sctrcxv_wWdXQ7IVYYThU',
        redirectURL:
          'https://www.linkedin.com/posts/digitalauto_etas-connections-2024-panel-session-activity-7240339277119705088-bEhz?utm_source=share&utm_medium=member_desktop',
      },
      {
        title: 'GenAI Awards',
        type: 'Event',
        date: '1 January 2025',
        description:
          'Join us to harness the power of GenAI for the software-defined vehicle (SDV). Win the digital.auto GenAI award by participating in our quarterly competitions. We are looking for novel ways to apply multimodel GenAI to create visually rich',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/8go3BVLvQX3B/GenAI_Cover.png',
        redirectURL: 'https://www.bosch-connected-world.com/',
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
    requiredLogin: true,
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
