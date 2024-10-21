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
