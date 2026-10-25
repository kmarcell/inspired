// Seed integrity checks. Run with: node --test infrastructure/scripts/seed_integrity.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const load = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, '../seeds', name), 'utf8'));
const users = load('users.json');
const studios = load('studios.json');
const communities = load('communities.json');
const currencies = load('company_currencies.json');
const policies = load('studio_currency_policies.json');
const studioClasses = load('studio_classes.json');
const studioMembers = load('studio_members.json');
const { getEmulatorConfig, assertEmulatorOnly } = require('./lib/emulator');

const byId = (list, id) => list.find((x) => x.id === id);

test('seed ids are unique per collection', () => {
  for (const list of [users, studios, communities, currencies, policies]) {
    const ids = list.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('non-teaching owner persona (user_owner_noteach) owns a studio but does not teach', () => {
  const owner = byId(users, 'user_owner_noteach');
  const studio = byId(studios, 'studio_shoreditch_006');
  assert.ok(owner, 'persona exists');
  assert.equal(owner.email, 'user_owner_noteach@inspired.test');
  assert.equal(owner.isTeacher, false);
  assert.ok(!owner.teachingStudios || owner.teachingStudios.length === 0);
  assert.equal(studio.ownerId, owner.id);
  assert.ok(!studio.assignedTeachers.some((t) => t.id === owner.id), 'owner is not an assigned teacher');
});

test('shoreditch studio is taught by an existing visiting teacher who lists it', () => {
  const studio = byId(studios, 'studio_shoreditch_006');
  assert.ok(studio.assignedTeachers.length > 0);
  for (const t of studio.assignedTeachers) {
    const teacher = byId(users, t.id);
    assert.ok(teacher && teacher.isTeacher, `${t.id} is a teacher`);
    assert.ok(teacher.teachingStudios.includes(studio.id), `${t.id} lists the studio`);
  }
});

test('shoreditch classes are seeded and taught by assigned teachers, never the owner', () => {
  const owner = 'user_owner_noteach';
  const classes = studioClasses.filter((c) => c.studioId === 'studio_shoreditch_006');
  assert.ok(classes.length >= 2, 'at least two classes seeded');
  const studio = byId(studios, 'studio_shoreditch_006');
  for (const c of classes) {
    assert.notEqual(c.teacherId, owner);
    assert.ok(studio.assignedTeachers.some((t) => t.id === c.teacherId));
  }
});

test('studio classes seed: unique ids, existing studios, today placeholder, valid capacity', () => {
  const ids = studioClasses.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of studioClasses) {
    assert.ok(byId(studios, c.studioId), `${c.id} studio exists`);
    assert.ok(byId(users, c.teacherId), `${c.id} teacher exists`);
    assert.equal(c.dateString, '{{today}}', `${c.id} uses the today placeholder`);
    assert.ok(c.bookedCount <= c.capacity, `${c.id} bookedCount within capacity`);
  }
});

test('studio members seed: existing studios, unique per studio, no leaked studioId needed by app', () => {
  const seen = new Set();
  for (const m of studioMembers) {
    assert.ok(byId(studios, m.studioId), `${m.id} studio exists`);
    const key = `${m.studioId}/${m.id}`;
    assert.ok(!seen.has(key), `${key} duplicated`);
    seen.add(key);
  }
});

test('emulator config reads firebase.json ports and honours env overrides', () => {
  const cfg = getEmulatorConfig({});
  assert.equal(cfg.firestoreHost, 'localhost:8081');
  assert.equal(cfg.authHost, 'localhost:9099');
  assert.equal(getEmulatorConfig({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:9000' }).firestoreHost, '127.0.0.1:9000');
});

test('emulator guard refuses anything that is not a local emulator', () => {
  assert.doesNotThrow(() => assertEmulatorOnly({ firestoreHost: 'localhost:8081', authHost: '127.0.0.1:9099' }));
  assert.throws(() => assertEmulatorOnly({ firestoreHost: 'firestore.googleapis.com:443', authHost: 'localhost:9099' }), /Refusing/);
  assert.throws(() => assertEmulatorOnly({ firestoreHost: 'localhost:8081', authHost: 'identitytoolkit.googleapis.com' }), /Refusing/);
  assert.throws(() => assertEmulatorOnly({ firestoreHost: '', authHost: 'localhost:9099' }), /Refusing/);
});

test('shoreditch pricing: custom_override policy accepts only its own currencies', () => {
  const policy = byId(policies, 'studio_shoreditch_006');
  assert.equal(policy.policyMode, 'custom_override');
  assert.ok(policy.acceptedCurrencyIds.length > 0);
  for (const id of policy.acceptedCurrencyIds) {
    const c = byId(currencies, id);
    assert.ok(c, `${id} exists`);
    assert.equal(c.studioId, 'studio_shoreditch_006');
  }
});

test('shoreditch studio community is linked and joined by the owner', () => {
  const community = byId(communities, 'comm_studio_studio_shoreditch_006');
  assert.equal(community.linkedStudioId, 'studio_shoreditch_006');
  assert.ok(byId(users, 'user_owner_noteach').joinedCommunities.includes(community.id));
});
