const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Path to your service account key JSON file
const serviceAccountPath = path.join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        projectId: process.env.FIREBASE_PROJECT_ID || 'shnoor-exam'
    });
}

// Export admin instance for use in other modules
module.exports = admin;
