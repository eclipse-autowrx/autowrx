// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import {
  listRecentPrototypes,
  listPopularPrototypes,
} from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaLoading from '../atoms/DaLoading'
import DaText from '../atoms/DaText'
import { DaPrototypeItem } from '../molecules/DaPrototypeItem'

const HomePrototypeProposal = () => {
  const { data: user } = useSelfProfileQuery()
  const [popularPrototypes, setPopularPrototypes] = useState<
    Prototype[] | undefined
  >(undefined)
  const [recentPrototypes, setRecentPrototypes] = useState<
    Prototype[] | undefined
  >(undefined)

  useEffect(() => {
    const fetchProposalPrototypes = async () => {
      if (user) {
        const recentPrototypes = await listRecentPrototypes()
        setRecentPrototypes(recentPrototypes)
        const popularPrototypes = await listPopularPrototypes()
        setPopularPrototypes(popularPrototypes)
      }
    }
    fetchProposalPrototypes()
  }, [user])

  return (
    user && (
      <div className="flex flex-col w-full container ">
        {recentPrototypes && popularPrototypes ? (
          <>
            <DaText variant="sub-title" className="mt-6 text-da-primary-500">
              Recent Prototypes
            </DaText>
            <div className="mt-2 w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentPrototypes &&
                recentPrototypes.map((prototype, pIndex) => (
                  <Link
                    to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
                    key={pIndex}
                  >
                    <DaPrototypeItem prototype={prototype} />
                  </Link>
                ))}
            </div>
            <DaText
              variant="sub-title"
              className="mt-12
             text-da-primary-500"
            >
              Popular Prototypes
            </DaText>
            <div className="mt-2 w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularPrototypes &&
                popularPrototypes.map((prototype, pIndex) => (
                  <Link
                    to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
                    key={pIndex}
                  >
                    <DaPrototypeItem prototype={prototype} />
                  </Link>
                ))}
            </div>
          </>
        ) : (
          <div className="flex min-h-[200px] items-center">
            <DaLoading
              text="Loading prototypes..."
              showRetry={false}
              timeout={20}
              timeoutText={'There are prototypes available yet'}
              stopLoading={
                popularPrototypes !== undefined &&
                recentPrototypes !== undefined
              }
            />
          </div>
        )}
      </div>
    )
  )
}

export { HomePrototypeProposal }
