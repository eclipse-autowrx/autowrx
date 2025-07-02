// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaText } from '../atoms/DaText'
import { DaImage } from '../atoms/DaImage'
import { DaTag } from '../atoms/DaTag'
import { DaTableProperty } from '../molecules/DaTableProperty'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaButton } from '../atoms/DaButton'
import {
  TbArrowRight,
  TbArrowUpRight,
  TbExternalLink,
  TbLink,
} from 'react-icons/tb'
import { Link } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import DaUserProfile from '../molecules/DaUserProfile'
import DaStarsRating from '../atoms/DaStarsRating'

interface PrototypeSummaryProps {
  prototype: Prototype
}

const PrototypeSummary = ({ prototype }: PrototypeSummaryProps) => {
  return (
    <div className="flex h-full w-full flex-col">
      <DaImage
        src={
          prototype.image_file
            ? prototype.image_file
            : '/imgs/default_prototype_cover.jpg'
        }
        className="flex max-h-[400px] w-full object-cover"
      />
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between">
          <DaText variant="title" className="text-da-primary-500">
            {prototype.name}
          </DaText>
          <Link
            to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/view`}
          >
            <DaButton variant="solid" size="sm">
              Open
              <TbArrowRight className="ml-2 h-5 w-5" />
            </DaButton>
          </Link>
        </div>
        <DaUserProfile
          className="mt-2"
          userName={prototype.created_by?.name}
          userAvatar={prototype.created_by?.image_file}
        />

        <div className="flex h-full flex-col">
          <DaTableProperty
            properties={[
              {
                name: 'Problem',
                value: prototype.description.problem,
              },
              {
                name: 'Says who?',
                value: prototype.description.says_who,
              },
              {
                name: 'Solution',
                value: prototype.description.solution,
              },
              {
                name: 'Status',
                value:
                  prototype.state === 'Released' ||
                  prototype.state === 'Developing'
                    ? prototype.state
                    : 'Developing',
              },
              { name: 'Complexity', value: prototype.complexity_level },
            ]}
            className="mt-2"
          />
          <div className="mt-2 flex items-center">
            <Link
              to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/feedback`}
              className="flex w-fit items-center hover:opacity-75"
            >
              <DaText
                variant="small-bold"
                className="flex min-w-[110px] items-center text-da-gray-dark"
              >
                Feedback <TbExternalLink className="size-4 ml-1" />
              </DaText>
            </Link>
            <DaStarsRating
              initialRating={prototype.avg_score ?? 0}
              readonly
              className="mx-0 flex"
            />
            <DaText variant="small" className="ml-1">
              ({(prototype.avg_score ?? 0).toFixed(2)})
            </DaText>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrototypeSummary
