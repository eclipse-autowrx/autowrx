// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import InventoryItemList from '@/components/molecules/inventory/InventoryItemList'

const PageInventoryItemList = () => {
  return (
    <div className="flex">
      <div className="m-auto w-full p-6">
        <InventoryItemList />
      </div>
    </div>
  )
}

export default PageInventoryItemList
