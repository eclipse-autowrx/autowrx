// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaDashboard from './DaDashboard'
import DaWorkspaceDashboardGrid from './DaWorkspaceDashboardGrid'

const DaWorkspaceDashboard: FC = () => {
  return <DaDashboard GridComponent={DaWorkspaceDashboardGrid} />
}

export default DaWorkspaceDashboard
