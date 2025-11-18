const admin = require('firebase-admin');

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) return admin;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || null;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;

  try {
    if (serviceAccountJson) {
      const serviceAccount = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket
      });
      return admin;
    }

    // If GOOGLE_APPLICATION_CREDENTIALS is set and points to a file, admin can initialize without explicit cert
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ storageBucket });
      return admin;
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err.message || err);
    return null;
  }

  // not configured
  return null;
}

module.exports = { initFirebaseAdmin };
