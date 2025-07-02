// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const logos = [
  {
    src: '/imgs/DigitalAuto.png',
    name: 'DigitalAuto',
    href: 'https://www.digital-auto.org/',
  },
  {
    src: '/imgs/Certivity.png',
    name: 'Certivity',
    href: 'https://www.certivity.io/',
  },
  {
    src: '/imgs/AlephAlpha.png',
    name: 'Aleph Alpha',
    href: 'https://aleph-alpha.com/',
  },
  { src: '/imgs/ETAS.png', name: 'ETAS', href: 'https://www.etas.com/en/' },
]

const HomologationPoweredBy = () => {
  return (
    <div className="flex w-full h-full gap-10 items-center justify-center">
      {logos.map((logo) => (
        <a
          className="transition cursor-pointer"
          key={logo.name}
          href={logo.href}
          target="__blank"
        >
          <img
            src={logo.src}
            className="h-14 w-full object-contain"
            alt={logo.name + '-logo'}
          />
        </a>
      ))}
    </div>
  )
}

export default HomologationPoweredBy
