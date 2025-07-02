// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
          <DaButton size="sm" data-id="btn-launch-graphic">
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
          'Learn about creating efficient SDV applications, using Python and Vehicle API',
        children: (
          <div className="flex space-x-2 items-center mt-4">
            <DaButton size="sm" data-id="btn-launch-documentation">
              <a
                href="https://docs.digital.auto/basics/play/"
                target="_blank"
                className="flex items-center"
              >
                <TbExternalLink className="size-4 mr-1" />
                Documentation
              </a>
            </DaButton>
            <DaButton variant="outline-nocolor" size="sm" data-id="btn-launch-video">
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
        title: 'Vehicle Catalog',
        description:
          'Create a model to start building new connected vehicle app prototypes.',
        children: (
          <DaRequireSignedIn message="You must first sign in to explore vehicle models and prototypes">
            <DaButton size="sm" className="mt-4">
              <DisabledLink to="/model" dataId="btn-launch-vehicle-models" className="flex items-center">
                Vehicle Models
              </DisabledLink>
            </DaButton>
          </DaRequireSignedIn>
        ),
      },
    ],
  },
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
        title:
          'Explore the SDV Guide - Your Complete Software-Defined Vehicle Resource',
        type: 'Guide',
        date: '10 June 2025',
        description:
          'Comprehensive SDV Guide covering Software-Defined Vehicle fundamentals through advanced topics. ',

        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/nTcRsgxcDWgr/image.avif',
        redirectURL: 'https://www.sdv.guide/',
      },
      {
        title: 'Version v2.0 release',
        type: 'News',
        date: '6th January 2025',
        description:
          'We are pleased to announce the release of Version 2. The previous version remains accessible at https://digitalauto.netlify.app until Jan 17th 2025',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/rUQXyRLKlgaL/annoucement.jpg',
        redirectURL: 'https://docs.digital.auto/releases/version2/',
      },
      {
        title: 'Contribute to playground development',
        type: 'Event',
        date: '17 January 2025',
        description:
          'Join us in developing playground.digital.auto on Eclipse Autowrx - an open platform where developers learn and experiment with software-defined vehicles.',
        imageURL:
          'https://bewebstudio.digitalauto.tech/data/projects/xT9wA8QU7xEN/new_images/autowrx.jpg',
        redirectURL: 'https://gitlab.eclipse.org/eclipse/autowrx/autowrx',
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
            img: 'https://bewebstudio.digitalauto.tech/data/projects/xT9wA8QU7xEN/bosch-logo.png',
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
        title: 'Academic Partners',
        items: [
          {
            name: 'Ferdinand-Steinbeis-Institut',
            img: 'https://bewebstudio.digitalauto.tech/data/projects/xT9wA8QU7xEN/university.png',
            url: 'https://ferdinand-steinbeis-institut.de',
          },
        ],
      },
    ],
  },
]

export default home
