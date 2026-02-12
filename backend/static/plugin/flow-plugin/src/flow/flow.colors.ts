// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT
// digital.auto / Flow palette - matches frontend/src/index.css (lines 287-300)

// ASIL badge colors (QM uses da-primary, A uses da-secondary)
export const asilBgColors: Record<string, { bg: string; border: string }> = {
  D: { bg: 'hsl(0 84% 60%)', border: 'hsl(0 84% 45%)' },
  C: { bg: 'hsl(25 95% 53%)', border: 'hsl(25 95% 40%)' },
  B: { bg: 'hsl(45 93% 47%)', border: 'hsl(45 93% 35%)' },
  A: { bg: 'hsl(67 54% 48%)', border: 'hsl(67 54% 35%)' },
  QM: { bg: 'hsl(198 28% 61%)', border: 'hsl(198 100% 22%)' },
}
