// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { Server } = require('socket.io');
const logger = require('./logger');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { jwtVerify } = require('./passport');
const { tokenTypes } = require('./tokens');
const permissionService = require('../services/permission.service');
const { PERMISSIONS } = require('./roles');

let io = null;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.access_token) {
      jwt.verify(socket.handshake.query.access_token, config.jwt.secret, async function (err, decoded) {
        if (err) return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
        await jwtVerify(
          {
            type: tokenTypes.ACCESS,
            sub: decoded.sub,
          },
          async (error, user) => {
            if (error || !user) {
              return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
            }
            // if (!(await permissionService.hasPermission(user.id, PERMISSIONS.GENERATIVE_AI)))
            //   return next(new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized to access this'));
            // }
            socket.user = user;
            next();
          }
        );
      });
    } else {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
  });

  io.on('connection', () => {
    logger.info('a user connected');
  });
};

const getIO = () => io;

module.exports = {
  getIO,
  init,
};
