// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const gitValidation = require('../../../validations/git.validation');
const gitController = require('../../../controllers/git.controller');

const router = express.Router();

// GitHub OAuth routes
router.post(
  '/git/github/callback',
  validate(gitValidation.githubOAuthCallback),
  gitController.githubOAuthCallback
);

router.get('/git/github/status', auth(), gitController.getAuthStatus);

router.delete('/git/github/disconnect', auth(), gitController.disconnectGithub);

// Repository management routes
router.get(
  '/git/repositories',
  auth(),
  validate(gitValidation.listRepos),
  gitController.listRepositories
);

router.post(
  '/git/repositories',
  auth(),
  validate(gitValidation.createRepository),
  gitController.createRepository
);

router.post(
  '/git/repositories/link',
  auth(),
  validate(gitValidation.linkRepository),
  gitController.linkRepository
);

router.get(
  '/git/repositories/prototype/:prototypeId',
  auth(),
  validate(gitValidation.getLinkedRepo),
  gitController.getLinkedRepository
);

// File operations routes
router.get(
  '/git/repos/:owner/:repo/contents',
  auth(),
  validate(gitValidation.getFileContents),
  gitController.getFileContents
);

router.put(
  '/git/repos/:owner/:repo/contents',
  auth(),
  validate(gitValidation.commitFile),
  gitController.commitFile
);

// History routes
router.get(
  '/git/repos/:owner/:repo/commits',
  auth(),
  validate(gitValidation.getCommits),
  gitController.getCommits
);

router.get(
  '/git/repos/:owner/:repo/branches',
  auth(),
  validate(gitValidation.getBranches),
  gitController.getBranches
);

module.exports = router;
