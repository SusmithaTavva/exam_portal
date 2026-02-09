import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBiIyPB-41cjLPBB0UGIq2uPG9_Eld5K38",
    authDomain: "shnoor-exam.firebaseapp.com",
    projectId: "shnoor-exam",
    storageBucket: "shnoor-exam.firebasestorage.app",
    messagingSenderId: "219634149933",
    appId: "1:219634149933:web:65282df2b729edb82426a4",
    measurementId: "G-5K1Q6KS44E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export auth and helper functions
export {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
};
