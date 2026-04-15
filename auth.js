// 1. FIREBASE CONFIGURATION
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHaYZpz2GhafrWh9mxac6bBae2t6cWV70",
  authDomain: "alaprajztervezo.firebaseapp.com",
  projectId: "alaprajztervezo",
  storageBucket: "alaprajztervezo.firebasestorage.app",
  messagingSenderId: "1068490270194",
  appId: "1:1068490270194:web:b5468082f3b1355ee6b76b",
  measurementId: "G-L4477L00VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// 2. DOM ELEMENTS
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');

const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authError = document.getElementById('authError');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

// 3. LISTEN TO AUTHENTICATION STATE
// This magically runs every time the user logs in or logs out
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in -> Hide login screen, show app
        loginScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        console.log("Logged in as:", user.email);
    } else {
        // User is logged out -> Show login screen, hide app
        loginScreen.style.display = 'flex';
        mainApp.style.display = 'none';
    }
});

// 4. LOGIN FUNCTION
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.style.display = 'none';

    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            authError.innerText = error.message;
            authError.style.display = 'block';
        });
});

// 5. REGISTER FUNCTION
registerBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.style.display = 'none';

    auth.createUserWithEmailAndPassword(email, password)
        .catch((error) => {
            authError.innerText = error.message;
            authError.style.display = 'block';
        });
});

// 6. LOGOUT FUNCTION
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        // Clear inputs when signing out
        emailInput.value = '';
        passwordInput.value = '';
    });
});