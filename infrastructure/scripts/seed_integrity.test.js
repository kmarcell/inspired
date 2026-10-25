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
const userPasses = load('user_passes.json');
const studioClaims = load('studio_claims.json');
const { getEmulatorConfig, assertEmulatorOnly } = require('./lib/emulator');

const byId = (list, id) => list.find((x) => x.id === id);

test('seed ids are unique per collection', () => {
  for (const list of [users, studios, communities, currencies, policies, userPasses, studioClaims]) {
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

test('expired pass seed (pass_sarah_expired_pack) belongs to user_sarah and is expired', () => {
  const pass = byId(userPasses, 'pass_sarah_expired_pack');
  assert.ok(pass, 'expired pass exists');
  assert.equal(pass.userId, 'user_sarah');
  assert.equal(pass.status, 'expired');
  assert.ok(new Date(pass.expiresAt) < new Date(), 'expiresAt is in the past');
});

test('full class seed (class_full_waitlist) is at maximum capacity with empty waitlist', () => {
  const cls = byId(studioClasses, 'class_full_waitlist');
  assert.ok(cls, 'full class exists');
  assert.equal(cls.capacity, 1);
  assert.equal(cls.bookedCount, 1);
  assert.deepEqual(cls.waitlist, []);
  assert.ok(byId(studios, cls.studioId), 'studio exists');
});

test('temporarily closed studio seed (studio_temp_closed) has temp_closed status and statusNote', () => {
  const studio = byId(studios, 'studio_temp_closed');
  assert.ok(studio, 'temp closed studio exists');
  assert.equal(studio.status, 'temp_closed');
  assert.ok(studio.statusNote && studio.statusNote.length > 0, 'statusNote is present');
  assert.equal(studio.ownerId, 'user_sophia_vane');
});

test('unclaimed shadow studio seed (studio_shadow_kew) has isClaimed=false and no owner', () => {
  const studio = byId(studios, 'studio_shadow_kew');
  assert.ok(studio, 'shadow studio exists');
  assert.equal(studio.isClaimed, false);
  assert.equal(studio.ownerId, '');
});

test('private teacher persona (user_teacher_private) has isProfilePublic=false and is a teacher', () => {
  const teacher = byId(users, 'user_teacher_private');
  assert.ok(teacher, 'private teacher persona exists');
  assert.equal(teacher.isTeacher, true);
  assert.equal(teacher.privacySettings.isProfilePublic, false);
});

test('zero-schedule teacher persona (user_teacher_zerosched) has no scheduled studio classes', () => {
  const teacher = byId(users, 'user_teacher_zerosched');
  assert.ok(teacher, 'zero-sched teacher persona exists');
  assert.equal(teacher.isTeacher, true);
  const classes = studioClasses.filter((c) => c.teacherId === teacher.id);
  assert.equal(classes.length, 0, 'teacher has zero scheduled classes');
});

test('pending claim seed (claim_pending_seed) references shadow studio and has pending status', () => {
  const claim = byId(studioClaims, 'claim_pending_seed');
  assert.ok(claim, 'pending claim exists');
  assert.equal(claim.status, 'pending');
  assert.equal(claim.studioId, 'studio_shadow_kew');
  assert.equal(claim.userId, 'user_newbie');
});
