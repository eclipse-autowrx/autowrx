// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-console, no-await-in-loop */
const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../config/logger');
const { User, CustomApiSchema, CustomApiSet, Model } = require('../models');
const { customApiSchemaService, customApiSetService, modelService } = require('../services');
const bcrypt = require('bcryptjs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testAdminId = null;
let testUserId = null;
let testCustomApiSchemaIds = {};
let testCustomApiSetIds = {};
let testModelId = null;
let keepData = false;

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logTest = (testName, passed) => {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${testName}`, color);
};

const logSection = (sectionName) => {
  console.log('');
  log(`=== ${sectionName} ===`, 'blue');
};

// Cleanup function
const cleanup = async () => {
  if (keepData) {
    log('\nTest data preserved. IDs:', 'yellow');
    log(`Admin ID: ${testAdminId}`, 'yellow');
    log(`User ID: ${testUserId}`, 'yellow');
    log(`CustomApiSchema IDs: ${JSON.stringify(testCustomApiSchemaIds)}`, 'yellow');
    log(`CustomApiSet IDs: ${JSON.stringify(testCustomApiSetIds)}`, 'yellow');
    log(`Model ID: ${testModelId}`, 'yellow');
    return;
  }

  log('\nCleaning up test data...', 'yellow');
  try {
    if (testModelId) await Model.deleteOne({ _id: testModelId });
    for (const setId of Object.values(testCustomApiSetIds)) {
      await CustomApiSet.deleteOne({ _id: setId });
    }
    for (const schemaId of Object.values(testCustomApiSchemaIds)) {
      await CustomApiSchema.deleteOne({ _id: schemaId });
    }
    await User.deleteOne({ _id: testUserId });
    await User.deleteOne({ _id: testAdminId });
    log('Cleanup completed', 'green');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'red');
  }
};

// Test data generation
const createTestUsers = async () => {
  logSection('Creating Test Users');
  const password = await bcrypt.hash('testpassword1', 8);

  try {
    // Create admin user
    const admin = await User.create({
      email: 'test-admin@plugin-api.test',
      name: 'Test Admin',
      password,
      role: 'admin',
      isEmailVerified: true,
    });
    testAdminId = admin._id;
    logTest('Create admin user', true);

    // Create regular user
    const user = await User.create({
      email: 'test-user@plugin-api.test',
      name: 'Test User',
      password,
      role: 'user',
      isEmailVerified: true,
    });
    testUserId = user._id;
    logTest('Create regular user', true);
  } catch (error) {
    logTest('Create test users', false);
    throw error;
  }
};

const createTestCustomApiSchemas = async () => {
  logSection('Creating CustomApiSchema Schemas');

  try {
    // Tree API schema
    const treeSchema = await customApiSchemaService.createCustomApiSchema(
      {
        code: 'test_tree_api',
        name: 'Test Tree API',
        description: 'Test tree structure API',
        type: 'tree',
        schema: JSON.stringify({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['name'],
          },
        }),
        tree_config: { separator: '.', max_depth: 10 },
      },
      testAdminId
    );
    testCustomApiSchemaIds.tree = treeSchema._id;
    logTest('Create Tree API schema', true);

    // List API schema
    const listSchema = await customApiSchemaService.createCustomApiSchema(
      {
        code: 'test_list_api',
        name: 'Test List API',
        description: 'Test flat list API',
        type: 'list',
        schema: JSON.stringify({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              method: { type: 'string' },
              request: { type: 'string' },
            },
            required: ['name', 'path', 'method', 'request'],
          },
        }),
      },
      testAdminId
    );
    testCustomApiSchemaIds.list = listSchema._id;
    logTest('Create List API schema', true);

    // Graph API schema
    const graphSchema = await customApiSchemaService.createCustomApiSchema(
      {
        code: 'test_graph_api',
        name: 'Test Graph API',
        description: 'Test graph structure API',
        type: 'graph',
        schema: JSON.stringify({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
            },
            required: ['name', 'type'],
          },
        }),
        relationships: [
          {
            name: 'depends_on',
            type: 'many-to-many',
            target_api: 'test_graph_api',
            description: 'API depends on other APIs',
          },
        ],
      },
      testAdminId
    );
    testCustomApiSchemaIds.graph = graphSchema._id;
    logTest('Create Graph API schema', true);

    // Test duplicate code rejection
    try {
      await customApiSchemaService.createCustomApiSchema(
        {
          code: 'test_tree_api',
          name: 'Duplicate',
          type: 'tree',
          schema: JSON.stringify({ type: 'array', items: { type: 'object' } }),
        },
        testAdminId
      );
      logTest('Reject duplicate code', false);
    } catch (error) {
      logTest('Reject duplicate code', error.message.includes('already exists'));
    }
  } catch (error) {
    logTest('Create CustomApiSchema schemas', false);
    throw error;
  }
};

const createTestCustomApiSets = async () => {
  logSection('Creating CustomApiSet Instances');

  try {
    // System-scoped tree instance
    const treeSet = await customApiSetService.createCustomApiSet(
      {
        custom_api_schema: testCustomApiSchemaIds.tree,
        custom_api_schema_code: 'test_tree_api',
        scope: 'system',
        name: 'System Tree Instance',
        description: 'System-scoped tree instance',
        data: {
          items: [
            { id: 'ABC', path: 'ABC', name: 'ABC', value: 'root' },
            { id: 'ABC.X1', path: 'ABC.X1', parent_id: 'ABC', name: 'X1', value: 'child1' },
            { id: 'ABC.X1.X2', path: 'ABC.X1.X2', parent_id: 'ABC.X1', name: 'X2', value: 'grandchild' },
            { id: 'ABC.T1', path: 'ABC.T1', parent_id: 'ABC', name: 'T1', value: 'child2' },
          ],
          metadata: {},
        },
      },
      testAdminId
    );
    testCustomApiSetIds.treeSystem = treeSet._id;
    logTest('Create system-scoped tree instance', true);

    // User-scoped list instance
    const listSet = await customApiSetService.createCustomApiSet(
      {
        custom_api_schema: testCustomApiSchemaIds.list,
        custom_api_schema_code: 'test_list_api',
        scope: 'user',
        name: 'User List Instance',
        description: 'User-scoped list instance',
        data: {
          items: [
            {
              id: 'api1',
              path: '/api/v1/users',
              name: 'Get Users',
              method: 'GET',
              request: '{}',
            },
            {
              id: 'api2',
              path: '/api/v1/users/:id',
              name: 'Get User',
              method: 'GET',
              request: '{}',
            },
          ],
          metadata: {},
        },
      },
      testUserId
    );
    testCustomApiSetIds.listUser = listSet._id;
    logTest('Create user-scoped list instance', true);

    // Graph instance
    const graphSet = await customApiSetService.createCustomApiSet(
      {
        custom_api_schema: testCustomApiSchemaIds.graph,
        custom_api_schema_code: 'test_graph_api',
        scope: 'system',
        name: 'System Graph Instance',
        description: 'System-scoped graph instance',
        data: {
          items: [
            { id: 'node1', name: 'Node 1', type: 'service' },
            { id: 'node2', name: 'Node 2', type: 'service' },
            {
              id: 'node3',
              name: 'Node 3',
              type: 'service',
              relationships: [{ relationship_name: 'depends_on', target_item_id: 'node1' }],
            },
          ],
          metadata: {},
        },
      },
      testAdminId
    );
    testCustomApiSetIds.graphSystem = graphSet._id;
    logTest('Create graph instance', true);
  } catch (error) {
    logTest('Create CustomApiSet instances', false);
    throw error;
  }
};

const testCRUDOperations = async () => {
  logSection('Testing CRUD Operations');

  try {
    // Test CustomApiSchema update
    const updatedSchema = await customApiSchemaService.updateCustomApiSchemaById(
      testCustomApiSchemaIds.tree,
      { description: 'Updated description' },
      testAdminId
    );
    logTest('Update CustomApiSchema', updatedSchema.description === 'Updated description');

    // Test CustomApiSchema get
    const retrievedSchema = await customApiSchemaService.getCustomApiSchemaById(testCustomApiSchemaIds.tree);
    logTest('Get CustomApiSchema by ID', retrievedSchema._id.toString() === testCustomApiSchemaIds.tree.toString());

    // Test CustomApiSchema get by code
    const schemaByCode = await customApiSchemaService.getCustomApiSchemaByCode('test_tree_api');
    logTest('Get CustomApiSchema by code', schemaByCode.code === 'test_tree_api');

    // Test instance update
    const updatedSet = await customApiSetService.updateCustomApiSetById(
      testCustomApiSetIds.treeSystem,
      { name: 'Updated Instance Name' },
      testAdminId
    );
    logTest('Update CustomApiSet', updatedSet.name === 'Updated Instance Name');

    // Test instance get
    const retrievedSet = await customApiSetService.getCustomApiSetById(
      testCustomApiSetIds.treeSystem,
      testAdminId
    );
    logTest('Get CustomApiSet by ID', retrievedSet._id.toString() === testCustomApiSetIds.treeSystem.toString());
  } catch (error) {
    logTest('CRUD operations', false);
    log(`Error: ${error.message}`, 'red');
  }
};

const testItemOperations = async () => {
  logSection('Testing Item-Level Operations');

  try {
    // Add item
    const setWithNewItem = await customApiSetService.addCustomApiSetItem(
      testCustomApiSetIds.treeSystem,
      {
        id: 'ABC.NEW',
        path: 'ABC.NEW',
        parent_id: 'ABC',
        name: 'NEW',
        value: 'new item',
      },
      testAdminId
    );
    const hasNewItem = setWithNewItem.data.items.some((item) => item.id === 'ABC.NEW');
    logTest('Add item to instance', hasNewItem);

    // Update item
    await customApiSetService.updateCustomApiSetItem(
      testCustomApiSetIds.treeSystem,
      'ABC.NEW',
      { value: 'updated value' },
      testAdminId
    );
    // Wait a bit for save to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    const updatedSet = await customApiSetService.getCustomApiSetById(
      testCustomApiSetIds.treeSystem,
      testAdminId
    );
    const updatedItem = updatedSet.data.items.find((item) => item.id === 'ABC.NEW');
    const itemValue = updatedItem?.value || updatedItem?.get?.('value') || updatedItem?.toObject?.()?.value;
    const testPassed = updatedItem && itemValue === 'updated value';
    if (!testPassed) {
      log(`  Expected value 'updated value', got: ${JSON.stringify(updatedItem)}`, 'yellow');
    }
    logTest('Update item in instance', testPassed);

    // Remove item
    await customApiSetService.removeCustomApiSetItem(testCustomApiSetIds.treeSystem, 'ABC.NEW', testAdminId);
    const setAfterRemove = await customApiSetService.getCustomApiSetById(
      testCustomApiSetIds.treeSystem,
      testAdminId
    );
    const itemRemoved = !setAfterRemove.data.items.some((item) => item.id === 'ABC.NEW');
    logTest('Remove item from instance', itemRemoved);
  } catch (error) {
    logTest('Item-level operations', false);
    log(`Error: ${error.message}`, 'red');
  }
};

const testScopePermissions = async () => {
  logSection('Testing Scope-Based Permissions');

  try {
    // Test user cannot access another user's instance
    try {
      await customApiSetService.getCustomApiSetById(testCustomApiSetIds.listUser, testAdminId);
      logTest('User cannot access another user instance', false);
    } catch (error) {
      logTest('User cannot access another user instance', error.statusCode === 403);
    }

    // Test user can access system-scoped instance
    const systemSet = await customApiSetService.getCustomApiSetById(
      testCustomApiSetIds.treeSystem,
      testUserId
    );
    logTest('User can access system-scoped instance', systemSet.scope === 'system');

    // Test user cannot update another user's instance
    try {
      await customApiSetService.updateCustomApiSetById(
        testCustomApiSetIds.listUser,
        { name: 'Hacked' },
        testAdminId
      );
      logTest('User cannot update another user instance', false);
    } catch (error) {
      logTest('User cannot update another user instance', error.statusCode === 403);
    }
  } catch (error) {
    logTest('Scope-based permissions', false);
    log(`Error: ${error.message}`, 'red');
  }
};

const testModelIntegration = async () => {
  logSection('Testing Model Integration');

  try {
    // Create test model
    const model = await modelService.createModel(testUserId, {
      name: 'Test Model',
      main_api: 'Vehicle',
      visibility: 'private',
      vehicle_category: 'EV',
    });
    testModelId = model;

    // Link custom_api_sets
    await modelService.updateModelById(
      testModelId,
      { custom_api_sets: [testCustomApiSetIds.treeSystem] },
      testUserId
    );
    const modelWithSets = await modelService.getModelById(testModelId, testUserId);
    logTest('Link custom_api_sets to model', modelWithSets.custom_api_sets.length === 1);

    // Test user cannot link inaccessible instance (listUser is owned by testUserId, but we're using testAdminId to try to access it)
    // Actually, wait - testUserId owns listUser, so they should be able to link it
    // Let's test with a different scenario - admin trying to link user's instance should work
    // Actually the test logic is wrong - testUserId owns listUser, so they CAN link it
    // Let's create another user's instance and test that
    try {
      // Create another user instance owned by admin
      const adminOwnedSet = await customApiSetService.createCustomApiSet(
        {
          custom_api_schema: testCustomApiSchemaIds.list,
          custom_api_schema_code: 'test_list_api',
          scope: 'user',
          name: 'Admin Owned Instance',
          data: {
            items: [{ id: 'admin_api', path: '/admin', name: 'Admin API', method: 'GET', request: '{}' }],
            metadata: {},
          },
        },
        testAdminId
      );
      // Now testUserId tries to link admin's user-scoped instance (should fail)
      await modelService.updateModelById(
        testModelId,
        { custom_api_sets: [adminOwnedSet._id] },
        testUserId
      );
      logTest('Reject inaccessible instance linking', false);
      // Cleanup
      await customApiSetService.deleteCustomApiSetById(adminOwnedSet._id, testAdminId);
    } catch (error) {
      logTest('Reject inaccessible instance linking', error.statusCode === 403 || error.message.includes('access'));
    }
  } catch (error) {
    logTest('Model integration', false);
    log(`Error: ${error.message}`, 'red');
  }
};

const testValidation = async () => {
  logSection('Testing Validation');

  try {
    // Test invalid tree structure (parent not found)
    try {
      await customApiSetService.createCustomApiSet(
        {
          custom_api_schema: testCustomApiSchemaIds.tree,
          custom_api_schema_code: 'test_tree_api',
          scope: 'system',
          name: 'Invalid Tree',
          data: {
            items: [{ id: 'CHILD', path: 'CHILD', parent_id: 'NONEXISTENT', name: 'Child' }],
            metadata: {},
          },
        },
        testAdminId
      );
      logTest('Reject invalid tree structure', false);
    } catch (error) {
      logTest('Reject invalid tree structure', error.message.includes('Validation failed'));
    }

    // Test missing required attribute
    try {
      await customApiSetService.addCustomApiSetItem(
        testCustomApiSetIds.listUser,
        {
          id: 'invalid',
          path: '/invalid',
          method: 'GET',
          // Missing required 'name' attribute
        },
        testUserId
      );
      logTest('Reject missing required attribute', false);
    } catch (error) {
      logTest('Reject missing required attribute', error.message.includes('required attribute'));
    }
  } catch (error) {
    logTest('Validation tests', false);
    log(`Error: ${error.message}`, 'red');
  }
};

// Main test runner
const runTests = async () => {
  log('\n🚀 Starting Custom API System Self-Test\n', 'blue');

  try {
    await createTestUsers();
    await createTestCustomApiSchemas();
    await createTestCustomApiSets();
    await testCRUDOperations();
    await testItemOperations();
    await testScopePermissions();
    await testModelIntegration();
    await testValidation();

    log('\n✅ All tests completed!\n', 'green');
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await cleanup();
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
keepData = args.includes('--keep-data');

if (args.includes('--clean')) {
  log('Cleaning existing test data...', 'yellow');
  mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {
      await User.deleteMany({ email: { $in: ['test-admin@plugin-api.test', 'test-user@plugin-api.test'] } });
      await CustomApiSchema.deleteMany({ code: { $in: ['test_tree_api', 'test_list_api', 'test_graph_api'] } });
      await CustomApiSet.deleteMany({ custom_api_schema_code: { $in: ['test_tree_api', 'test_list_api', 'test_graph_api'] } });
      await Model.deleteMany({ name: 'Test Model' });
      log('Cleanup completed', 'green');
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((error) => {
      log(`Cleanup error: ${error.message}`, 'red');
      process.exit(1);
    });
} else {
  // Run tests
  mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(() => {
      log('Connected to MongoDB', 'green');
      runTests();
    })
    .catch((error) => {
      log(`Connection error: ${error.message}`, 'red');
      process.exit(1);
    });
}

