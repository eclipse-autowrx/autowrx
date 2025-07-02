// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaButton } from '@/components/atoms/DaButton'
import DaText from '@/components/atoms/DaText'
import { Link } from 'react-router-dom'
import { roles } from './data'
import { TbListTree } from 'react-icons/tb'

const InventoryRoleBrowser = () => {
  return (
    <div className="container">
      <div className="flex-1 min-w-0 flex gap-2">
        <DaText variant="title" className="text-da-primary-500">
          Role Browser
        </DaText>
        <Link className="ml-auto" to="/inventory/instance">
          <DaButton variant="outline-nocolor" size="sm">
            <TbListTree className="mr-1" /> Instances
          </DaButton>
        </Link>
        <Link to="/inventory/schema">
          <DaButton variant="outline-nocolor" size="sm">
            <TbListTree className="mr-1" /> Schemas
          </DaButton>
        </Link>
      </div>
      <div className="grid grid-cols-2 mt-4 grid-rows-2 gap-6">
        {roles.map((role, index) => (
          <Link
            to={`/inventory/role/${role.name}`}
            key={index}
            className="h-[200px] hover:bg-da-primary-100 transition overflow-hidden flex border shadow rounded-md"
          >
            <img
              className="h-full aspect-square rounded-l-md"
              src={role.image}
              alt={role.name}
            />
            <div className="flex flex-col flex-1 px-6 py-4">
              <DaText variant="sub-title" className="!text-da-gray-darkest">
                {role.name}
              </DaText>
              <span className="text-sm mt-1">{role.description}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* <div className="mt-2 flex gap-y-1 gap-x-6 flex-wrap">
        {roles.slice(4).map((role, index) => (
          <Link
            to={`/inventory?role=${role.name}`}
            key={index}
            className="flex hover:bg-da-primary-100 border rounded-full px-2 py-1 items-center hover:text-da-primary-500 text-da-gray-darkest gap-2 mt-2"
          >
            <span className="text-sm">{role.name}</span>
          </Link>
        ))}
      </div> */}
    </div>
  )
}

export default InventoryRoleBrowser
