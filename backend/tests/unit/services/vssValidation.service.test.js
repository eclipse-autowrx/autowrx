// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { validateVss } = require('../../../src/services/vssValidation.service');
const standard = require('../../../data/v6.0.json');

const valid = { Vehicle: { type: 'branch', children: { Speed: { type: 'sensor', datatype: 'float' } } } };

describe('VSS validation', () => {
  test.each([
    null,
    [],
    {},
    'invalid JSON',
    { Vehicle: null },
    { Vehicle: {} },
    { Vehicle: { type: 'branch', children: [] } },
    { Vehicle: { type: 'branch' } },
    { Vehicle: { type: 'sensor' } },
    { Vehicle: { type: 'branch', children: { Cabin: { type: 'branch', children: {} } } } },
  ])('rejects invalid input %#', (input) => {
    expect(() => validateVss(input)).toThrow();
  });
  test('preserves custom nodes and metadata without mutating input', () => {
    const spec = JSON.parse(JSON.stringify(valid));
    spec.Vehicle.children.Custom = { type: 'struct', children: {}, 'x-vendor': { empty: {} } };
    const original = JSON.stringify(spec);
    expect(validateVss(spec)).toBe(spec);
    expect(JSON.stringify(spec)).toBe(original);
    expect(validateVss(original)).toEqual(spec);
  });
  test('reports nested errors in sorted path order', () => {
    const input = { Vehicle: { type: 'branch', children: { Z: { type: 'branch' }, A: { type: 'branch' } } } };
    expect(() => validateVss(input)).toThrow('Invalid VSS at Vehicle.A: branch must contain children.');
  });
  test('accepts the empty root of a model without signals only when allowed', () => {
    const empty = { Vehicle: { description: 'Vehicle', type: 'branch', children: {} } };
    expect(() => validateVss(empty)).toThrow('Invalid VSS at Vehicle: branch must contain children.');
    expect(() => validateVss(empty, { allowEmptyRoot: true })).not.toThrow();
    expect(() => validateVss({ Vehicle: { type: 'branch' } }, { allowEmptyRoot: true })).toThrow();
    const nested = { Vehicle: { type: 'branch', children: { Cabin: { type: 'branch', children: {} } } } };
    expect(() => validateVss(nested, { allowEmptyRoot: true })).toThrow('Invalid VSS at Vehicle.Cabin');
  });
  test('accepts standard VSS', () => {
    expect(() => validateVss(standard)).not.toThrow();
  });
  test('caps traversal depth', () => {
    const input = { Vehicle: { type: 'branch', children: {} } };
    let node = input.Vehicle;
    for (let i = 0; i < 130; i += 1) {
      node.children.Next = { type: 'branch', children: {} };
      node = node.children.Next;
    }
    expect(() => validateVss(input)).toThrow('tree exceeds validation limits');
  });
});
