// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const githubController = require('../../../controllers/github.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GitHub
 *   description: GitHub repository proxy endpoints
 */

/**
 * @swagger
 * /system/github/download:
 *   post:
 *     summary: Download GitHub repository as ZIP
 *     description: Proxy endpoint to download GitHub repositories as ZIP files to avoid CORS issues
 *     tags: [GitHub]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: GitHub repository URL
 *                 example: "https://github.com/owner/repository"
 *     responses:
 *       200:
 *         description: Repository ZIP file
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           X-Used-Branch:
 *             description: The branch that was downloaded
 *             schema:
 *               type: string
 *           X-Repo-Info:
 *             description: Repository information as JSON
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid repository URL
 *       404:
 *         description: Repository not found
 *       408:
 *         description: Request timeout
 *       500:
 *         description: Internal server error
 */
router.post('/download', githubController.downloadGitHubRepo);

/**
 * @swagger
 * /system/github/repo/{owner}/{repo}:
 *   get:
 *     summary: Get repository information
 *     description: Get basic information about a GitHub repository
 *     tags: [GitHub]
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository owner
 *       - in: path
 *         name: repo
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository name
 *     responses:
 *       200:
 *         description: Repository information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 language:
 *                   type: string
 *                 defaultBranch:
 *                   type: string
 *                 isPrivate:
 *                   type: boolean
 *                 stars:
 *                   type: number
 *                 forks:
 *                   type: number
 *                 size:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *       404:
 *         description: Repository not found
 *       500:
 *         description: Internal server error
 */
router.get('/repo/:owner/:repo', githubController.getRepoInfo);

module.exports = router;
