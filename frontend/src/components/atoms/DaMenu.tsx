// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Menu } from '@mui/material'
import { FC, useState } from 'react'

interface DropdownProps {
  trigger: React.ReactElement
  children: React.ReactNode
  onHover?: boolean
}

const DaMenu: FC<DropdownProps> = ({ trigger, children, onHover = false }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLSpanElement>(null)

  const handleClose = () => setAnchorEl(null)

  return (
    <div className="inline-flex">
      <span
        style={{ display: 'flex' }}
        onClick={(event) => {
          if (anchorEl) {
            setAnchorEl(null)
          } else {
            setAnchorEl(event.currentTarget)
          }
        }}
        onMouseEnter={
          onHover ? (event) => setAnchorEl(event.currentTarget) : undefined
        }
      >
        {trigger}
      </span>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: '5px',
            },
          },
        }}
        onClick={handleClose}
        classes={{ paper: 'da-menu-dropdown' }}
      >
        {children}
      </Menu>
    </div>
  )
}

export default DaMenu
