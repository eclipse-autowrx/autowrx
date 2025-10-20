// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
require('dotenv').config();

const { privateKey } = JSON.parse(process.env.FIREBASE_PRIVATE_KEY || '{}');

const exportsObject = {
  db: null,
  auth: null,
  getStorageRef: null,
  REFS: null,
};

if (privateKey) {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  const storage = getStorage();

  const getStorageRef = (filename) => {
    const bucket = storage.bucket(); // Gets the default bucket
    return bucket.file(filename); // Creates a reference to the file in the bucket
  };

  const db = getFirestore(app);
  const auth = getAuth(app);

  const REFS = {
    tenant: db.collection('tenant'),
    model: db.collection('model'),
    tags: db.collection('tags'),
    prototype: db.collection('project'),
    plugin: db.collection('plugin'),
    media: db.collection('media'),
    user: db.collection('user'),
    feedback: db.collection('feedback'),
    discussion: db.collection('discussion'),
    activity_log: db.collection('activity_log'),
    issue: db.collection('issue'),
    survey: db.collection('survey'),
    feature: db.collection('feature'),
    api: db.collection('api'),
    addOns: db.collection('addOns'),
  };

  exportsObject.db = db;
  exportsObject.auth = auth;
  exportsObject.getStorageRef = getStorageRef;
  exportsObject.REFS = REFS;
}

module.exports = exportsObject;
