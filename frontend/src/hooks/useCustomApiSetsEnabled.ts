// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useSiteConfig } from '@/utils/siteConfig'

/**
 * Returns true when Custom API Sets UI should be shown.
 * Inverted from DISABLE_CUSTOM_API_SETS site config (default: feature enabled).
 */
export const useCustomApiSetsEnabled = (): boolean =>
  !useSiteConfig('DISABLE_CUSTOM_API_SETS', false)

export default useCustomApiSetsEnabled
