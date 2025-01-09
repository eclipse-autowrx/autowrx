const instance = {
  name: 'Autowrx',
  policy_url: 'https://www.digital.auto/privacy-policy',
  background: '/imgs/autowrx-bg.jpg',
  text: {
    home_ads_pan_title:
      'Welcome to digital.auto playground for virtual exploration',
    home_ads_pan_desc: `To support shift-level testing for software-defined vehicle (SDV) applications, we have created the digital.auto playground. This is a cloud-based, rapid prototyping environment for new, <b>SDV-enabled features</b>. The prototypes are built against real-world vehicle APIs and can be seamlessly migrated to automotive runtimes, such as Eclipse Velocitas. The playground is open and free to use.`,
  },
  featureCards: [
    {
      title: 'Vehicle API Catalogue',
      content:
        'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
    },
    {
      title: 'Prototyping',
      content:
        'Build and test new connected vehicle app prototypes in the browser, using Python and the Vehicle API',
    },
    {
      title: 'User Feedback',
      content:
        'Collect and evaluate user feedback to prioritize your development portfolio',
    },
  ],
  partners: [
    {
      category: 'Industry Partners',
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
      category: 'Standards & Open Source',
      items: [
        {
          name: 'COVESA',
          img: 'https://bewebstudio.digitalauto.tech/data/projects/xT9wA8QU7xEN/covesa.png',
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
      category: 'Academic Partners',
      items: [
        {
          name: 'Ferdinand-Steinbeis-Institut',
          img: 'https://bewebstudio.digitalauto.tech/data/projects/xT9wA8QU7xEN/university.png',
          url: 'https://ferdinand-steinbeis-institut.de',
        },
      ],
    },
  ],
  privacy_policy: ``,
}

export default instance
