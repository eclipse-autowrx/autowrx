// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * UUID generator that uses window.crypto.randomUUID() when available,
 * falls back to Math.random() for older browsers
 */
export function generateUUID(): string {
  // Try to use native crypto.randomUUID() first
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  // Fallback: Generate random string in UUID format using Math.random()
  const generateRandomHex = (length: number): string => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where x is any hex digit and y is one of 8, 9, A, or B
  const part1 = generateRandomHex(8);
  const part2 = generateRandomHex(4);
  const part3 = '4' + generateRandomHex(3); // Version 4
  const part4 = (Math.floor(Math.random() * 4) + 8).toString(16) + generateRandomHex(3); // Variant 10xx
  const part5 = generateRandomHex(12);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
} 