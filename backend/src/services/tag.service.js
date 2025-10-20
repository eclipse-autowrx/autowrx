// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { db } = require('../config/firebase');

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTagCategories = async (filter, options) => {
  const { tenantId } = filter;
  const response = await db.collection('tags').where('tenant_id', '==', tenantId).get();
  const result = response.docs.map((doc) => doc.data());
  return result;
};

/**
 *
 * @param {Object} tagBody
 * @returns {Promise<string>}
 */
const createTag = async (tagBody) => {
  const { newTag, newTagCategory, id, tenantId } = tagBody;
  const docRef = db.collection('tags').doc(id);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    const existingTagCategory = docSnap.data();
    const existingTag = existingTagCategory?.tags[newTag.name];
    if (existingTag) {
      return null;
    }
    await docRef.update({ [`tags.${newTag.name}`]: newTag });
  } else {
    const tagCategoryObject = {
      ...newTagCategory,
      id,
      tenant_id: tenantId,
      tags: {
        [newTag.name]: newTag,
      },
    };
    await docRef.set(tagCategoryObject);
  }
  return id;
};

/**
 *
 * @param {string} id
 * @param {Object} tags
 * @returns {Promise<Object>}
 */
const updateTagCategory = async (id, tags) => {
  const docRef = await db.collection('tags').doc(id);
  const docData = await (await docRef.get()).data();
  const newData = {
    ...docData,
    tags: {
      ...(docData.tags || {}),
      ...(tags || {}),
    },
  };
  const response = await docRef.set(newData);

  return response;
};

/**
 *
 * @param {Object} tagBody
 * @returns {Promise<Object>}
 */
const createTagCategory = async (tagBody) => {
  const response = await db.collection('tags').doc(tagBody.id).set(tagBody);
  return response;
};

module.exports = {
  queryTagCategories,
  createTag,
  updateTagCategory,
  createTagCategory,
};
