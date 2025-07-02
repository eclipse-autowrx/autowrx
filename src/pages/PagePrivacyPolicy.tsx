// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { usePrivacyPolicy } from '@/hooks/useInstanceCfg'

const PagePrivacyPolicy = () => {
  const privacyPolicyHtml = usePrivacyPolicy()

  return (
    <div className="bg-gray-50 text-sm text-gray-700 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md border p-6 rounded-lg">
        <div
          className="policy-content"
          dangerouslySetInnerHTML={{ __html: privacyPolicyHtml }}
        />
      </div>
    </div>
  )
}

export default PagePrivacyPolicy
