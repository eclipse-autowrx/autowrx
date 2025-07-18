// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import _policy from '../../instance/policy'

const policy = _policy as any

export const usePolicy = () => {
  if (policy && policy.policy_url && policy.policy_url.length > 0) {
    return policy.policy_url
  }

  return ''
}

export const usePrivacyPolicy = () => {
  if (policy && policy.privacy_policy && policy.privacy_policy.length > 0) {
    return policy.privacy_policy
  }

  return ''
}
