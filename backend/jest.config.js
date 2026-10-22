// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/utils/closeRolesClient.setup.js'],
  // Some dependencies are ESM-only (@faker-js/faker, @paralleldrive/cuid2 via supertest > superagent > formidable)
  // and cannot be require()d by Jest's CommonJS runtime. Transform just those packages to CommonJS.
  transform: {
    '^.+\\.[cm]?js$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        sourceType: 'unambiguous',
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(@faker-js/faker|@paralleldrive/cuid2|@noble/hashes)/)'],
  coveragePathIgnorePatterns: ['node_modules', 'src/config', 'src/app.js', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
};
