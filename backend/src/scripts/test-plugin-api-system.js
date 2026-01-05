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
const { User, PluginAPI, PluginApiInstance, Model } = require('../models');
const { pluginApiService, pluginApiInstanceService, modelService } = require('../services');
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
let testPluginApiIds = {};
let testInstanceIds = {};
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
    log(`PluginAPI IDs: ${JSON.stringify(testPluginApiIds)}`, 'yellow');
    log(`Instance IDs: ${JSON.stringify(testInstanceIds)}`, 'yellow');
    log(`Model ID: ${testModelId}`, 'yellow');
    return;
  }

  log('\nCleaning up test data...', 'yellow');
  try {
    if (testModelId) await Model.deleteOne({ _id: testModelId });
    for (const instanceId of Object.values(testInstanceIds)) {
      await PluginApiInstance.deleteOne({ _id: instanceId });
    }
    for (const apiId of Object.values(testPluginApiIds)) {
      await PluginAPI.deleteOne({ _id: apiId });
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

const createTestPluginAPIs = async () => {
  logSection('Creating PluginAPI Schemas');

  try {
    // Tree API schema
    const treeAPI = await pluginApiService.createPluginAPI(
      {
        code: 'test_tree_api',
        name: 'Test Tree API',
        description: 'Test tree structure API',
        type: 'tree',
        attributes: [
          { name: 'name', data_type: 'string', required: true },
          { name: 'value', data_type: 'mixed', required: false },
          { name: 'description', data_type: 'string', required: false },
        ],
        tree_config: { separator: '.', max_depth: 10 },
      },
      testAdminId
    );
    testPluginApiIds.tree = treeAPI._id;
    logTest('Create Tree API schema', true);

    // List API schema
    const listAPI = await pluginApiService.createPluginAPI(
      {
        code: 'test_list_api',
        name: 'Test List API',
        description: 'Test flat list API',
        type: 'list',
        attributes: [
          { name: 'name', data_type: 'string', required: true },
          { name: 'path', data_type: 'string', required: true },
          { name: 'method', data_type: 'string', required: true },
          { name: 'request', data_type: 'string', required: true },
        ],
      },
      testAdminId
    );
    testPluginApiIds.list = listAPI._id;
    logTest('Create List API schema', true);

    // Graph API schema
    const graphAPI = await pluginApiService.createPluginAPI(
      {
        code: 'test_graph_api',
        name: 'Test Graph API',
        description: 'Test graph structure API',
        type: 'graph',
        attributes: [
          { name: 'name', data_type: 'string', required: true },
          { name: 'type', data_type: 'string', required: true },
        ],
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
    testPluginApiIds.graph = graphAPI._id;
    logTest('Create Graph API schema', true);

    // Test duplicate code rejection
    try {
      await pluginApiService.createPluginAPI(
        {
          code: 'test_tree_api',
          name: 'Duplicate',
          type: 'tree',
        },
        testAdminId
      );
      logTest('Reject duplicate code', false);
    } catch (error) {
      logTest('Reject duplicate code', error.message.includes('already exists'));
    }
  } catch (error) {
    logTest('Create PluginAPI schemas', false);
    throw error;
  }
};

const createTestInstances = async () => {
  logSection('Creating PluginApiInstance Instances');

  try {
    // System-scoped tree instance
    const treeInstance = await pluginApiInstanceService.createInstance(
      {
        plugin_api: testPluginApiIds.tree,
        plugin_api_code: 'test_tree_api',
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
    testInstanceIds.treeSystem = treeInstance._id;
    logTest('Create system-scoped tree instance', true);

    // User-scoped list instance
    const listInstance = await pluginApiInstanceService.createInstance(
      {
        plugin_api: testPluginApiIds.list,
        plugin_api_code: 'test_list_api',
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
    testInstanceIds.listUser = listInstance._id;
    logTest('Create user-scoped list instance', true);

    // Graph instance
    const graphInstance = await pluginApiInstanceService.createInstance(
      {
        plugin_api: testPluginApiIds.graph,
        plugin_api_code: 'test_graph_api',
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
    testInstanceIds.graphSystem = graphInstance._id;
    logTest('Create graph instance', true);
  } catch (error) {
    logTest('Create PluginApiInstance instances', false);
    throw error;
  }
};

const testCRUDOperations = async () => {
  logSection('Testing CRUD Operations');

  try {
    // Test PluginAPI update
    const updatedAPI = await pluginApiService.updatePluginAPIById(
      testPluginApiIds.tree,
      { description: 'Updated description' },
      testAdminId
    );
    logTest('Update PluginAPI', updatedAPI.description === 'Updated description');

    // Test PluginAPI get
    const retrievedAPI = await pluginApiService.getPluginAPIById(testPluginApiIds.tree);
    logTest('Get PluginAPI by ID', retrievedAPI._id.toString() === testPluginApiIds.tree.toString());

    // Test PluginAPI get by code
    const apiByCode = await pluginApiService.getPluginAPIByCode('test_tree_api');
    logTest('Get PluginAPI by code', apiByCode.code === 'test_tree_api');

    // Test instance update
    const updatedInstance = await pluginApiInstanceService.updateInstanceById(
      testInstanceIds.treeSystem,
      { name: 'Updated Instance Name' },
      testAdminId
    );
    logTest('Update PluginApiInstance', updatedInstance.name === 'Updated Instance Name');

    // Test instance get
    const retrievedInstance = await pluginApiInstanceService.getInstanceById(
      testInstanceIds.treeSystem,
      testAdminId
    );
    logTest('Get PluginApiInstance by ID', retrievedInstance._id.toString() === testInstanceIds.treeSystem.toString());
  } catch (error) {
    logTest('CRUD operations', false);
    log(`Error: ${error.message}`, 'red');
  }
};

const testItemOperations = async () => {
  logSection('Testing Item-Level Operations');

  try {
    // Add item
    const instanceWithNewItem = await pluginApiInstanceService.addInstanceItem(
      testInstanceIds.treeSystem,
      {
        id: 'ABC.NEW',
        path: 'ABC.NEW',
        parent_id: 'ABC',
        name: 'NEW',
        value: 'new item',
      },
      testAdminId
    );
    const hasNewItem = instanceWithNewItem.data.items.some((item) => item.id === 'ABC.NEW');
    logTest('Add item to instance', hasNewItem);

    // Update item
    await pluginApiInstanceService.updateInstanceItem(
      testInstanceIds.treeSystem,
      'ABC.NEW',
      { value: 'updated value' },
      testAdminId
    );
    // Wait a bit for save to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    const updatedInstance = await pluginApiInstanceService.getInstanceById(
      testInstanceIds.treeSystem,
      testAdminId
    );
    const updatedItem = updatedInstance.data.items.find((item) => item.id === 'ABC.NEW');
    const itemValue = updatedItem?.value || updatedItem?.get?.('value') || updatedItem?.toObject?.()?.value;
    const testPassed = updatedItem && itemValue === 'updated value';
    if (!testPassed) {
      log(`  Expected value 'updated value', got: ${JSON.stringify(updatedItem)}`, 'yellow');
    }
    logTest('Update item in instance', testPassed);

    // Remove item
    await pluginApiInstanceService.removeInstanceItem(testInstanceIds.treeSystem, 'ABC.NEW', testAdminId);
    const instanceAfterRemove = await pluginApiInstanceService.getInstanceById(
      testInstanceIds.treeSystem,
      testAdminId
    );
    const itemRemoved = !instanceAfterRemove.data.items.some((item) => item.id === 'ABC.NEW');
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
      await pluginApiInstanceService.getInstanceById(testInstanceIds.listUser, testAdminId);
      logTest('User cannot access another user instance', false);
    } catch (error) {
      logTest('User cannot access another user instance', error.statusCode === 403);
    }

    // Test user can access system-scoped instance
    const systemInstance = await pluginApiInstanceService.getInstanceById(
      testInstanceIds.treeSystem,
      testUserId
    );
    logTest('User can access system-scoped instance', systemInstance.scope === 'system');

    // Test user cannot update another user's instance
    try {
      await pluginApiInstanceService.updateInstanceById(
        testInstanceIds.listUser,
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

    // Link plugin_api_instances
    await modelService.updateModelById(
      testModelId,
      { plugin_api_instances: [testInstanceIds.treeSystem] },
      testUserId
    );
    const modelWithInstances = await modelService.getModelById(testModelId, testUserId);
    logTest('Link plugin_api_instances to model', modelWithInstances.plugin_api_instances.length === 1);

    // Test user cannot link inaccessible instance (listUser is owned by testUserId, but we're using testAdminId to try to access it)
    // Actually, wait - testUserId owns listUser, so they should be able to link it
    // Let's test with a different scenario - admin trying to link user's instance should work
    // Actually the test logic is wrong - testUserId owns listUser, so they CAN link it
    // Let's create another user's instance and test that
    try {
      // Create another user instance owned by admin
      const adminOwnedInstance = await pluginApiInstanceService.createInstance(
        {
          plugin_api: testPluginApiIds.list,
          plugin_api_code: 'test_list_api',
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
        { plugin_api_instances: [adminOwnedInstance._id] },
        testUserId
      );
      logTest('Reject inaccessible instance linking', false);
      // Cleanup
      await pluginApiInstanceService.deleteInstanceById(adminOwnedInstance._id, testAdminId);
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
      await pluginApiInstanceService.createInstance(
        {
          plugin_api: testPluginApiIds.tree,
          plugin_api_code: 'test_tree_api',
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
      await pluginApiInstanceService.addInstanceItem(
        testInstanceIds.listUser,
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
  log('\n🚀 Starting Plugin API System Self-Test\n', 'blue');

  try {
    await createTestUsers();
    await createTestPluginAPIs();
    await createTestInstances();
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
      await PluginAPI.deleteMany({ code: { $in: ['test_tree_api', 'test_list_api', 'test_graph_api'] } });
      await PluginApiInstance.deleteMany({ plugin_api_code: { $in: ['test_tree_api', 'test_list_api', 'test_graph_api'] } });
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

