// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const image = require('../utils/image');
const fileService = require('./file.service');
const logger = require('../config/logger');
const { isValidObjectId } = require('mongoose');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Object} advanced - Advanced search options
 * @param {string} [advanced.search] - Full text search
 * @param {string} [advanced.includeFullDetails] - Whether to include full user details or not
 * @param {string} [advanced.id] - Whether to filter users by id
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options, advanced) => {
  if (advanced.id) {
    const ids = advanced.id.split(',');
    for (const id of ids) {
      if (!isValidObjectId(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid id ${id}`);
      }
    }
    filter = {
      ...filter,
      _id: { $in: ids },
    };
  }

  if (advanced.search) {
    filter = {
      $and: [
        filter,
        {
          $or: [{ name: { $regex: advanced.search, $options: 'i' } }, { email: { $regex: advanced.search, $options: 'i' } }],
        },
      ],
    };
  }

  if (!advanced.includeFullDetails) {
    return User.paginate(filter, {
      ...options,
      fields: 'name,id,image_file',
    });
  }

  const results = await User.paginate(filter, options);
  results.results = results.results.map((user, index) => ({
    ...user.toJSON(),
    created_at: user.createdAt,
  }));
  return results;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @param {boolean} [includeFullDetails = false] - Include full details or not
 * @returns {Promise<import('../models/user.model').User>}
 */
const getUserById = async (id, includeFullDetails = false) => {
  if (!includeFullDetails) {
    return User.findById(id, {
      name: 1,
      image_file: 1,
      _id: 1,
    });
  }

  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId, true);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (updateBody.password && user.password && (await user.isPasswordMatch(updateBody.password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be different from the current password');
  }

  return User.findOneAndUpdate(
    {
      _id: userId,
    },
    updateBody,
    {
      new: true,
    }
  );
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 *
 * @param {import('../models/user.model').User} userId
 * @param {import('../typedefs/msGraph').MSGraph} graphData
 * @returns {Promise<import('../models/user.model').User>}
 */
const updateSSOUser = async (user, graphData) => {
  const userPhoto = await fileService.getFileFromURL(graphData.userPhotoUrl);
  const updateBody = {};

  if (user.name !== graphData.displayName) {
    updateBody.name = graphData.displayName;
  }

  try {
    if (userPhoto) {
      const photoBuffer = await userPhoto.arrayBuffer();
      const diff = await image.diff(user?.image_file, photoBuffer);
      if (diff > 0.1 || diff === -1) {
        const { url } = await fileService.upload(userPhoto);
        updateBody.image_file = url;
      }
    }
  } catch (error) {
    logger.error('Error updating user photo');
    logger.error(error);
  }

  if (Object.keys(updateBody).length === 0) {
    return user;
  }

  return updateUserById(user.id, updateBody);
};

/**
 *
 * @param {import('../typedefs/msGraph').MSGraph} graphData
 * @returns {Promise<import('../models/user.model').User>}
 */
const createSSOUser = async (graphData) => {
  const userPhoto = await fileService.getFileFromURL(graphData.userPhotoUrl);
  const userBody = {
    name: graphData.displayName,
    email: graphData.mail,
    email_verified: true,
    provider_user_id: graphData.id,
  };

  try {
    if (userPhoto) {
      const { url } = await fileService.upload(userPhoto);
      userBody.image_file = url;
    }
  } catch (error) {
    logger.error('Error creating user photo');
    logger.error(error);
  }

  return createUser(userBody);
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  updateSSOUser,
  createSSOUser,
};
