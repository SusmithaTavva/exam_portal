import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYVg8jfW_ZXZ_t5hxB83fWEKfj6AWmjbg",
    authDomain: "mcq-portal-c7478.firebaseapp.com",
    projectId: "mcq-portal-c7478",
    storageBucket: "mcq-portal-c7478.firebasestorage.app",
    messagingSenderId: "288409860357",
    appId: "1:288409860357:web:5a8df69a49ee8999729f6c",
    measurementId: "G-N1MR6R4RQM"
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
