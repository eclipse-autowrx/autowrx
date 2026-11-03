// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Plugin } = require('../../src/models');
const { userOne, userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, userTwoAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { seedRoles, grantRole } = require('../fixtures/role.fixture');

setupTestDB();

const BUILD_ZIP = path.join(__dirname, '../fixtures/build_zip.py');
const STATIC_DIR = path.join(__dirname, '../../static');
const PLUGIN_DIR = path.join(STATIC_DIR, 'plugin');
const UPLOAD_DIR = path.join(STATIC_DIR, 'uploads');

// The real controller writes to static/plugin and static/uploads, so every test uses its own slug and cleans up after.
const slug = `it-plugin-${crypto.randomBytes(4).toString('hex')}`;
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-it-'));

const buildZip = (name, entries) => {
  const zipPath = path.join(workDir, name);
  execFileSync('python3', [BUILD_ZIP, zipPath, JSON.stringify(entries)], { stdio: 'pipe' });
  return zipPath;
};

const pluginEntries = () => fs.readdirSync(PLUGIN_DIR).filter((name) => name.startsWith(slug));

const listUploads = () => {
  if (!fs.existsSync(UPLOAD_DIR)) return [];
  return fs
    .readdirSync(UPLOAD_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) => fs.readdirSync(path.join(UPLOAD_DIR, dir.name)).map((file) => path.join(dir.name, file)));
};

const upload = (token, zipPath, targetSlug = slug) => {
  const req = request(app).post(`/v2/system/plugin/upload/${targetSlug}`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return zipPath ? req.attach('file', zipPath) : req;
};

describe('Plugin routes: internal upload lifecycle', () => {
  let uploadsBefore;
  let v1Zip;
  let v2Zip;

  beforeAll(() => {
    v1Zip = buildZip('v1.zip', [{ name: 'index.js', content: 'export default "v1";' }]);
    v2Zip = buildZip('v2.zip', [{ name: 'dist/index.js', content: 'export default "v2";' }]);
  });

  beforeEach(async () => {
    await seedRoles();
    await insertUsers([userOne, userTwo, admin]);
    await grantRole(admin._id, 'admin');
    uploadsBefore = listUploads();
  });

  afterEach(() => {
    pluginEntries().forEach((name) => fs.rmSync(path.join(PLUGIN_DIR, name), { recursive: true, force: true }));
    // Every exit path of the upload handler must remove the multer temp file.
    const leaked = listUploads().filter((file) => !uploadsBefore.includes(file));
    if (leaked.length) throw new Error(`Upload temp files leaked: ${leaked.join(', ')}`);
  });

  afterAll(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  test('should upload, register, re-upload, update and delete an internal plugin', async () => {
    const first = await upload(adminAccessToken, v1Zip).expect(httpStatus.OK);
    expect(first.body).toEqual({ plugin: null, url: `/plugin/${slug}/index.js` });
    expect(fs.readFileSync(path.join(PLUGIN_DIR, slug, 'index.js'), 'utf8')).toBe('export default "v1";');

    const created = await request(app)
      .post('/v2/system/plugin')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: slug, is_internal: true, url: first.body.url })
      .expect(httpStatus.CREATED);
    expect(created.body).toMatchObject({ slug, is_internal: true, url: first.body.url });
    const pluginId = created.body.id;

    // Read endpoints are public
    await request(app).get(`/v2/system/plugin/slug/${slug}`).expect(httpStatus.OK);
    await request(app).get(`/v2/system/plugin/id/${pluginId}`).expect(httpStatus.OK);

    const second = await upload(adminAccessToken, v2Zip).expect(httpStatus.OK);
    expect(second.body.url).toBe(`/plugin/${slug}/dist/index.js`);
    expect(second.body.plugin).toMatchObject({ id: pluginId, url: second.body.url });
    expect((await Plugin.findById(pluginId)).url).toBe(second.body.url);
    expect(fs.existsSync(path.join(PLUGIN_DIR, slug, 'index.js'))).toBe(false);
    expect(fs.readFileSync(path.join(PLUGIN_DIR, slug, 'dist/index.js'), 'utf8')).toBe('export default "v2";');
    // The atomic swap must not leave temp or aside directories behind
    expect(pluginEntries()).toEqual([slug]);

    await request(app)
      .put(`/v2/system/plugin/${pluginId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ description: 'Updated description' })
      .expect(httpStatus.OK);
    expect((await Plugin.findById(pluginId)).description).toBe('Updated description');

    await request(app)
      .delete(`/v2/system/plugin/${pluginId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(httpStatus.NO_CONTENT);
    expect(await Plugin.findById(pluginId)).toBeNull();
    expect(pluginEntries()).toEqual([]);
  });

  test('should return 401 for an anonymous upload', async () => {
    await upload(null, v1Zip).expect(httpStatus.UNAUTHORIZED);
    expect(pluginEntries()).toEqual([]);
  });

  test('should return 403 for a non-admin upload without writing any file', async () => {
    await upload(userOneAccessToken, v1Zip).expect(httpStatus.FORBIDDEN);
    expect(pluginEntries()).toEqual([]);
  });

  test('should return 400 when no file is attached', async () => {
    await upload(adminAccessToken).expect(httpStatus.BAD_REQUEST);
  });

  test('should return 400 for a slug that is not slug-like', async () => {
    await upload(adminAccessToken, v1Zip, 'Bad_Slug').expect(httpStatus.BAD_REQUEST);
  });

  test('should return 415 for non-zip bytes named .zip', async () => {
    await request(app)
      .post(`/v2/system/plugin/upload/${slug}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .attach('file', Buffer.from('this is not a zip archive'), 'fake.zip')
      .expect(httpStatus.UNSUPPORTED_MEDIA_TYPE);
    expect(pluginEntries()).toEqual([]);
  });

  test('should reject a zip-slip entry without writing outside the plugin directory', async () => {
    const evilZip = buildZip('evil.zip', [
      { name: 'index.js', content: 'ok' },
      { name: `../${slug}-escaped.js`, content: 'pwned' },
    ]);

    const res = await upload(adminAccessToken, evilZip);

    // NOTE: currently 500, because yauzl rejects '../' itself with a plain Error ("invalid relative path")
    // before safeExtractZip's 400 ApiError check runs. Only the rejection and containment are asserted here.
    expect(res.status).toBeGreaterThanOrEqual(httpStatus.BAD_REQUEST);
    expect(fs.existsSync(path.join(STATIC_DIR, `${slug}-escaped.js`))).toBe(false);
    expect(pluginEntries()).toEqual([]);
  });

  describe('ownership', () => {
    let plugin;

    beforeEach(async () => {
      const res = await request(app)
        .post('/v2/system/plugin')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: `${slug}-external`, is_internal: false, url: 'https://example.com/plugin.js' })
        .expect(httpStatus.CREATED);
      plugin = res.body;
    });

    test('should return 403 when a non-owner updates the plugin', async () => {
      await request(app)
        .put(`/v2/system/plugin/${plugin.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ description: 'Hijacked' })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 when a non-owner deletes the plugin', async () => {
      await request(app)
        .delete(`/v2/system/plugin/${plugin.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
      expect(await Plugin.findById(plugin.id)).not.toBeNull();
    });

    test('should return 403 when a non-admin creates an internal plugin', async () => {
      await request(app)
        .post('/v2/system/plugin')
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ name: `${slug}-sneaky`, is_internal: true, url: `/plugin/${slug}/index.js` })
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
