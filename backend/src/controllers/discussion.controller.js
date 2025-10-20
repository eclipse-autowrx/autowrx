// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { discussionService } = require('../services');
const pick = require('../utils/pick');

const createDiscussion = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const discussion = await discussionService.createDiscussion({
    ...req.body,
    created_by: userId,
  });
  res.status(httpStatus.CREATED).send(discussion);
});

const listDiscussions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['ref', 'ref_type', 'id', 'parent']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const discussions = await discussionService.queryDiscussions(
    {
      ...filter,
      parent: { $exists: false },
    },
    {
      ...options,
      populate: ['created_by', 'name image_file'],
    }
  );
  // TODO: Optimize the code below
  const promises = [];
  for (let i = 0; i < discussions.results.length; i += 1) {
    discussions.results[i] = discussions.results[i].toJSON();
    const discussion = discussions.results[i];
    promises.push(
      (async () => {
        const list = await discussionService.listDiscussions({ parent: discussion.id });
        // eslint-disable-next-line no-param-reassign
        discussion.replies = list;
      })()
    );
  }
  await Promise.all(promises);

  res.send(discussions);
});

const updateDiscussion = catchAsync(async (req, res) => {
  const discussion = await discussionService.updateDiscussionById(req.params.id, req.body, req.user.id);
  res.send(discussion);
});

const deleteDiscussion = catchAsync(async (req, res) => {
  await discussionService.deleteDiscussionById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createDiscussion,
  listDiscussions,
  updateDiscussion,
  deleteDiscussion,
};
