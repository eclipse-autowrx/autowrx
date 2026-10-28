// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = (path, reason) => {
  throw new ApiError(httpStatus.BAD_REQUEST, `Invalid VSS at ${path}: ${reason}.`);
};

/**
 * Validate without changing the input; return the parsed tree for JSON callers.
 * allowEmptyRoot accepts a root branch with an explicit empty children object: the tree
 * api.service.computeVSSApi exports for a model without signals. Persisting it recreates
 * a blank model; runtime preflight leaves it off because an empty tree cannot be built.
 */
const validateVss = (spec, { allowEmptyRoot = false } = {}) => {
  let tree = spec;
  if (typeof tree === 'string') {
    if (Buffer.byteLength(tree, 'utf8') > 10 * 1024 * 1024) invalid('$', 'data must not exceed 10 MB');
    try {
      tree = JSON.parse(tree);
    } catch (_error) {
      invalid('$', 'expected valid JSON');
    }
  }
  if (!isObject(tree) || Object.keys(tree).length === 0) invalid('$', 'expected a non-empty object');
  const stack = Object.keys(tree)
    .sort()
    .reverse()
    .map((key) => ({ node: tree[key], path: key, depth: 0 }));
  let count = 0;
  while (stack.length) {
    const { node, path, depth } = stack.pop();
    count += 1;
    if (depth > 128 || count > 100000) invalid(path, 'tree exceeds validation limits');
    if (!isObject(node)) invalid(path, 'node must be an object');
    if (typeof node.type !== 'string' || !node.type.trim()) invalid(path, 'node type is required');
    if (node.children !== undefined && !isObject(node.children)) invalid(path, 'children must be an object');
    const children = Object.keys(node.children || {})
      .sort()
      .reverse();
    const emptyRoot = allowEmptyRoot && depth === 0 && isObject(node.children);
    if (node.type === 'branch' && children.length === 0 && !emptyRoot) invalid(path, 'branch must contain children');
    if (['sensor', 'actuator', 'attribute'].includes(node.type)) {
      if (typeof node.datatype !== 'string' || !node.datatype.trim()) invalid(path, 'signal datatype is required');
    }
    children.forEach((key) => stack.push({ node: node.children[key], path: `${path}.${key}`, depth: depth + 1 }));
  }
  if (Buffer.byteLength(JSON.stringify(tree), 'utf8') > 10 * 1024 * 1024) {
    invalid('$', 'data must not exceed 10 MB');
  }
  return tree;
};

module.exports = { validateVss };
