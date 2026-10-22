// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const HomeFooterSection = () => {
  return (
    <div className="pb-10 pt-6 bg-gray-100 ">
      <div className="min-h-[180px] flex flex-1 min-w-0 flex-col font-medium items-center text-center justify-center">
        <div className="flex w-fit items-center">
          <a href="https://www.digital.auto/" target="_blank" rel="noreferrer">
            <img src="/imgs/da.png" alt="digital.auto" className="h-[70px]" />
          </a>
        </div>
        <div className="text-sm mt-3 max-w-xl">
          Operated by{' '}
          <a
            href="https://www.digital.auto/"
            target="_blank"
            className="text-primary hover:underline"
            rel="noreferrer"
          >
            digital.auto
          </a>{' '}
          and based on{' '}
          <a
            href="https://gitlab.eclipse.org/eclipse/autowrx/autowrx"
            target="_blank"
            className="text-primary hover:underline"
            rel="noreferrer"
          >
            Eclipse SDV autowrx
          </a>
          . Join our thriving community to participate in next-generation,
          SDV-enabled vehicle experiences.
        </div>
      </div>
    </div>
  )
}

export default HomeFooterSection
