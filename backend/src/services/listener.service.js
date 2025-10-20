// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { getIO } = require('../config/socket');

const findSocketByUser = (userId) => {
  const io = getIO();
  let socket = null;
  io.sockets.sockets.forEach((value) => {
    const user = value.user;
    if (!user) {
      return;
    }
    if (String(user._id) === String(userId)) {
      socket = value;
    }
  });
  return socket;
};

const emitDataToSocket = (socket, event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};

module.exports = {
  findSocketByUser,
  emitDataToSocket,
};
