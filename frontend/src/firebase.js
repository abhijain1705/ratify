import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Import GoogleAuthProvider

const firebaseConfig = {
    apiKey: "AIzaSyDngtLyT71KXbxkolKGhf4DKqJfKNPENvc",
    authDomain: "ratify-e2f8a.firebaseapp.com",
    projectId: "ratify-e2f8a",
    storageBucket: "ratify-e2f8a.firebasestorage.app",
    messagingSenderId: "834938185421",
    appId: "1:834938185421:web:17f2f68374f36d085bab84",
    measurementId: "G-FQD0RB1VSZ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Add auth variable
export const googleProvider = new GoogleAuthProvider(); // Define googleProvider
