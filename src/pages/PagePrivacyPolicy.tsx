import { useState, useEffect } from 'react'
import { usePrivacyPolicy } from '@/hooks/useInstanceCfg'

const PagePrivacyPolicy = () => {
  const privacyPolicyHtml = usePrivacyPolicy()

  return (
    <div className="bg-gray-50 text-sm text-gray-700 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md p-6 rounded-lg">
        <div
          className="policy-content"
          dangerouslySetInnerHTML={{ __html: privacyPolicyHtml }}
        />
      </div>
    </div>
  )
}

export default PagePrivacyPolicy
