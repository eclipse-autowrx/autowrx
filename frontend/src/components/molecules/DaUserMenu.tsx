// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { User } from '@/types/user.type.ts'
import { TbCube, TbLogout, TbUser } from 'react-icons/tb'
import { BsBox } from 'react-icons/bs'
import { Button } from '@/components/atoms/button'
import useAuthStore from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../atoms/dropdown-menu'
import { Link } from 'react-router-dom'

interface DaUserDropdownProps {
  user: User
}

const DaUserMenu = ({ user }: DaUserDropdownProps) => {
  const logOut = useAuthStore((state) => state.logOut)

  const handleLogout = async () => {
    try {
      logOut()
    } catch (error) {
      console.error('Logout failed')
    }
  }

  return (
    <div className="flex items-center justify-center ml-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 p-2">
            <img
              src={user.image_file || '/imgs/profile.png'}
              alt="User profile"
              className="h-full w-full object-cover rounded-full cursor-pointer"
              onError={(e) => {
                e.currentTarget.src = '/imgs/profile.png'
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              className="flex items-center gap-2 cursor-pointer"
            >
              <TbUser /> User Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/my-assets"
              className="flex items-center gap-2 cursor-pointer"
            >
              <TbCube /> My Assets
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <TbLogout /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default DaUserMenu
