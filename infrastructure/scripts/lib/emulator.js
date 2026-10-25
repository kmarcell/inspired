// Single source of truth for Firebase emulator hosts/ports and a hard guard that
// keeps test tooling (seeder, persona cloning, cleanup) away from real cloud projects.
// Ports come from firebase.json; environment variables may override them.
const path = require('path');

const firebaseConfig = require(path.join(__dirname, '../../../firebase.json'));

const PROJECT_ID = 'inspired-yoga-app-staging';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

function getEmulatorConfig(env = process.env) {
  const emulators = firebaseConfig.emulators || {};
  const firestorePort = emulators.firestore && emulators.firestore.port;
  const authPort = emulators.auth && emulators.auth.port;
  if (!firestorePort || !authPort) {
    throw new Error('firebase.json must define emulators.firestore.port and emulators.auth.port');
  }
  return {
    projectId: PROJECT_ID,
    firestoreHost: env.FIRESTORE_EMULATOR_HOST || `localhost:${firestorePort}`,
    authHost: env.FIREBASE_AUTH_EMULATOR_HOST || `localhost:${authPort}`,
  };
}

function isLocalHost(hostWithPort) {
  const host = String(hostWithPort).replace(/:\d+$/, '');
  return LOCAL_HOSTS.includes(host);
}

/**
 * Throws unless both Firestore and Auth point at a local emulator.
 * Call this before any destructive operation (clone, cleanup, sweep, clear).
 */
function assertEmulatorOnly(config = getEmulatorConfig()) {
  for (const [name, host] of [['Firestore', config.firestoreHost], ['Auth', config.authHost]]) {
    if (!host || !isLocalHost(host)) {
      throw new Error(`Refusing to run: ${name} host "${host}" is not a local emulator.`);
    }
  }
  return config;
}

/** Points the Admin SDK at the emulator (must run before admin.firestore()/auth() are used). */
function applyEmulatorEnv(config = assertEmulatorOnly()) {
  process.env.FIRESTORE_EMULATOR_HOST = config.firestoreHost;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = config.authHost;
  return config;
}

module.exports = { PROJECT_ID, getEmulatorConfig, assertEmulatorOnly, applyEmulatorEnv, isLocalHost };
